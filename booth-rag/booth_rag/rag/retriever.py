from __future__ import annotations

import concurrent.futures as _cf
import re
from collections.abc import Sequence
from dataclasses import dataclass, field

from booth_rag.config import get_settings
from booth_rag.rag.bm25_store import BM25Hit, BM25Index
from booth_rag.rag.graph_store import KnowledgeGraph
from booth_rag.rag.query_intent import classify_queries
from booth_rag.rag.reranker import CrossEncoderReranker
from booth_rag.rag.vector_store import DualVectorIndex, RetrievedChunk, VectorIndex

_MAX_FINAL = 8
_MAX_SYMBOLS_IN_PROMPT = 8
_MAX_NEIGHBORS_IN_PROMPT = 10
_EMPTY_CHUNK_THRESHOLD = 80

_INTENT_PATTERNS: tuple[tuple[re.Pattern[str], dict[str, float]], ...] = (
    (
        re.compile(r"구성|구조|모듈|아키텍처|어디.*있|어디서.*돌|폴더|디렉토리"),
        {"outline": 1.5, "directory_summary": 1.9, "repo_map": 2.0},
    ),
    (
        re.compile(r"구현|동작|처리|어떻게.*돌|어떻게.*동작|로직|알고리즘"),
        {"function": 1.4, "class": 1.3, "symbol": 1.4},
    ),
    (
        re.compile(r"호출|불러|쓰이|사용.*되|어디서.*쓰|caller|callee"),
        {"function": 1.3, "symbol": 1.4, "class": 1.2},
    ),
    (
        re.compile(r"무엇|뭔지|정의|시그니처|API|signature|interface"),
        {"outline": 1.4, "function": 1.2, "class": 1.2},
    ),
)


def _intent_boost_factor(query: str, chunk_kind: str) -> float:
    if not query or not chunk_kind:
        return 1.0
    boost = 1.0
    for pattern, kind_boosts in _INTENT_PATTERNS:
        if pattern.search(query):
            boost = max(boost, kind_boosts.get(chunk_kind, 1.0))
    return boost


def _bm25_to_retrieved(hit: BM25Hit, fallback_rank: int) -> RetrievedChunk:
    return RetrievedChunk(
        rel_path=hit.rel_path,
        text=hit.text,
        score=hit.score if hit.score > 0 else 1.0 / (fallback_rank + 1),
        kind=hit.kind,
        symbol=hit.symbol,
        line_start=hit.line_start,
        line_end=hit.line_end,
        source_kind=hit.source_kind,
    )


def _is_low_value_chunk(chunk: RetrievedChunk) -> bool:
    text = (chunk.text or "").strip()
    if len(text) < _EMPTY_CHUNK_THRESHOLD:
        return True
    rel = chunk.rel_path.lower()
    return rel.endswith("__init__.py") and len(text) < 200


def _chunk_key(c: RetrievedChunk) -> tuple[str, int, int, str | None]:
    return (c.rel_path, c.line_start, c.line_end, c.symbol)


def reciprocal_rank_fusion(
    result_lists: Sequence[Sequence[RetrievedChunk]],
    *,
    rrf_k: int = 60,
    top_k: int = 8,
) -> list[RetrievedChunk]:
    """Fuse multiple ranked result lists into one via Reciprocal Rank Fusion.

    For each chunk, sum 1 / (rrf_k + rank) across every list that contains it.
    The de-dup key is (rel_path, line_start, line_end, symbol) so the same
    chunk appearing in two queries combines into one boosted result. The
    rrf_k=60 default follows Cormack et al. (2009).
    """
    scores: dict[tuple, float] = {}
    seen_chunks: dict[tuple, RetrievedChunk] = {}
    for results in result_lists:
        for rank, chunk in enumerate(results):
            key = _chunk_key(chunk)
            scores[key] = scores.get(key, 0.0) + 1.0 / (rrf_k + rank + 1)
            if key not in seen_chunks:
                seen_chunks[key] = chunk
    fused: list[RetrievedChunk] = []
    for key, fused_score in sorted(scores.items(), key=lambda kv: kv[1], reverse=True):
        base = seen_chunks[key]
        fused.append(
            RetrievedChunk(
                rel_path=base.rel_path,
                text=base.text,
                score=fused_score,
                kind=base.kind,
                symbol=base.symbol,
                line_start=base.line_start,
                line_end=base.line_end,
                source_kind=base.source_kind,
            )
        )
        if len(fused) >= top_k:
            break
    return fused


