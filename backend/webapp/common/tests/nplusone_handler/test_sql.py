"""
nplusone_handler.sql 모듈 테스트.

connection.queries 를 mock 하여 실제 DB 없이 SQL 수집/압축 로직을 검증한다.
"""

from unittest.mock import patch

from common.nplusone_handler.sql import _normalize_sql, _to_snake_plural, collect_sql
from django.test import TestCase


class ToSnakePluralTest(TestCase):
  """_to_snake_plural 변환 테스트"""

  def test_camel_case_model_name(self):
    """CamelCase 모델명을 snake_case 복수형으로 변환한다."""
    self.assertEqual(_to_snake_plural("EmailVerificationCode"), "email_verification_codes")

  def test_single_word(self):
    """단일 단어 모델명을 소문자 복수형으로 변환한다."""
    self.assertEqual(_to_snake_plural("User"), "users")

  def test_already_lower(self):
    """이미 소문자인 경우 s만 붙인다."""
    self.assertEqual(_to_snake_plural("order"), "orders")


class NormalizeSqlTest(TestCase):
  """_normalize_sql 정규화 테스트"""

  def test_replaces_string_literals(self):
    """문자열 리터럴을 ?로 치환한다."""
    sql = "SELECT * FROM users WHERE email = 'test@example.com'"
    result = _normalize_sql(sql)
    self.assertNotIn("test@example.com", result)
    self.assertIn("?", result)

  def test_replaces_numeric_literals(self):
    """숫자 리터럴을 ?로 치환한다."""
    sql = "SELECT * FROM users WHERE id = 42 LIMIT 1"
    result = _normalize_sql(sql)
    self.assertNotIn("42", result)
    self.assertNotIn("1", result)

  def test_collapses_whitespace(self):
    """연속 공백을 단일 공백으로 압축한다."""
    sql = "SELECT  *   FROM   users"
    result = _normalize_sql(sql)
    self.assertEqual(result, "SELECT * FROM users")

  def test_same_query_different_values_normalizes_equal(self):
    """값만 다른 동일 패턴 쿼리는 같은 정규화 결과를 반환한다."""
    sql1 = "SELECT * FROM users WHERE id = 1"
    sql2 = "SELECT * FROM users WHERE id = 2"
    self.assertEqual(_normalize_sql(sql1), _normalize_sql(sql2))


class CollectSqlTest(TestCase):
  """collect_sql 수집 및 압축 테스트"""

  def _make_query(self, sql: str) -> dict:
    return {"sql": sql, "time": "0.001"}

  @patch("common.nplusone_handler.sql.connection")
  def test_returns_empty_when_no_queries(self, mock_conn):
    """queries가 없으면 빈 문자열을 반환한다."""
    mock_conn.queries = []
    result = collect_sql("User", "profile", 0)
    self.assertEqual(result, "")

  @patch("common.nplusone_handler.sql.connection")
  def test_collects_after_snapshot(self, mock_conn):
    """snapshot_index 이후 쿼리를 수집한다."""
    mock_conn.queries = [
      self._make_query("SELECT * FROM other_table"),  # before (관련 없음)
      self._make_query("SELECT * FROM users WHERE id = 1"),  # after
      self._make_query("SELECT * FROM users WHERE id = 2"),  # after
    ]
    result = collect_sql("User", "profile", 1)
    self.assertIn("users", result.lower())

  @patch("common.nplusone_handler.sql.connection")
  def test_repeated_queries_marked_as_nplusone(self, mock_conn):
    """동일 패턴 쿼리가 반복되면 N+1 의심 주석이 붙는다."""
    mock_conn.queries = [
      self._make_query("SELECT * FROM users WHERE id = 1"),
      self._make_query("SELECT * FROM users WHERE id = 2"),
      self._make_query("SELECT * FROM users WHERE id = 3"),
    ]
    result = collect_sql("User", "id", 0)
    self.assertIn("N+1", result)
    self.assertIn("반복", result)

  @patch("common.nplusone_handler.sql.connection")
  def test_max_entries_limit(self, mock_conn):
    """_MAX_SQL_ENTRIES(5)를 초과하는 쿼리는 생략 메시지로 표시된다."""
    mock_conn.queries = [self._make_query(f"SELECT * FROM table_{i} WHERE x = {i}") for i in range(10)]
    result = collect_sql("Table", "x", 0)
    self.assertIn("생략", result)

  @patch("common.nplusone_handler.sql.connection")
  def test_returns_empty_on_exception(self, mock_conn):
    """예외 발생 시 빈 문자열을 반환한다."""
    mock_conn.queries = None  # 의도적 오류 유발
    result = collect_sql("User", "profile", 0)
    self.assertEqual(result, "")
