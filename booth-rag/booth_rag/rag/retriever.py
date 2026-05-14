from __future__ import annotations

from dataclasses import dataclass, field

from booth_rag.config import get_settings
from booth_rag.rag.graph_store import KnowledgeGraph
from booth_rag.rag.vector_store import RetrievedChunk, VectorIndex

_MAX_FINAL = 8
_MAX_SYMBOLS_IN_PROMPT = 8
_MAX_NEIGHBORS_IN_PROMPT = 10


@dataclass
class HybridContext:
    chunks: list[RetrievedChunk] = field(default_factory=list)
    graph_neighbors: list[str] = field(default_factory=list)
    related_symbols: list[str] = field(default_factory=list)
    hub_files: list[tuple[str, float]] = field(default_factory=list)

    def to_prompt_block(self) -> str:
        lines: list[str] = []
        for i, c in enumerate(self.chunks, start=1):
            header = f"[{i}] {c.rel_path}"
            if c.symbol:
                header += f"::{c.symbol}"
            if c.line_start:
                header += f" (L{c.line_start}-{c.line_end})"
            header += f"  [{c.source_kind}]"
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
    def __init__(self, vector_index: VectorIndex, graph: KnowledgeGraph):
        self._vector = vector_index
        self._graph = graph
        self._settings = get_settings()

    def retrieve(self, query: str, k: int = 6, graph_radius: int = 1) -> HybridContext:
        chunks = self._vector.search(query, k=k)
        seed_files = [c.rel_path for c in chunks if c.rel_path]
        seed_set = set(seed_files)

        neighbors = sorted(self._graph.neighbors(seed_files, radius=graph_radius))
        related_symbols = self._graph.symbol_neighbors(seed_files)

        ppr_scores: dict[str, float] = {}
        if self._settings.graph_use_pagerank and seed_files:
            ppr_scores = dict(self._graph.file_ppr_scores(seed_files, alpha=self._settings.graph_ppr_alpha))

        ppr_weight = self._settings.graph_ppr_weight if self._settings.graph_use_pagerank else 0.0
        max_ppr = max(ppr_scores.values(), default=0.0) or 1.0

        boosted: list[RetrievedChunk] = []
        for c in chunks:
            score = c.score
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
        )
