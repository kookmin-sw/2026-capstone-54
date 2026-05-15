"""Sparse keyword retrieval (BM25) over the same chunks indexed in ChromaDB.

Dense embeddings (BGE-M3 etc.) handle semantic similarity well but lose on
short Korean queries and on literal code identifiers like "회원가입", "API",
"signup" — the corpus contains those tokens *verbatim* yet the cosine score
collapses because the surrounding sentences in the chunk dominate the
embedding. BM25 is the proven antidote: it scores by exact token overlap,
saturated by tf and IDF.

The in-memory index is rebuilt on startup from the ChromaDB collection and
again after each ingest. A 2400-chunk corpus indexes in well under a second
and uses ~2 MB of RAM, so persistence is not needed.
"""

from __future__ import annotations

import logging
import re
import threading
from dataclasses import dataclass
from typing import Any

logger = logging.getLogger(__name__)

_CAMEL_RE = re.compile(r"(?<=[a-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])")
_TOKEN_SPLIT_RE = re.compile(r"[^0-9a-zA-Z가-힣]+")
_DEDUP_LOWER = True
_MIN_TOKEN_LEN = 2


def tokenize(text: str) -> list[str]:
    """Tokenize Korean + English + code identifiers.

    Splits on non-alphanumeric/non-hangul, then splits English CamelCase /
    snake_case boundaries so `getUserProfile` produces `get user profile`
    tokens (each searchable on its own). Keeps Korean tokens as-is because
    Korean morphology rarely benefits from naive splitting and dense+BM25
    fusion absorbs the recall gap.
    """
    if not text:
        return []
    raw_tokens = [t for t in _TOKEN_SPLIT_RE.split(text) if len(t) >= _MIN_TOKEN_LEN]
    out: list[str] = []
    seen: set[str] = set()
    for token in raw_tokens:
        candidates: list[str] = [token]
        if token.isascii() and any(c.isupper() for c in token):
            candidates.extend(_CAMEL_RE.split(token))
        for part in candidates:
            if len(part) < _MIN_TOKEN_LEN:
                continue
            key = part.lower() if _DEDUP_LOWER else part
            if key in seen:
                continue
            seen.add(key)
            out.append(key)
    return out


@dataclass(frozen=True)
class BM25Hit:
    chunk_id: str
    rel_path: str
    text: str
    score: float
    kind: str
    symbol: str | None
    line_start: int
    line_end: int
    source_kind: str


class BM25Index:
    def __init__(self) -> None:
        self._bm25: Any = None
        self._corpus: list[BM25Hit] = []
        self._lock = threading.Lock()

    @property
    def size(self) -> int:
        return len(self._corpus)

    def rebuild_from_chroma(self, chroma_store: Any) -> int:
        return self.rebuild_from_chroma_stores([chroma_store])

    def rebuild_from_chroma_stores(self, chroma_stores: list[Any]) -> int:
        corpus: list[BM25Hit] = []
        tokenized: list[list[str]] = []
        for store in chroma_stores:
            try:
                collection = store._collection
                payload = collection.get(include=["documents", "metadatas"])
            except Exception as exc:
                logger.warning("BM25 rebuild skipped one store — chroma get() failed: %s", exc)
                continue
            ids = payload.get("ids") or []
            docs = payload.get("documents") or []
            metas = payload.get("metadatas") or []
            for i, doc in enumerate(docs):
                md = metas[i] if i < len(metas) and metas[i] else {}
                chunk_id = str(ids[i]) if i < len(ids) else f"_anon_{i}"
                text = doc or ""
                corpus.append(
                    BM25Hit(
                        chunk_id=chunk_id,
                        rel_path=str(md.get("rel_path", "")),
                        text=text,
                        score=0.0,
                        kind=str(md.get("kind", "generic")),
                        symbol=(md.get("symbol") or None),
                        line_start=int(md.get("line_start", 0)),
                        line_end=int(md.get("line_end", 0)),
                        source_kind=str(md.get("source_kind", "code")),
                    )
                )
                tokens = tokenize(text)
                if not tokens:
                    tokens = ["__empty__"]
                tokenized.append(tokens)

        if not corpus:
            with self._lock:
                self._corpus = []
                self._bm25 = None
            return 0

        from rank_bm25 import BM25Okapi

        bm25 = BM25Okapi(tokenized)
        with self._lock:
            self._corpus = corpus
            self._bm25 = bm25
        logger.info("BM25 index built: %d documents from %d store(s)", len(corpus), len(chroma_stores))
        return len(corpus)

    def search(self, query: str, k: int = 6) -> list[BM25Hit]:
        with self._lock:
            bm25 = self._bm25
            corpus = self._corpus
        if bm25 is None or not corpus:
            return []
        tokens = tokenize(query)
        if not tokens:
            return []
        scores = bm25.get_scores(tokens)
        if not len(scores):
            return []
        ranked_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)
        hits: list[BM25Hit] = []
        for idx in ranked_indices[: max(k * 2, k)]:
            score = float(scores[idx])
            if score <= 0:
                break
            base = corpus[idx]
            hits.append(
                BM25Hit(
                    chunk_id=base.chunk_id,
                    rel_path=base.rel_path,
                    text=base.text,
                    score=score,
                    kind=base.kind,
                    symbol=base.symbol,
                    line_start=base.line_start,
                    line_end=base.line_end,
                    source_kind=base.source_kind,
                )
            )
            if len(hits) >= k:
                break
        return hits
