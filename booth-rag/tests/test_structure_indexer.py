from __future__ import annotations

from pathlib import Path

import pytest

from booth_rag.ingestion.code_walker import CodeFile, walk_repo
from booth_rag.ingestion.structure_indexer import (
    build_directory_summary_chunks,
    build_repo_map_chunk,
)


@pytest.fixture
def sample_repo(tmp_path: Path) -> Path:
    (tmp_path / "backend").mkdir()
    (tmp_path / "backend" / "README.md").write_text("# Backend\n\n미핏 Django 백엔드 서비스.\n", encoding="utf-8")
    (tmp_path / "backend" / "pyproject.toml").write_text("[project]\nname = 'backend'\n", encoding="utf-8")
    (tmp_path / "backend" / "main.py").write_text("class Greeter:\n    def hi(self): return 1\n", encoding="utf-8")
    (tmp_path / "scraping").mkdir()
    (tmp_path / "scraping" / "scraper.py").write_text("def run(): pass\n", encoding="utf-8")
    return tmp_path


def test_repo_map_chunk_lists_included_dirs(sample_repo: Path):
    chunk = build_repo_map_chunk(sample_repo, ["backend", "scraping", "missing"])
    assert chunk.kind == "repo_map"
    assert "- backend/" in chunk.text
    assert "- scraping/" in chunk.text
    assert "missing" not in chunk.text


def test_directory_summary_uses_readme_and_symbols(sample_repo: Path):
    files: list[CodeFile] = list(walk_repo(sample_repo, include_top_dirs=("backend", "scraping")))
    chunks = build_directory_summary_chunks(sample_repo, files, ["backend", "scraping"])
    backend = next(c for c in chunks if c.symbol == "backend")
    assert "미핏 Django 백엔드 서비스" in backend.text
    assert "class Greeter" in backend.text
    assert "pyproject.toml" in backend.text
    scraping = next(c for c in chunks if c.symbol == "scraping")
    assert "def run" in scraping.text