@dataclass
class HybridContext:
    chunks: list[RetrievedChunk] = field(default_factory=list)
    graph_neighbors: list[str] = field(default_factory=list)
    related_symbols: list[str] = field(default_factory=list)
    hub_files: list[tuple[str, float]] = field(default_factory=list)
    queries_used: list[str] = field(default_factory=list)

    def to_prompt_block(self) -> str:
        lines: list[str] = []
        for i, c in enumerate(self.chunks, start=1):
            header = f"[{i}] {c.rel_path}"
            if c.symbol:
                header += f"::{c.symbol}"
            if c.line_start:
                header += f" (L{c.line_start}-{c.line_end})"
            kind_label = f"{c.source_kind}·{c.kind}" if c.kind and c.kind != c.source_kind else c.source_kind
            header += f"  [{kind_label}]"
            lines.append(header)
            lines.append(c.text.strip())
            lines.append("")
        if self.graph_neighbors:
            lines.append("연관 파일 (그래프 1-hop):")
            lines.extend(f"- {n}" for n in self.graph_neighbors[:_MAX_NEIGHBORS_IN_PROMPT])
        if self.related_symbols:
            lines.append("연관 심볼 (defines 엣지):")
            lines.extend(f"- {s}" for s in self.related_symbols[:_MAX_SYMBOLS_IN_PROMPT])
        if self.hub_files:
            lines.append("프로젝트 허브 파일 (PageRank Top):")
            lines.extend(f"- {p}  (score={s:.4f})" for p, s in self.hub_files)
        return "\n".join(lines)


