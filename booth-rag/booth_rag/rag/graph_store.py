from __future__ import annotations

import logging
import pickle
from collections.abc import Iterable, Mapping
from pathlib import Path

import networkx as nx

from booth_rag.config import get_settings
from booth_rag.ingestion.code_walker import CodeFile
from booth_rag.ingestion.graph_builder import build_graph, expand_neighbors

logger = logging.getLogger(__name__)

_GRAPH_FILE = "knowledge.gpickle"
_FILE_KIND = "file"
_SYMBOL_KIND = "symbol"


class KnowledgeGraph:
    def __init__(self, persist_dir: Path | None = None):
        self._persist_dir = persist_dir or get_settings().graph_dir
        self._path = self._persist_dir / _GRAPH_FILE
        self._graph: nx.MultiDiGraph = self._load()
        self._pagerank: dict[str, float] | None = None
        self._undirected_cache: nx.Graph | None = None

    def _load(self) -> nx.MultiDiGraph:
        if self._path.exists():
            try:
                with self._path.open("rb") as f:
                    obj = pickle.load(f)
                if isinstance(obj, nx.MultiDiGraph):
                    return obj
            except Exception:
                pass
        return nx.MultiDiGraph()

    def _invalidate_caches(self) -> None:
        self._pagerank = None
        self._undirected_cache = None

    def _undirected(self) -> nx.Graph:
        if self._undirected_cache is None:
            self._undirected_cache = nx.Graph(self._graph.to_undirected(as_view=False))
        return self._undirected_cache

    def save(self) -> None:
        self._persist_dir.mkdir(parents=True, exist_ok=True)
        with self._path.open("wb") as f:
            pickle.dump(self._graph, f)

    def merge_files(self, files: Iterable[CodeFile]) -> int:
        added = build_graph(files)
        before = self._graph.number_of_nodes()
        self._graph = nx.compose(self._graph, added)
        self._invalidate_caches()
        return self._graph.number_of_nodes() - before

    def neighbors(self, seed_files: Iterable[str], radius: int = 1) -> set[str]:
        return expand_neighbors(self._graph, seed_files, radius=radius)

    def symbol_neighbors(self, seed_files: Iterable[str]) -> list[str]:
        """Return symbol nodes (e.g. `path::Foo`) defined by the given seed files."""
        out: list[str] = []
        for seed in seed_files:
            if seed not in self._graph:
                continue
            out.extend(
                nbr for nbr in self._graph.successors(seed) if self._graph.nodes[nbr].get("kind") == _SYMBOL_KIND
            )
        return out

    def global_pagerank(self, alpha: float = 0.85) -> dict[str, float]:
        if self._pagerank is not None:
            return self._pagerank
        if self._graph.number_of_nodes() == 0:
            self._pagerank = {}
            return self._pagerank
        try:
            self._pagerank = nx.pagerank(self._undirected(), alpha=alpha)
        except Exception as exc:
            logger.warning("PageRank failed: %s", exc)
            self._pagerank = {}
        return self._pagerank

    def personalised_pagerank(
        self,
        seeds: Iterable[str],
        alpha: float = 0.85,
    ) -> dict[str, float]:
        """PPR with the seed nodes as the teleport set. Returns {} if no seeds hit."""
        present = [s for s in seeds if s in self._graph]
        if not present or self._graph.number_of_nodes() == 0:
            return {}
        personalization = dict.fromkeys(present, 1.0 / len(present))
        try:
            return nx.pagerank(self._undirected(), alpha=alpha, personalization=personalization)
        except Exception as exc:
            logger.warning("PPR failed: %s", exc)
            return {}

    def hub_files(self, top_k: int, alpha: float = 0.85) -> list[tuple[str, float]]:
        """Return the top-K most central file nodes by global PageRank."""
        if top_k <= 0:
            return []
        pr = self.global_pagerank(alpha=alpha)
        if not pr:
            return []
        file_scores = [
            (node, score) for node, score in pr.items() if self._graph.nodes.get(node, {}).get("kind") == _FILE_KIND
        ]
        file_scores.sort(key=lambda x: x[1], reverse=True)
        return file_scores[:top_k]

    def file_ppr_scores(
        self,
        seed_files: Iterable[str],
        alpha: float = 0.85,
    ) -> Mapping[str, float]:
        """PPR scores filtered to file nodes only — convenient for retrieval boost."""
        ppr = self.personalised_pagerank(seed_files, alpha=alpha)
        return {node: score for node, score in ppr.items() if self._graph.nodes.get(node, {}).get("kind") == _FILE_KIND}

    def stats(self) -> dict[str, int]:
        return {
            "graph_nodes": self._graph.number_of_nodes(),
            "graph_edges": self._graph.number_of_edges(),
        }

    def reset(self) -> None:
        self._graph = nx.MultiDiGraph()
        self._invalidate_caches()
        if self._path.exists():
            self._path.unlink()

    @property
    def graph(self) -> nx.MultiDiGraph:
        return self._graph
