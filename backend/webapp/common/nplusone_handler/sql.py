"""
N+1 관련 SQL 수집 및 압축.

snapshot_index 이전(부모 모델 조회)과 이후(반복 쿼리)를 합쳐
패턴 기준으로 중복 압축한 문자열을 반환한다.
"""

from __future__ import annotations

import re

_MAX_SQL_ENTRIES = 5


def _to_snake_plural(name: str) -> str:
  """CamelCase 모델명 → snake_case 복수형 테이블명 추정."""
  return re.sub(r"(?<!^)(?=[A-Z])", "_", name).lower() + "s"


def _normalize_sql(sql: str) -> str:
  """SQL 리터럴 값을 ? 로 치환해 패턴화한다."""
  sql = re.sub(r"'[^']*'", "?", sql)
  sql = re.sub(r"\b\d+\b", "?", sql)
  return re.sub(r"\s+", " ", sql).strip()


def collect_sql(model: str, field: str, snapshot_index: int) -> str:
  """N+1 관련 SQL 을 수집해 압축된 문자열로 반환한다.

    Args:
        model:          N+1 감지된 모델명 (예: EmailVerificationCode)
        field:          N+1 감지된 필드명 (예: user)
        snapshot_index: emit() 시점의 connection.queries 길이
                        — 이전: 부모 모델 조회, 이후: 반복 쿼리 전체
    """
  try:
    from django.db import connection
    all_queries = connection.queries
    if not all_queries:
      return ""

    hints = {_to_snake_plural(model), _to_snake_plural(field), field.lower()}
    before = [q for q in all_queries[:snapshot_index] if any(h in q["sql"].lower() for h in hints)]
    after = all_queries[snapshot_index:]
    related = before + after or all_queries[-10:]

    counts: dict[str, int] = {}
    for q in related:
      key = _normalize_sql(q["sql"])
      counts[key] = counts.get(key, 0) + 1

    items = list(counts.items())
    shown, hidden = items[:_MAX_SQL_ENTRIES], items[_MAX_SQL_ENTRIES:]

    lines: list[str] = []
    for sql, count in shown:
      prefix = f"-- ×{count} 반복 (N+1 의심)\n" if count > 1 else ""
      lines.append(f"{prefix}{sql}")

    if hidden:
      lines.append(f"-- ... 외 {len(hidden)}개 쿼리 생략")

    return "\n\n".join(lines)
  except Exception:
    return ""
