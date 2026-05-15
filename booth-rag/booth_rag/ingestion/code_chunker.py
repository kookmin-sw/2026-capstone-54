from __future__ import annotations

import ast
import re
from dataclasses import dataclass
from itertools import pairwise

from booth_rag.ingestion.code_walker import CodeFile
from booth_rag.utils.secret_filter import redact_secrets

_TARGET_CHARS = 1500
_OVERLAP_CHARS = 150
_MAX_CHUNK_CHARS = 3000
_OUTLINE_MAX_SYMBOLS = 40
_OUTLINE_DOCSTRING_CHARS = 400


@dataclass(frozen=True)
class CodeChunk:
    rel_path: str
    chunk_index: int
    text: str
    kind: str
    symbol: str | None
    line_start: int
    line_end: int


def _slice_lines(lines: list[str], line_start_1based: int, line_end_1based: int) -> str:
    return "\n".join(lines[line_start_1based - 1 : line_end_1based])


def _python_outline(file: CodeFile, tree: ast.Module) -> str:
    parts: list[str] = []
    module_doc = ast.get_docstring(tree)
    if module_doc:
        parts.append(f'"""\n{module_doc[:_OUTLINE_DOCSTRING_CHARS]}\n"""')

    imports: list[str] = []
    for node in tree.body:
        if isinstance(node, ast.Import):
            imports.extend(alias.name for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module:
            imports.append(node.module)
    if imports:
        unique = list(dict.fromkeys(imports))[:15]
        parts.append("# imports: " + ", ".join(unique))

    symbols: list[str] = []
    for node in tree.body:
        if isinstance(node, ast.FunctionDef | ast.AsyncFunctionDef):
            sig = _python_function_signature(node, is_async=isinstance(node, ast.AsyncFunctionDef))
            symbols.append(sig)
        elif isinstance(node, ast.ClassDef):
            symbols.extend(_python_class_outline(node))
        if len(symbols) >= _OUTLINE_MAX_SYMBOLS:
            symbols.append(f"# ... +{_count_remaining_symbols(tree, len(symbols))} more")
            break
    if symbols:
        parts.append("# symbols:")
        parts.extend(symbols)

    return "\n".join(parts) if parts else ""


def _python_function_signature(node: ast.FunctionDef | ast.AsyncFunctionDef, *, is_async: bool) -> str:
    args = [a.arg for a in node.args.args]
    prefix = "async def" if is_async else "def"
    sig = f"{prefix} {node.name}({', '.join(args)})"
    doc = ast.get_docstring(node)
    if doc:
        first = doc.strip().split("\n", 1)[0]
        sig += f"  # {first[:120]}"
    return sig


def _python_class_outline(node: ast.ClassDef) -> list[str]:
    bases = [ast.unparse(b) if hasattr(ast, "unparse") else "?" for b in node.bases]
    header = f"class {node.name}({', '.join(bases) if bases else ''}):"
    doc = ast.get_docstring(node)
    if doc:
        first = doc.strip().split("\n", 1)[0]
        header += f"  # {first[:120]}"
    out = [header]
    for child in node.body:
        if isinstance(child, ast.FunctionDef | ast.AsyncFunctionDef):
            args = [a.arg for a in child.args.args]
            prefix = "    async def" if isinstance(child, ast.AsyncFunctionDef) else "    def"
            out.append(f"{prefix} {child.name}({', '.join(args)})")
    return out


def _count_remaining_symbols(tree: ast.Module, already: int) -> int:
    total = sum(1 for n in tree.body if isinstance(n, ast.FunctionDef | ast.AsyncFunctionDef | ast.ClassDef))
    return max(0, total - already)


def _python_chunks(file: CodeFile, lines: list[str]) -> list[CodeChunk]:
    try:
        tree = ast.parse(file.text)
    except SyntaxError:
        return _generic_chunks(file)

    chunks: list[CodeChunk] = []
    idx = 0

    outline = _python_outline(file, tree)
    if outline:
        outline_text = f"# OUTLINE: {file.rel_path}\n{outline}"
        chunks.append(
            CodeChunk(
                rel_path=file.rel_path,
                chunk_index=idx,
                text=outline_text,
                kind="outline",
                symbol=None,
                line_start=1,
                line_end=len(lines),
            )
        )
        idx += 1

    last_handled_line = 0
    for node in tree.body:
        if isinstance(node, ast.FunctionDef | ast.AsyncFunctionDef | ast.ClassDef):
            line_start = getattr(node, "lineno", 1)
            line_end = getattr(node, "end_lineno", line_start)
            if line_start <= last_handled_line:
                continue
            text = _slice_lines(lines, line_start, line_end)
            if len(text) > _MAX_CHUNK_CHARS:
                text = text[:_MAX_CHUNK_CHARS] + "\n# ... [truncated]"
            kind = "class" if isinstance(node, ast.ClassDef) else "function"
            chunks.append(
                CodeChunk(
                    rel_path=file.rel_path,
                    chunk_index=idx,
                    text=text,
                    kind=kind,
                    symbol=node.name,
                    line_start=line_start,
                    line_end=line_end,
                )
            )
            idx += 1
            last_handled_line = line_end

    if len(chunks) <= 1 and not outline:
        return _generic_chunks(file)
    return chunks


_TS_SYMBOL_PATTERN = re.compile(
    r"^\s*(?:export\s+)?(?:default\s+)?"
    r"(?:async\s+)?(?:function|class|interface|type|const|let|var|enum)\s+"
    r"([A-Za-z_$][A-Za-z0-9_$]*)",
    re.MULTILINE,
)

_TS_IMPORT_PATTERN = re.compile(r"""import[^'"\n]*['"]([^'"\n]+)['"]""")
_TS_EXPORT_PATTERN = re.compile(
    r"^\s*export\s+(?:default\s+)?(?:async\s+)?"
    r"(function|class|interface|type|const|let|var|enum)\s+([A-Za-z_$][A-Za-z0-9_$]*)",
    re.MULTILINE,
)


def _ts_outline(file: CodeFile) -> str:
    parts: list[str] = []
    imports = list(dict.fromkeys(m.group(1) for m in _TS_IMPORT_PATTERN.finditer(file.text)))
    if imports:
        parts.append("// imports: " + ", ".join(imports[:15]))
    exports: list[tuple[str, str]] = [(m.group(1), m.group(2)) for m in _TS_EXPORT_PATTERN.finditer(file.text)]
    if exports:
        parts.append("// exports:")
        for kind, name in exports[:_OUTLINE_MAX_SYMBOLS]:
            parts.append(f"  export {kind} {name}")
    return "\n".join(parts) if parts else ""


def _ts_chunks(file: CodeFile, lines: list[str]) -> list[CodeChunk]:
    chunks: list[CodeChunk] = []
    idx = 0
    outline = _ts_outline(file)
    if outline:
        outline_text = f"// OUTLINE: {file.rel_path}\n{outline}"
        chunks.append(
            CodeChunk(
                rel_path=file.rel_path,
                chunk_index=idx,
                text=outline_text,
                kind="outline",
                symbol=None,
                line_start=1,
                line_end=len(lines),
            )
        )
        idx += 1

    boundaries: list[tuple[int, str]] = [(1, "module_header")]
    for match in _TS_SYMBOL_PATTERN.finditer(file.text):
        line_no = file.text.count("\n", 0, match.start()) + 1
        boundaries.append((line_no, match.group(1)))

    if len(boundaries) <= 1:
        if not chunks:
            return _generic_chunks(file)
        return chunks

    boundaries.append((len(lines) + 1, "_end_"))
    for (start, sym), (next_start, _) in pairwise(boundaries):
        end = next_start - 1
        text = _slice_lines(lines, start, end).strip()
        if not text:
            continue
        if len(text) > _MAX_CHUNK_CHARS:
            text = text[:_MAX_CHUNK_CHARS] + "\n// ... [truncated]"
        kind = "module_header" if sym == "module_header" else "symbol"
        chunks.append(
            CodeChunk(
                rel_path=file.rel_path,
                chunk_index=idx,
                text=text,
                kind=kind,
                symbol=None if sym == "module_header" else sym,
                line_start=start,
                line_end=end,
            )
        )
        idx += 1
    return chunks


def _markdown_chunks(file: CodeFile, lines: list[str]) -> list[CodeChunk]:
    sections: list[tuple[int, int, str]] = []
    current_start = 1
    current_title = "intro"
    for i, line in enumerate(lines, start=1):
        if line.startswith("#"):
            if i > current_start:
                sections.append((current_start, i - 1, current_title))
            current_title = line.lstrip("#").strip() or current_title
            current_start = i
    sections.append((current_start, len(lines), current_title))

    chunks: list[CodeChunk] = []
    for idx, (start, end, title) in enumerate(sections):
        text = _slice_lines(lines, start, end).strip()
        if not text:
            continue
        if len(text) > _MAX_CHUNK_CHARS:
            text = text[:_MAX_CHUNK_CHARS] + "\n... [truncated]"
        chunks.append(
            CodeChunk(
                rel_path=file.rel_path,
                chunk_index=idx,
                text=text,
                kind="markdown_section",
                symbol=title,
                line_start=start,
                line_end=end,
            )
        )
    return chunks or _generic_chunks(file)


def _generic_chunks(file: CodeFile) -> list[CodeChunk]:
    text = file.text
    chunks: list[CodeChunk] = []
    idx = 0
    pos = 0
    while pos < len(text):
        end = min(pos + _TARGET_CHARS, len(text))
        chunk_text = text[pos:end]
        line_start = text.count("\n", 0, pos) + 1
        line_end = text.count("\n", 0, end) + 1
        chunks.append(
            CodeChunk(
                rel_path=file.rel_path,
                chunk_index=idx,
                text=chunk_text,
                kind="generic",
                symbol=None,
                line_start=line_start,
                line_end=line_end,
            )
        )
        idx += 1
        if end == len(text):
            break
        pos = end - _OVERLAP_CHARS
        if pos <= 0:
            pos = end
    return chunks


def chunk_file(file: CodeFile) -> list[CodeChunk]:
    """Split file into semantically meaningful chunks. Redacts secrets in-place."""
    redacted = redact_secrets(file.text)
    if redacted.redactions:
        file = CodeFile(
            path=file.path,
            rel_path=file.rel_path,
            suffix=file.suffix,
            size_bytes=file.size_bytes,
            text=redacted.text,
        )
    lines = file.text.split("\n")

    if file.suffix in {".py", ".pyi"}:
        return _python_chunks(file, lines)
    if file.suffix in {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"}:
        return _ts_chunks(file, lines)
    if file.suffix in {".md", ".mdx", ".rst"}:
        return _markdown_chunks(file, lines)
    return _generic_chunks(file)
