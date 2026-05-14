from __future__ import annotations

import ast
import re
from collections.abc import Iterable

import networkx as nx

from booth_rag.ingestion.code_walker import CodeFile

_TS_IMPORT_PATTERN = re.compile(
    r"""(?x)
    \b(?:import|from)\b
    [^'"\n]*?
    ['"]([^'"\n]+)['"]
    """,
)

_TOP_LEVEL_DIRS_OF_INTEREST: frozenset[str] = frozenset(
    {
        "backend",
        "frontend",
        "analysis-resume",
        "analysis-stt",
        "analysis-video",
        "face-analyzer",
        "interview-analysis-report",
        "voice-api",
        "voice-api-front-testing",
        "scraping",
        "infra",
        "mefit-tools",
        "mefit-diagrams",
        "presentation-docs",
        "prompts",
        "report-drafts",
        "poster",
        "docs",
    }
)


def _module_of(rel_path: str) -> str:
    parts = rel_path.split("/")
    if not parts:
        return "root"
    head = parts[0]
    return head if head in _TOP_LEVEL_DIRS_OF_INTEREST else "root"


def _python_imports(text: str) -> list[str]:
    try:
        tree = ast.parse(text)
    except SyntaxError:
        return []
    out: list[str] = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            out.extend(alias.name for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module:
            out.append(node.module)
    return out


def _python_symbols(text: str) -> list[str]:
    try:
        tree = ast.parse(text)
    except SyntaxError:
        return []
    return [node.name for node in tree.body if isinstance(node, ast.FunctionDef | ast.AsyncFunctionDef | ast.ClassDef)]


def _ts_imports(text: str) -> list[str]:
    return list({m.group(1) for m in _TS_IMPORT_PATTERN.finditer(text)})


def build_graph(files: Iterable[CodeFile]) -> nx.MultiDiGraph:
    g: nx.MultiDiGraph = nx.MultiDiGraph()
    for file in files:
        module = _module_of(file.rel_path)
        g.add_node(module, kind="module")
        g.add_node(file.rel_path, kind="file", module=module, suffix=file.suffix)
        g.add_edge(module, file.rel_path, kind="contains")

        if file.suffix in {".py", ".pyi"}:
            for sym in _python_symbols(file.text):
                node_id = f"{file.rel_path}::{sym}"
                g.add_node(node_id, kind="symbol", parent=file.rel_path)
                g.add_edge(file.rel_path, node_id, kind="defines")
            for imp in _python_imports(file.text):
                target = f"py:{imp}"
                g.add_node(target, kind="import_target")
                g.add_edge(file.rel_path, target, kind="imports")
        elif file.suffix in {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"}:
            for imp in _ts_imports(file.text):
                target = f"js:{imp}"
                g.add_node(target, kind="import_target")
                g.add_edge(file.rel_path, target, kind="imports")
    return g


def expand_neighbors(g: nx.MultiDiGraph, seed_files: Iterable[str], radius: int = 1) -> set[str]:
    result: set[str] = set()
    seeds = [s for s in seed_files if s in g]
    frontier: set[str] = set(seeds)
    for _ in range(max(0, radius)):
        next_frontier: set[str] = set()
        for node in frontier:
            for nbr in g.successors(node):
                if g.nodes[nbr].get("kind") == "file":
                    next_frontier.add(nbr)
            for nbr in g.predecessors(node):
                if g.nodes[nbr].get("kind") == "file":
                    next_frontier.add(nbr)
        next_frontier -= result
        result.update(next_frontier)
        frontier = next_frontier
    result.update(seeds)
    result.discard("")
    return result
