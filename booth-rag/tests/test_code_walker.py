from __future__ import annotations

from pathlib import Path

import pytest

from booth_rag.ingestion.code_walker import count_files, walk_repo


@pytest.fixture
def sample_repo(tmp_path: Path) -> Path:
    (tmp_path / "backend").mkdir()
    (tmp_path / "backend" / "main.py").write_text("print('hi')\n", encoding="utf-8")
    (tmp_path / "backend" / "secret.env").write_text("SECRET=abc\n", encoding="utf-8")
    (tmp_path / "frontend").mkdir()
    (tmp_path / "frontend" / "App.tsx").write_text("export const App = () => null\n", encoding="utf-8")
    (tmp_path / "ignore-me").mkdir()
    (tmp_path / "ignore-me" / "junk.py").write_text("x = 1\n", encoding="utf-8")
    (tmp_path / "node_modules").mkdir()
    (tmp_path / "node_modules" / "junk.js").write_text("module.exports = {}\n", encoding="utf-8")
    return tmp_path


def test_walk_repo_respects_include_top_dirs(sample_repo: Path):
    paths = sorted(cf.rel_path for cf in walk_repo(sample_repo, include_top_dirs=("backend", "frontend")))
    assert paths == ["backend/main.py", "frontend/App.tsx"]


def test_walk_repo_skips_node_modules_and_secret_files(sample_repo: Path):
    paths = sorted(cf.rel_path for cf in walk_repo(sample_repo))
    assert "node_modules/junk.js" not in paths
    assert "backend/secret.env" not in paths


def test_walk_repo_excludes_ignore_me_when_filter_set(sample_repo: Path):
    paths = sorted(cf.rel_path for cf in walk_repo(sample_repo, include_top_dirs=("backend",)))
    assert "ignore-me/junk.py" not in paths
    assert paths == ["backend/main.py"]


def test_count_files_matches_walk_repo(sample_repo: Path):
    assert count_files(sample_repo, include_top_dirs=("backend", "frontend")) == 2
