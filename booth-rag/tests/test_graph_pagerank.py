from __future__ import annotations

from pathlib import Path

import pytest

from booth_rag.ingestion.code_walker import CodeFile
from booth_rag.rag.graph_store import KnowledgeGraph


def _file(rel_path: str, text: str = "") -> CodeFile:
    suffix = Path(rel_path).suffix.lower()
    return CodeFile(
        path=Path(rel_path),
        rel_path=rel_path,
        suffix=suffix,
        size_bytes=len(text.encode("utf-8")),
        text=text,
    )


@pytest.fixture
def kg(tmp_path: Path) -> KnowledgeGraph:
    kg = KnowledgeGraph(persist_dir=tmp_path)
    files = [
        _file("backend/core.py", "class Core:\n    pass\n\ndef boot(): return 1\n"),
        _file("backend/api.py", "from backend.core import Core\nclass Api(Core):\n    pass\n"),
        _file("backend/util.py", "from backend.core import Core\ndef helper(): return 1\n"),
        _file("frontend/app.tsx", "import { Api } from 'backend/api'\nexport const App = () => null\n"),
        _file("docs/README.md", "# docs"),
    ]
    kg.merge_files(files)
    return kg


def test_global_pagerank_returns_scores_summing_close_to_one(kg: KnowledgeGraph):
    pr = kg.global_pagerank()
    assert pr
    total = sum(pr.values())
    assert abs(total - 1.0) < 1e-6


def test_hub_files_returns_only_file_nodes(kg: KnowledgeGraph):
    hubs = kg.hub_files(top_k=3)
    assert hubs, "expected at least one hub"
    assert all(isinstance(score, float) for _, score in hubs)
    assert all(node.endswith((".py", ".tsx", ".md")) for node, _ in hubs)


def test_personalised_pagerank_concentrates_around_seed(kg: KnowledgeGraph):
    seed = "backend/core.py"
    ppr = kg.personalised_pagerank([seed])
    assert ppr, "PPR should yield non-empty distribution"
    assert ppr[seed] == max(ppr.values()), "seed should receive the highest mass"


def test_personalised_pagerank_empty_when_seed_missing(kg: KnowledgeGraph):
    assert kg.personalised_pagerank(["nope/missing.py"]) == {}
    assert kg.personalised_pagerank([]) == {}


def test_file_ppr_scores_filters_to_file_kind(kg: KnowledgeGraph):
    scores = kg.file_ppr_scores(["backend/core.py"])
    assert scores
    assert all(node.endswith((".py", ".tsx", ".md")) for node in scores)
    assert "py:backend.core" not in scores
    assert "backend" not in scores


def test_symbol_neighbors_lists_defines_targets(kg: KnowledgeGraph):
    syms = kg.symbol_neighbors(["backend/core.py"])
    assert any(s.endswith("::Core") for s in syms)
    assert any(s.endswith("::boot") for s in syms)


def test_caches_reset_after_merge(kg: KnowledgeGraph):
    first = kg.global_pagerank()
    assert first
    kg.merge_files([_file("backend/new.py", "def added(): return 1\n")])
    refreshed = kg.global_pagerank()
    assert refreshed
    assert "backend/new.py" in refreshed


def test_symbol_info_carries_line_range_and_async_flag(tmp_path: Path):
    kg = KnowledgeGraph(persist_dir=tmp_path)
    kg.merge_files(
        [
            _file(
                "backend/core.py",
                "async def fetch():\n    return 1\n\n\nclass Core:\n    def m(self): pass\n",
            ),
        ]
    )
    fetch = kg.symbol_info("backend/core.py::fetch")
    assert fetch["is_async"] is True
    assert fetch["is_class"] is False
    assert fetch["line_start"] == 1
    assert fetch["line_end"] >= 2

    core = kg.symbol_info("backend/core.py::Core")
    assert core["is_class"] is True
    assert core["is_async"] is False
    assert core["line_start"] == 5


def test_inherits_from_edge_links_class_to_base(kg: KnowledgeGraph):
    bases = kg.bases_of("backend/api.py::Api")
    assert any(b == "backend/api.py::Core" or b.startswith("external:Core") for b in bases), bases


def test_derived_of_finds_subclasses_locally(tmp_path: Path):
    kg = KnowledgeGraph(persist_dir=tmp_path)
    kg.merge_files(
        [
            _file(
                "backend/core.py",
                "class Base:\n    pass\n\nclass Child(Base):\n    pass\n",
            ),
        ]
    )
    derived = kg.derived_of("backend/core.py::Base")
    assert "backend/core.py::Child" in derived


def test_siblings_in_module_excludes_self(kg: KnowledgeGraph):
    sibs = kg.siblings_in_module("backend/core.py")
    assert "backend/api.py" in sibs
    assert "backend/util.py" in sibs
    assert "backend/core.py" not in sibs
    assert "frontend/app.tsx" not in sibs