class HybridRetriever:
    _executor: _cf.ThreadPoolExecutor | None = None

    @classmethod
    def _get_executor(cls) -> _cf.ThreadPoolExecutor:
        if cls._executor is None:
            cls._executor = _cf.ThreadPoolExecutor(max_workers=16, thread_name_prefix="retr-probe")
        return cls._executor

    def __init__(
        self,
        vector_index: VectorIndex,
        graph: KnowledgeGraph,
        bm25: BM25Index | None = None,
        reranker: CrossEncoderReranker | None = None,
    ):
        self._vector = vector_index
        self._graph = graph
        self._bm25 = bm25
        self._reranker = reranker
        self._settings = get_settings()

    def _dense_search(self, query: str, k: int) -> list[RetrievedChunk]:
        if self._settings.rag_use_mmr:
            return self._vector.search_mmr(
                query,
                k=k,
                fetch_k=self._settings.rag_fetch_k,
                lambda_mult=self._settings.rag_mmr_lambda,
            )
        return self._vector.search(query, k=k)

    def _bm25_search(self, query: str, k: int) -> list[RetrievedChunk]:
        if not (self._settings.rag_use_bm25 and self._bm25 and self._bm25.size):
            return []
        hits = self._bm25.search(query, k=k)
        return [_bm25_to_retrieved(h, rank) for rank, h in enumerate(hits)]

    def _probe_one(self, q: str, per_query_k: int, bm25_k: int) -> list[list[RetrievedChunk]]:
        out: list[list[RetrievedChunk]] = []
        out.append(self._dense_search(q, k=per_query_k))
        sparse = self._bm25_search(q, k=bm25_k)
        if sparse:
            out.append(sparse)
        return out

    def _dense_batch(self, queries: list[str], k: int) -> list[list[RetrievedChunk]]:
        skip_code = False
        skip_docs = False
        if isinstance(self._vector, DualVectorIndex) and self._settings.rag_dual_intent_routing:
            routing = classify_queries(list(queries))
            skip_code = not routing.use_code
            skip_docs = not routing.use_docs
        if self._settings.rag_use_mmr and hasattr(self._vector, "search_mmr_batch"):
            kwargs = {
                "k": k,
                "fetch_k": self._settings.rag_fetch_k,
                "lambda_mult": self._settings.rag_mmr_lambda,
            }
            if isinstance(self._vector, DualVectorIndex):
                return self._vector.search_mmr_batch(
                    queries, skip_code=skip_code, skip_docs=skip_docs, **kwargs
                )
            return self._vector.search_mmr_batch(queries, **kwargs)
        if hasattr(self._vector, "search_batch"):
            if isinstance(self._vector, DualVectorIndex):
                return self._vector.search_batch(
                    queries, k=k, skip_code=skip_code, skip_docs=skip_docs
                )
            return self._vector.search_batch(queries, k=k)
        return [self._dense_search(q, k=k) for q in queries]

    def retrieve(
        self,
        query: str,
        k: int = 6,
        graph_radius: int | None = None,
        queries: Sequence[str] | None = None,
    ) -> HybridContext:
        query_list = [q for q in (queries or [query]) if q and q.strip()]
        if not query_list:
            query_list = [query]
        effective_radius = graph_radius if graph_radius is not None else self._settings.graph_radius

        per_query_k = max(k, self._settings.rag_fetch_k // max(len(query_list), 1))
        bm25_k = self._settings.rag_bm25_k

        result_lists: list[list[RetrievedChunk]] = []
        ex = self._get_executor()
        dense_fut = ex.submit(self._dense_batch, query_list, per_query_k)
        bm25_futures = [ex.submit(self._bm25_search, q, bm25_k) for q in query_list]
        result_lists.extend(dense_fut.result())
        for bf in bm25_futures:
            sparse = bf.result()
            if sparse:
                result_lists.append(sparse)

        if len(result_lists) == 1:
            chunks = result_lists[0]
        else:
            chunks = reciprocal_rank_fusion(
                result_lists,
                rrf_k=self._settings.rag_rrf_k,
                top_k=max(k, _MAX_FINAL) * 2,
            )

        chunks = [c for c in chunks if not _is_low_value_chunk(c)]

        if self._reranker is not None and self._settings.rag_use_reranker and chunks:
            chunks = self._reranker.rerank(
                query,
                chunks,
                top_k=self._settings.rag_rerank_input_k,
            )

        seed_files = [c.rel_path for c in chunks if c.rel_path]
        seed_set = set(seed_files)

        neighbors = sorted(self._graph.neighbors(seed_files, radius=effective_radius))
        related_symbols = self._graph.symbol_neighbors(seed_files)

        ppr_scores: dict[str, float] = {}
        if self._settings.graph_use_pagerank and seed_files:
            ppr_scores = dict(self._graph.file_ppr_scores(seed_files, alpha=self._settings.graph_ppr_alpha))

        ppr_weight = self._settings.graph_ppr_weight if self._settings.graph_use_pagerank else 0.0
        max_ppr = max(ppr_scores.values(), default=0.0) or 1.0

        boosted: list[RetrievedChunk] = []
        for c in chunks:
            score = c.score * _intent_boost_factor(query, c.kind)
            normalised_ppr = ppr_scores.get(c.rel_path, 0.0) / max_ppr
            score += ppr_weight * normalised_ppr
            boosted.append(
                RetrievedChunk(
                    rel_path=c.rel_path,
                    text=c.text,
                    score=score,
                    kind=c.kind,
                    symbol=c.symbol,
                    line_start=c.line_start,
                    line_end=c.line_end,
                    source_kind=c.source_kind,
                )
            )
        boosted.sort(key=lambda x: x.score, reverse=True)
        graph_only_neighbors = [n for n in neighbors if n not in seed_set]

        hub_files: list[tuple[str, float]] = []
        if self._settings.graph_use_pagerank and self._settings.graph_hub_top_k > 0:
            hub_files = self._graph.hub_files(
                top_k=self._settings.graph_hub_top_k,
                alpha=self._settings.graph_ppr_alpha,
            )

        return HybridContext(
            chunks=boosted[:_MAX_FINAL],
            graph_neighbors=graph_only_neighbors,
            related_symbols=related_symbols,
            hub_files=hub_files,
            queries_used=list(query_list),
        )
