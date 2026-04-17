from dataclasses import dataclass
from datetime import datetime

from django.apps import apps
from django.db.models import Sum


@dataclass
class EvaluationResult:
  is_satisfied: bool
  evidence: dict
  errors: list[str]


class ConditionEvaluator:
  """도전과제 조건 DSL을 평가한다."""

  def evaluate(self, user, rule: dict, context: dict | None = None) -> EvaluationResult:
    context = context or {}
    rule_type = rule.get("type")
    if rule_type == "group":
      return self._evaluate_group(user, rule, context)
    if rule_type == "metric_threshold":
      return self._evaluate_metric_threshold(user, rule)
    if rule_type == "field_exists":
      return self._evaluate_field_exists(user, rule)
    if rule_type == "query_count_threshold":
      return self._evaluate_query_count_threshold(user, rule)
    return EvaluationResult(False, {}, [f"Unsupported rule type: {rule_type}"])

  def _evaluate_group(self, user, rule: dict, context: dict) -> EvaluationResult:
    logic = rule.get("logic", "AND")
    child_rules = rule.get("rules", [])
    child_results = [self.evaluate(user, child_rule, context) for child_rule in child_rules]
    errors = [error for result in child_results for error in result.errors]
    if logic == "OR":
      is_satisfied = any(result.is_satisfied for result in child_results)
    else:
      is_satisfied = all(result.is_satisfied for result in child_results)
    return EvaluationResult(
      is_satisfied=is_satisfied,
      evidence={
        "logic": logic,
        "children": [result.evidence for result in child_results]
      },
      errors=errors,
    )

  def _evaluate_metric_threshold(self, user, rule: dict) -> EvaluationResult:
    metric_key = rule.get("metric_key")
    operator = rule.get("operator")
    target = rule.get("target")
    actual = self._resolve_metric_value(user, metric_key)
    is_satisfied = _compare(actual, operator, target)
    return EvaluationResult(
      is_satisfied=is_satisfied,
      evidence={
        "type": "metric_threshold",
        "metric_key": metric_key,
        "actual": actual,
        "operator": operator,
        "target": target
      },
      errors=[],
    )

  def _evaluate_field_exists(self, user, rule: dict) -> EvaluationResult:
    field_path = rule.get("field_path", "")
    exists_expected = rule.get("exists", True)
    actual_exists = self._resolve_field_exists(user, field_path)
    is_satisfied = actual_exists is exists_expected
    return EvaluationResult(
      is_satisfied=is_satisfied,
      evidence={
        "type": "field_exists",
        "field_path": field_path,
        "actual_exists": actual_exists,
        "exists_expected": exists_expected
      },
      errors=[],
    )

  def _evaluate_query_count_threshold(self, user, rule: dict) -> EvaluationResult:
    query_key = rule.get("query_key")
    filters = rule.get("filters", {})
    operator = rule.get("operator")
    target = rule.get("target")
    actual = self._resolve_query_count(user, query_key, filters)
    is_satisfied = _compare(actual, operator, target)
    return EvaluationResult(
      is_satisfied=is_satisfied,
      evidence={
        "type": "query_count_threshold",
        "query_key": query_key,
        "actual": actual,
        "operator": operator,
        "target": target
      },
      errors=[],
    )

  def _resolve_metric_value(self, user, metric_key: str) -> int | float:
    if metric_key == "streak.current_days":
      StreakStatistics = apps.get_model("streaks", "StreakStatistics")
      stats = StreakStatistics.objects.filter(user=user).first()
      return stats.current_streak if stats else 0

    if metric_key == "interview.total_count":
      StreakLog = apps.get_model("streaks", "StreakLog")
      total = StreakLog.objects.filter(user=user).aggregate(total=Sum("interview_results_count"))["total"] or 0
      return total

    raise ValueError(f"Unsupported metric_key: {metric_key}")

  def _resolve_field_exists(self, user, field_path: str) -> bool:
    # 허용 경로 예시: "users.profile_completed_at"
    if field_path == "users.profile_completed_at":
      value = getattr(user, "profile_completed_at", None)
      return value is not None
    raise ValueError(f"Unsupported field_path: {field_path}")

  def _resolve_query_count(self, user, query_key: str, filters: dict) -> int:
    if query_key == "interview.logs":
      StreakLog = apps.get_model("streaks", "StreakLog")
      queryset = StreakLog.objects.filter(user=user)
      if "date__gte" in filters and isinstance(filters["date__gte"], str):
        filters = dict(filters)
        filters["date__gte"] = datetime.fromisoformat(filters["date__gte"]).date()
      return queryset.filter(**filters).count()
    raise ValueError(f"Unsupported query_key: {query_key}")


def _compare(actual, operator, target):
  if operator == "==":
    return actual == target
  if operator == "!=":
    return actual != target
  if operator == ">":
    return actual > target
  if operator == ">=":
    return actual >= target
  if operator == "<":
    return actual < target
  if operator == "<=":
    return actual <= target
  raise ValueError(f"Unsupported operator: {operator}")
