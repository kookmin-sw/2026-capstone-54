from __future__ import annotations

import ast
import re
from collections import defaultdict
from collections.abc import Iterable
from dataclasses import dataclass
from pathlib import Path

from booth_rag.ingestion.code_chunker import CodeChunk
from booth_rag.ingestion.code_walker import CodeFile

_README_NAMES = ("README.md", "README.rst", "Readme.md", "readme.md")
_PACKAGE_HINT_FILES = ("pyproject.toml", "package.json", "Cargo.toml", "Dockerfile", "docker-compose.yml")
_DIR_SUMMARY_MAX_FILES = 12
_DIR_SUMMARY_MAX_SYMBOLS = 20
_README_EXCERPT_CHARS = 800

_TS_EXPORT_PATTERN = re.compile(
    r"^\s*export\s+(?:default\s+)?(?:async\s+)?"
    r"(function|class|interface|type|enum)\s+([A-Za-z_$][A-Za-z0-9_$]*)",
    re.MULTILINE,
)


@dataclass(frozen=True)
class DirectoryStat:
    rel_dir: str
    file_count: int


def _module_of(rel_path: str) -> str:
    head, *_ = rel_path.split("/", 1)
    return head


def _python_top_symbols(text: str, limit: int) -> list[str]:
    try:
        tree = ast.parse(text)
    except SyntaxError:
        return []
    out: list[str] = []
    for node in tree.body:
        if isinstance(node, ast.ClassDef):
            out.append(f"class {node.name}")
        elif isinstance(node, ast.FunctionDef | ast.AsyncFunctionDef):
            prefix = "async def" if isinstance(node, ast.AsyncFunctionDef) else "def"
            out.append(f"{prefix} {node.name}")
        if len(out) >= limit:
            break
    return out


def _ts_top_symbols(text: str, limit: int) -> list[str]:
    out: list[str] = []
    for m in _TS_EXPORT_PATTERN.finditer(text):
        out.append(f"export {m.group(1)} {m.group(2)}")
        if len(out) >= limit:
            break
    return out


def _file_symbols(file: CodeFile) -> list[str]:
    if file.suffix in {".py", ".pyi"}:
        return _python_top_symbols(file.text, _DIR_SUMMARY_MAX_SYMBOLS)
    if file.suffix in {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"}:
        return _ts_top_symbols(file.text, _DIR_SUMMARY_MAX_SYMBOLS)
    return []


def _find_readme(top_dir: Path) -> str | None:
    for name in _README_NAMES:
        candidate = top_dir / name
        if candidate.is_file():
            try:
                return candidate.read_text(encoding="utf-8", errors="replace")[:_README_EXCERPT_CHARS]
            except OSError:
                continue
    return None


def _hint_files(top_dir: Path) -> list[str]:
    return [name for name in _PACKAGE_HINT_FILES if (top_dir / name).is_file()]


def build_directory_summary_chunks(
    repo_root: Path,
    files: Iterable[CodeFile],
    include_top_dirs: Iterable[str],
) -> list[CodeChunk]:
    by_module: dict[str, list[CodeFile]] = defaultdict(list)
    for f in files:
        by_module[_module_of(f.rel_path)].append(f)

    chunks: list[CodeChunk] = []
    repo_root = repo_root.resolve()
    for idx, top in enumerate(sorted(set(include_top_dirs))):
        top_dir = repo_root / top
        if not top_dir.is_dir():
            continue
        mod_files = by_module.get(top, [])
        readme = _find_readme(top_dir)
        hints = _hint_files(top_dir)

        sample_files = sorted({f.rel_path for f in mod_files})[:_DIR_SUMMARY_MAX_FILES]
        symbols: list[str] = []
        for f in mod_files[:_DIR_SUMMARY_MAX_FILES]:
            symbols.extend(f"  {sym}  ({f.rel_path})" for sym in _file_symbols(f))
            if len(symbols) >= _DIR_SUMMARY_MAX_SYMBOLS:
                break

        parts = [f"# {top}/  — 모노레포 서브 디렉토리 요약"]
        parts.append(f"파일 수 (인덱싱됨): {len(mod_files)}")
        if hints:
            parts.append("패키지 힌트 파일: " + ", ".join(hints))
        if readme:
            parts.append(f"\n## README ({top}/README.md 발췌)\n{readme}")
        if sample_files:
            parts.append("\n## 대표 파일")
            parts.extend(f"- {p}" for p in sample_files)
        if symbols:
            parts.append("\n## 대표 심볼")
            parts.extend(symbols[:_DIR_SUMMARY_MAX_SYMBOLS])

        text = "\n".join(parts)
        chunks.append(
            CodeChunk(
                rel_path=f"{top}/",
                chunk_index=idx,
                text=text,
                kind="directory_summary",
                symbol=top,
                line_start=0,
                line_end=0,
            )
        )
    return chunks


def build_repo_map_chunk(repo_root: Path, include_top_dirs: Iterable[str]) -> CodeChunk:
    repo_root = repo_root.resolve()
    lines = [f"# {repo_root.name} 모노레포 구조 (인덱싱된 디렉토리 목록)"]
    for top in sorted(set(include_top_dirs)):
        top_dir = repo_root / top
        if not top_dir.is_dir():
            continue
        hints = _hint_files(top_dir)
        suffix = f"  [{', '.join(hints)}]" if hints else ""
        lines.append(f"- {top}/{suffix}")
    return CodeChunk(
        rel_path="(repo_map)",
        chunk_index=0,
        text="\n".join(lines),
        kind="repo_map",
        symbol=None,
        line_start=0,
        line_end=0,
    )


def list_indexed_directories(repo_root: Path, include_top_dirs: Iterable[str]) -> list[DirectoryStat]:
    repo_root = repo_root.resolve()
    stats: list[DirectoryStat] = []
    for top in sorted(set(include_top_dirs)):
        top_dir = repo_root / top
        if not top_dir.is_dir():
            continue
        count = sum(1 for _ in top_dir.rglob("*") if _.is_file())
        stats.append(DirectoryStat(rel_dir=top, file_count=count))
    return stats
