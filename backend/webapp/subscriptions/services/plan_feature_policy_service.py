from common.services import BaseQueryService
from subscriptions.enums import PlanType


class PlanFeaturePolicyService(BaseQueryService):
  """플랜별 기능/제한 정책을 반환한다.

    향후 기능 제한이 늘어나더라도 이 서비스의 정책만 확장하면
    API/뷰의 분기 로직을 최소화할 수 있다.
    """

  FEATURE_FULL_PROCESS_INTERVIEW = "full_process_interview"
  FEATURE_REAL_MODE_INTERVIEW = "real_mode_interview"
  FEATURE_EYE_TRACKING_ANALYSIS = "eye_tracking_analysis"
  FEATURE_REPORT_RECORDING_PLAYBACK = "report_recording_playback"
  FEATURE_UNLIMITED_INTERVIEW_SESSION_ACCESS = "unlimited_interview_session_access"

  FREE_INTERVIEW_HISTORY_DAYS = 7

  PLAN_POLICIES = {
    PlanType.FREE: {
      "limits": {
        "max_active_resumes": 3,
        "max_active_job_descriptions": 5,
        "interview_session_history_days": FREE_INTERVIEW_HISTORY_DAYS,
      },
      "features": {
        FEATURE_FULL_PROCESS_INTERVIEW: False,
        FEATURE_REAL_MODE_INTERVIEW: False,
        FEATURE_EYE_TRACKING_ANALYSIS: True,
        FEATURE_REPORT_RECORDING_PLAYBACK: False,
        FEATURE_UNLIMITED_INTERVIEW_SESSION_ACCESS: False,
      },
    },
    PlanType.PRO: {
      "limits": {
        "max_active_resumes": None,
        "max_active_job_descriptions": None,
        "interview_session_history_days": None,
      },
      "features": {
        FEATURE_FULL_PROCESS_INTERVIEW: True,
        FEATURE_REAL_MODE_INTERVIEW: True,
        FEATURE_EYE_TRACKING_ANALYSIS: True,
        FEATURE_REPORT_RECORDING_PLAYBACK: True,
        FEATURE_UNLIMITED_INTERVIEW_SESSION_ACCESS: True,
      },
    },
  }

  required_value_kwargs = ["plan_type"]

  def execute(self):
    plan_type = self.kwargs["plan_type"]
    return self.PLAN_POLICIES.get(plan_type, self.PLAN_POLICIES[PlanType.FREE])

  @classmethod
  def get_policy(cls, plan_type: str):
    return cls.PLAN_POLICIES.get(plan_type, cls.PLAN_POLICIES[PlanType.FREE])

  @classmethod
  def can_use_feature(cls, plan_type: str, feature_key: str) -> bool:
    policy = cls.get_policy(plan_type)
    return bool(policy["features"].get(feature_key, False))

  @classmethod
  def get_max_active_resumes(cls, plan_type: str):
    policy = cls.get_policy(plan_type)
    return policy["limits"]["max_active_resumes"]

  @classmethod
  def get_interview_session_history_days(cls, plan_type: str):
    policy = cls.get_policy(plan_type)
    return policy["limits"]["interview_session_history_days"]
