from __future__ import annotations

from pathlib import Path

from booth_rag.ingestion.code_chunker import chunk_file
from booth_rag.ingestion.code_walker import CodeFile


def _make_pyfile(text: str, rel="m.py") -> CodeFile:
    return CodeFile(
        path=Path(rel),
        rel_path=rel,
        suffix=".py",
        size_bytes=len(text.encode()),
        text=text,
    )


def test_python_chunks_include_outline_with_module_docstring():
    src = '''"""미핏 백엔드 진입점.

캡스톤 54팀 메인 서비스.
"""
import os
from typing import Any


def hello(name: str) -> str:
    """Greet a user politely."""
    return f"hi {name}"


class Greeter:
    """채팅 인사 헬퍼."""

    def shout(self, msg: str) -> None:
        print(msg.upper())
'''
    chunks = chunk_file(_make_pyfile(src))
    kinds = [c.kind for c in chunks]
    assert "outline" in kinds
    outline = next(c for c in chunks if c.kind == "outline")
    assert "미핏 백엔드 진입점" in outline.text
    assert "def hello(name)" in outline.text
    assert "class Greeter" in outline.text


def test_python_outline_lists_imports():
    src = "import os\nfrom typing import Any\n\ndef f(): return 1\n"
    chunks = chunk_file(_make_pyfile(src))
    outline = next(c for c in chunks if c.kind == "outline")
    assert "imports:" in outline.text
    assert "os" in outline.text
    assert "typing" in outline.text


def test_ts_chunks_include_outline():
    src = "import { foo } from 'bar';\nexport function add(a, b) { return a + b; }\nexport class Greeter {}\n"
    cf = CodeFile(
        path=Path("a.ts"),
        rel_path="a.ts",
        suffix=".ts",
        size_bytes=len(src.encode()),
        text=src,
    )
    chunks = chunk_file(cf)
    outline = next((c for c in chunks if c.kind == "outline"), None)
    assert outline is not None
    assert "export function add" in outline.text
    assert "export class Greeter" in outline.text
