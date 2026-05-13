from django.core.exceptions import ValidationError

ALLOWED_RULE_TYPES = {
  "group",
  "metric_threshold",
  "field_exists",
  "query_count_threshold",
}
ALLOWED_GROUP_LOGIC = {"AND", "OR"}
ALLOWED_OPERATORS = {"==", "!=", ">", ">=", "<", "<="}
ALLOWED_METRIC_KEYS = {
  "streak.current_days",
  "interview.total_count",
}


def validate_condition_payload(payload, schema_version: int = 1):
  """도전과제 조건 DSL payload 구조/의미를 검증한다."""
  if schema_version != 1:
    raise ValidationError(f"지원하지 않는 condition_schema_version입니다: {schema_version}")
  if not isinstance(payload, dict):
    raise ValidationError("condition_payload는 객체(JSON object)여야 합니다.")
  _validate_rule(payload)


def _validate_rule(rule):
  rule_type = rule.get("type")
  if rule_type not in ALLOWED_RULE_TYPES:
    raise ValidationError(f"지원하지 않는 rule type입니다: {rule_type}")

  if rule_type == "group":
    _validate_group_rule(rule)
    return
  if rule_type == "metric_threshold":
    _validate_metric_threshold_rule(rule)
    return
  if rule_type == "field_exists":
    _validate_field_exists_rule(rule)
    return
  if rule_type == "query_count_threshold":
    _validate_query_count_threshold_rule(rule)
    return

  raise ValidationError(f"알 수 없는 rule type입니다: {rule_type}")


def _validate_group_rule(rule):
  logic = rule.get("logic")
  rules = rule.get("rules")
  if logic not in ALLOWED_GROUP_LOGIC:
    raise ValidationError("group.logic는 AND 또는 OR여야 합니다.")
  if not isinstance(rules, list) or not rules:
    raise ValidationError("group.rules는 최소 1개 이상의 배열이어야 합니다.")
  for child_rule in rules:
    if not isinstance(child_rule, dict):
      raise ValidationError("group.rules 원소는 객체여야 합니다.")
    _validate_rule(child_rule)


def _validate_metric_threshold_rule(rule):
  metric_key = rule.get("metric_key")
  operator = rule.get("operator")
  target = rule.get("target")
  if metric_key not in ALLOWED_METRIC_KEYS:
    raise ValidationError(f"허용되지 않은 metric_key입니다: {metric_key}")
  if operator not in ALLOWED_OPERATORS:
    raise ValidationError(f"허용되지 않은 operator입니다: {operator}")
  if not isinstance(target, (int, float)):
    raise ValidationError("metric_threshold.target은 숫자여야 합니다.")


def _validate_field_exists_rule(rule):
  field_path = rule.get("field_path")
  exists = rule.get("exists", True)
  if not isinstance(field_path, str) or not field_path:
    raise ValidationError("field_exists.field_path는 비어있지 않은 문자열이어야 합니다.")
  if not isinstance(exists, bool):
    raise ValidationError("field_exists.exists는 boolean이어야 합니다.")
  if "target" in rule:
    raise ValidationError("field_exists 규칙은 target을 사용할 수 없습니다.")


def _validate_query_count_threshold_rule(rule):
  query_key = rule.get("query_key")
  filters = rule.get("filters")
  operator = rule.get("operator")
  target = rule.get("target")

  if not isinstance(query_key, str) or not query_key:
    raise ValidationError("query_count_threshold.query_key는 비어있지 않은 문자열이어야 합니다.")
  if filters is None:
    filters = {}
  if not isinstance(filters, dict):
    raise ValidationError("query_count_threshold.filters는 객체여야 합니다.")
  if operator not in ALLOWED_OPERATORS:
    raise ValidationError(f"허용되지 않은 operator입니다: {operator}")
  if not isinstance(target, (int, float)):
    raise ValidationError("query_count_threshold.target은 숫자여야 합니다.")
