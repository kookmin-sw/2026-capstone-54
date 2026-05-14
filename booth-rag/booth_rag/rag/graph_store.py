from __future__ import annotations

import pickle
from collections.abc import Iterable
from pathlib import Path

import networkx as nx

from booth_rag.config import get_settings
from booth_rag.ingestion.code_walker import CodeFile
from booth_rag.ingestion.graph_builder import build_graph, expand_neighbors

_GRAPH_FILE = "knowledge.gpickle"


class KnowledgeGraph:
    def __init__(self, persist_dir: Path | None = None):
        self._persist_dir = persist_dir or get_settings().graph_dir
        self._path = self._persist_dir / _GRAPH_FILE
        self._graph: nx.MultiDiGraph = self._load()

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

    def save(self) -> None:
        self._persist_dir.mkdir(parents=True, exist_ok=True)
        with self._path.open("wb") as f:
            pickle.dump(self._graph, f)

    def merge_files(self, files: Iterable[CodeFile]) -> int:
        added = build_graph(files)
        before = self._graph.number_of_nodes()
        self._graph = nx.compose(self._graph, added)
        return self._graph.number_of_nodes() - before

    def neighbors(self, seed_files: Iterable[str], radius: int = 1) -> set[str]:
        return expand_neighbors(self._graph, seed_files, radius=radius)

    def stats(self) -> dict[str, int]:
        return {
            "graph_nodes": self._graph.number_of_nodes(),
            "graph_edges": self._graph.number_of_edges(),
        }

    def reset(self) -> None:
        self._graph = nx.MultiDiGraph()
        if self._path.exists():
            self._path.unlink()

    @property
    def graph(self) -> nx.MultiDiGraph:
        return self._graph
