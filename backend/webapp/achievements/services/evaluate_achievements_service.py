import json

import structlog
from achievements.models import Achievement, UserAchievement
from achievements.services.condition_evaluator import ConditionEvaluator
from achievements.services.evaluation_alert_service import record_evaluation_outcome
from common.services import BaseService
from django.db import IntegrityError
from django.db.models import Q
from django.utils import timezone

logger = structlog.get_logger(__name__)
MAX_ACHIEVEMENT_SNAPSHOT_BYTES = 4096


class EvaluateAchievementsService(BaseService):
  """사용자의 미달성 도전과제을 평가하고 새 달성 이력을 생성한다."""

  required_value_kwargs = []

  def execute(self):
    user = self.user
    context = self.kwargs.get("context", {})
    now = timezone.now()
    candidates = (
      Achievement.objects.filter(is_active=True).exclude(
        user_achievements__user=user
      ).filter(Q(starts_at__lte=now) | Q(starts_at__isnull=True)).filter(Q(ends_at__gte=now) | Q(ends_at__isnull=True))
    )

    evaluator = ConditionEvaluator()
    created = []
    trigger_key = self.kwargs.get("trigger_key")
    for achievement in candidates:
      try:
        result = evaluator.evaluate(user=user, rule=achievement.condition_payload, context=context)
      except Exception as exc:  # noqa: BLE001
        record_evaluation_outcome(trigger_key=trigger_key, is_failure=True)
        logger.exception(
          "achievement_evaluation_failed",
          extra={
            "event": "achievement_evaluation_failed",
            "user_id": user.id,
            "achievement_code": achievement.code,
            "trigger_key": self.kwargs.get("trigger_key"),
            "trigger_type": self.kwargs.get("trigger_type"),
            "failure_reason": str(exc),
          },
        )
        continue

      record_evaluation_outcome(trigger_key=trigger_key, is_failure=False)
      logger.info(
        "achievement_evaluated",
        extra={
          "event": "achievement_evaluated",
          "user_id": user.id,
          "achievement_code": achievement.code,
          "trigger_key": self.kwargs.get("trigger_key"),
          "trigger_type": self.kwargs.get("trigger_type"),
          "evaluation_result": result.is_satisfied,
        },
      )
      if not result.is_satisfied:
        continue
      try:
        user_achievement = UserAchievement.objects.create(
          user=user,
          achievement=achievement,
          achieved_at=now,
          achievement_snapshot_payload=self._build_achievement_snapshot_payload(
            achievement=achievement,
            result=result,
            now=now,
          ),
        )
        created.append(user_achievement)
      except IntegrityError:
        continue
    return created

  def _build_achievement_snapshot_payload(self, *, achievement, result, now):
    payload = {
      "version": 1,
      "captured_at": now.isoformat(),
      "achievement_code": achievement.code,
      "condition_type": achievement.condition_type,
      "condition_schema_version": achievement.condition_schema_version,
      "is_satisfied": result.is_satisfied,
      "evidence": result.evidence,
      "errors": result.errors,
    }
    return self._enforce_snapshot_size_limit(payload)

  def _enforce_snapshot_size_limit(self, payload: dict) -> dict:
    serialized = json.dumps(payload, ensure_ascii=False, default=str)
    if len(serialized.encode("utf-8")) <= MAX_ACHIEVEMENT_SNAPSHOT_BYTES:
      return payload

    # Keep key metadata and replace large detail blocks.
    compact_payload = {
      **payload,
      "evidence": {
        "truncated": True,
        "reason": "snapshot_size_limit_exceeded",
      },
      "errors": ["snapshot_payload_truncated"],
    }
    return compact_payload
