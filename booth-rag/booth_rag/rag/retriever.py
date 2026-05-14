from __future__ import annotations

from dataclasses import dataclass, field

from booth_rag.rag.graph_store import KnowledgeGraph
from booth_rag.rag.vector_store import RetrievedChunk, VectorIndex

_GRAPH_BONUS = 0.05
_MAX_FINAL = 8


@dataclass
class HybridContext:
    chunks: list[RetrievedChunk] = field(default_factory=list)
    graph_neighbors: list[str] = field(default_factory=list)

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
            lines.append("관련 파일 (그래프 RAG):")
            lines.extend(f"- {n}" for n in self.graph_neighbors[:10])
        return "\n".join(lines)


class HybridRetriever:
    def __init__(self, vector_index: VectorIndex, graph: KnowledgeGraph):
        self._vector = vector_index
        self._graph = graph

    def retrieve(self, query: str, k: int = 6, graph_radius: int = 1) -> HybridContext:
        chunks = self._vector.search(query, k=k)
        seed_files = [c.rel_path for c in chunks if c.rel_path]
        neighbors = sorted(self._graph.neighbors(seed_files, radius=graph_radius))
        seed_set = set(seed_files)
        boosted: list[RetrievedChunk] = []
        for c in chunks:
            score = c.score
            if c.rel_path in seed_set:
                score += _GRAPH_BONUS
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
        return HybridContext(chunks=boosted[:_MAX_FINAL], graph_neighbors=graph_only_neighbors)
