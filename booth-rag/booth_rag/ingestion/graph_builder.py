from __future__ import annotations

import ast
import re
from collections.abc import Iterable
from dataclasses import dataclass, field

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


@dataclass(frozen=True)
class PythonSymbol:
    name: str
    line_start: int
    line_end: int
    is_async: bool
    is_class: bool
    bases: tuple[str, ...] = field(default_factory=tuple)


def _base_name(node: ast.expr) -> str | None:
    if isinstance(node, ast.Name):
        return node.id
    if isinstance(node, ast.Attribute):
        return node.attr
    return None


def _python_symbols(text: str) -> list[PythonSymbol]:
    try:
        tree = ast.parse(text)
    except SyntaxError:
        return []
    out: list[PythonSymbol] = []
    for node in tree.body:
        if isinstance(node, ast.ClassDef):
            bases = tuple(b for b in (_base_name(b) for b in node.bases) if b)
            out.append(
                PythonSymbol(
                    name=node.name,
                    line_start=node.lineno,
                    line_end=node.end_lineno or node.lineno,
                    is_async=False,
                    is_class=True,
                    bases=bases,
                )
            )
        elif isinstance(node, ast.FunctionDef | ast.AsyncFunctionDef):
            out.append(
                PythonSymbol(
                    name=node.name,
                    line_start=node.lineno,
                    line_end=node.end_lineno or node.lineno,
                    is_async=isinstance(node, ast.AsyncFunctionDef),
                    is_class=False,
                )
            )
    return out


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
            symbols = _python_symbols(file.text)
            local_names = {s.name for s in symbols}
            for sym in symbols:
                node_id = f"{file.rel_path}::{sym.name}"
                g.add_node(
                    node_id,
                    kind="symbol",
                    parent=file.rel_path,
                    line_start=sym.line_start,
                    line_end=sym.line_end,
                    is_async=sym.is_async,
                    is_class=sym.is_class,
                )
                g.add_edge(file.rel_path, node_id, kind="defines")
                if sym.is_class:
                    for base in sym.bases:
                        if base in local_names:
                            base_id = f"{file.rel_path}::{base}"
                            g.add_edge(node_id, base_id, kind="inherits_from")
                        else:
                            base_id = f"external:{base}"
                            g.add_node(base_id, kind="external_symbol")
                            g.add_edge(node_id, base_id, kind="inherits_from")
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
