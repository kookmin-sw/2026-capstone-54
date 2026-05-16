"""Lightweight heuristic to classify a query as code-leaning, doc-leaning, or both.

Used to skip one of the two embedding servers in dual mode when the query
is unambiguously one-sided — halves server work for those cases. Defaults
to BOTH on any ambiguity so quality never silently drops.

Signals tuned for the booth-rag corpus (Korean + Python/TS code + docx):
  - CODE: function-call syntax, CamelCase identifiers, snake_case, English
          dev-vocab (function/class/import 등), file path hints
  - DOC : 한국어 자연어, 발표/팀/서비스/기능 류 명사
"""

from __future__ import annotations

import re
from dataclasses import dataclass

_CODE_PATTERNS: tuple[re.Pattern[str], ...] = (
    re.compile(r"[a-zA-Z_][a-zA-Z0-9_]*\([^)]*\)"),
    re.compile(r"[a-z]+_[a-z0-9_]+"),
    re.compile(r"\b[A-Z][a-z]+[A-Z][a-zA-Z]+\b"),
    re.compile(r"\b(?:function|class|method|import|export|interface|module|signature)\b", re.IGNORECASE),
    re.compile(r"\b(?:async|await|return|throw|raise|yield)\b", re.IGNORECASE),
    re.compile(r"[a-z_]+\.[a-z_]+(?:\.[a-z_]+)*"),
    re.compile(r"\.(?:py|ts|tsx|js|jsx|tf|yaml|yml|sh|sql|md)\b"),
    re.compile(r"함수|메서드|구현|호출|시그니처|클래스|모듈"),
    re.compile(r"코드(?:는|가|를|의|에서|로|에|와|랑)?"),
)

_DOC_PATTERNS: tuple[re.Pattern[str], ...] = (
    re.compile(r"팀(?:원|장|구성|소개|페이지)?"),
    re.compile(r"부스|발표|시연|배지|소개"),
    re.compile(r"서비스|제품|기능|UI|화면|디자인|로고|배경|아바타"),
    re.compile(r"보고서|문서|docx|발표자료|기획서|README"),
    re.compile(r"미핏|MeFit|캡스톤|54팀|국민대"),
    re.compile(r"이력서|면접|시선|표정|발화|티켓|스트릭"),
    re.compile(r"운영|방식|정책|규칙|로드맵"),
)


@dataclass(frozen=True)
class IntentRouting:
    use_code: bool
    use_docs: bool

    @property
    def is_code_only(self) -> bool:
        return self.use_code and not self.use_docs

    @property
    def is_docs_only(self) -> bool:
        return self.use_docs and not self.use_code


def _score(query: str, patterns: tuple[re.Pattern[str], ...]) -> int:
    return sum(1 for p in patterns if p.search(query))


def classify_query(query: str) -> IntentRouting:
    """Heuristic: count regex hits for code vs doc signals.

    The bias is conservative — only commits to single-server routing when the
    winning side has ≥ 2 hits AND outscores the other by ≥ 2. Anything else
    falls back to BOTH (default dual behavior, no quality drop).
    """
    if not query or not query.strip():
        return IntentRouting(use_code=True, use_docs=True)
    code_hits = _score(query, _CODE_PATTERNS)
    doc_hits = _score(query, _DOC_PATTERNS)
    if code_hits >= 2 and code_hits - doc_hits >= 2:
        return IntentRouting(use_code=True, use_docs=False)
    if doc_hits >= 2 and doc_hits - code_hits >= 2:
        return IntentRouting(use_code=False, use_docs=True)
    return IntentRouting(use_code=True, use_docs=True)


def classify_queries(queries: list[str]) -> IntentRouting:
    """Aggregate routing across multiple probe queries.

    Returns code-only or docs-only ONLY if EVERY probe agrees. Even one
    ambiguous probe → falls back to BOTH so we never miss a corpus side.
    """
    if not queries:
        return IntentRouting(use_code=True, use_docs=True)
    intents = [classify_query(q) for q in queries]
    if all(i.is_code_only for i in intents):
        return IntentRouting(use_code=True, use_docs=False)
    if all(i.is_docs_only for i in intents):
        return IntentRouting(use_code=False, use_docs=True)
    return IntentRouting(use_code=True, use_docs=True)
