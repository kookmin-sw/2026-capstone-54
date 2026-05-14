from __future__ import annotations

from collections.abc import Iterator, Sequence
from dataclasses import dataclass
from pathlib import Path

from booth_rag.utils.secret_filter import is_secret_file

_IGNORED_DIRS: frozenset[str] = frozenset(
    {
        ".git",
        ".github",
        ".husky",
        ".venv",
        "venv",
        "env",
        "node_modules",
        "__pycache__",
        ".pytest_cache",
        ".ruff_cache",
        ".mypy_cache",
        "dist",
        "build",
        ".next",
        "out",
        "coverage",
        ".cache",
        "staticfiles",
        ".vscode",
        ".idea",
        ".kiro",
        ".claude",
        ".opencode",
        ".commit-generator",
        ".pr-generator",
        ".sisyphus",
        ".omc",
        "wheels",
        ".turbo",
        ".parcel-cache",
        "tests-e2e",
    }
)

_IGNORED_FILE_SUFFIXES: frozenset[str] = frozenset(
    {
        ".pyc",
        ".pyo",
        ".so",
        ".o",
        ".class",
        ".jar",
        ".png",
        ".jpg",
        ".jpeg",
        ".gif",
        ".webp",
        ".ico",
        ".svg",
        ".mp4",
        ".mp3",
        ".wav",
        ".mov",
        ".webm",
        ".zip",
        ".tar",
        ".gz",
        ".tgz",
        ".bz2",
        ".7z",
        ".woff",
        ".woff2",
        ".ttf",
        ".otf",
        ".eot",
        ".pdf",
        ".pptx",
        ".xlsx",
        ".xls",
        ".lock",
        ".sum",
        ".exe",
        ".dll",
        ".dylib",
        ".pkl",
        ".pickle",
        ".gpickle",
        ".onnx",
        ".bin",
        ".safetensors",
        ".weights",
    }
)

_INCLUDED_SUFFIXES: frozenset[str] = frozenset(
    {
        ".py",
        ".pyi",
        ".ts",
        ".tsx",
        ".js",
        ".jsx",
        ".mjs",
        ".cjs",
        ".html",
        ".css",
        ".scss",
        ".md",
        ".mdx",
        ".rst",
        ".txt",
        ".yml",
        ".yaml",
        ".toml",
        ".ini",
        ".cfg",
        ".sql",
        ".sh",
        ".bash",
        ".zsh",
        ".dockerfile",
        ".tf",
    }
)

_INCLUDED_FILENAMES: frozenset[str] = frozenset(
    {
        "Dockerfile",
        "Makefile",
        "Procfile",
        "Caddyfile",
    }
)

_MAX_FILE_BYTES = 200_000


@dataclass(frozen=True)
class CodeFile:
    path: Path
    rel_path: str
    suffix: str
    size_bytes: int
    text: str


def _is_included(path: Path) -> bool:
    if path.name in _INCLUDED_FILENAMES:
        return True
    suf = path.suffix.lower()
    if suf in _IGNORED_FILE_SUFFIXES:
        return False
    return suf in _INCLUDED_SUFFIXES


def _iter_files(start: Path) -> Iterator[Path]:
    if not start.exists():
        return
    for path in start.rglob("*"):
        if not path.is_file():
            continue
        if any(part in _IGNORED_DIRS for part in path.parts):
            continue
        yield path


def _read_code_file(path: Path, repo_root: Path) -> CodeFile | None:
    if is_secret_file(path.name, str(path)):
        return None
    if not _is_included(path):
        return None
    try:
        size = path.stat().st_size
    except OSError:
        return None
    if size > _MAX_FILE_BYTES or size == 0:
        return None
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except (OSError, UnicodeDecodeError):
        return None
    rel = path.relative_to(repo_root)
    return CodeFile(
        path=path,
        rel_path=str(rel),
        suffix=path.suffix.lower(),
        size_bytes=size,
        text=text,
    )


def walk_repo(
    root: Path,
    include_top_dirs: Sequence[str] | None = None,
) -> Iterator[CodeFile]:
    if not root.exists():
        return
    root = root.resolve()
    if include_top_dirs:
        roots = [root / d for d in include_top_dirs if (root / d).is_dir()]
    else:
        roots = [root]
    for start in roots:
        for path in _iter_files(start):
            cf = _read_code_file(path, root)
            if cf is not None:
                yield cf


def count_files(
    root: Path,
    include_top_dirs: Sequence[str] | None = None,
) -> int:
    if not root.exists():
        return 0
    root = root.resolve()
    if include_top_dirs:
        roots = [root / d for d in include_top_dirs if (root / d).is_dir()]
    else:
        roots = [root]
    total = 0
    for start in roots:
        for path in _iter_files(start):
            if is_secret_file(path.name, str(path)):
                continue
            if not _is_included(path):
                continue
            try:
                size = path.stat().st_size
            except OSError:
                continue
            if 0 < size <= _MAX_FILE_BYTES:
                total += 1
    return total
