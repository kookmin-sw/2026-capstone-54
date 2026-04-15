"""이력서 통계 서비스. 분류별로 통계를 분리하여 제공한다."""

from collections import Counter
from datetime import timedelta

from django.db.models import Count, Q
from django.utils import timezone
from resumes.enums import AnalysisStatus, ResumeType
from resumes.models import Resume


class ResumeCountStatsService:
  """전체/분석 중/실패/활성/비활성 개수."""

  def __init__(self, user):
    self.user = user

  def perform(self) -> dict:
    qs = Resume.objects.filter(user=self.user)
    agg = qs.aggregate(
      total=Count("pk"),
      processing=Count("pk", filter=Q(analysis_status=AnalysisStatus.PROCESSING)),
      pending=Count("pk", filter=Q(analysis_status=AnalysisStatus.PENDING)),
      completed=Count("pk", filter=Q(analysis_status=AnalysisStatus.COMPLETED)),
      failed=Count("pk", filter=Q(analysis_status=AnalysisStatus.FAILED)),
      active=Count("pk", filter=Q(is_active=True)),
      inactive=Count("pk", filter=Q(is_active=False)),
    )
    return {
      "total": agg["total"],
      "processing": agg["processing"],
      "pending": agg["pending"],
      "completed": agg["completed"],
      "failed": agg["failed"],
      "active": agg["active"],
      "inactive": agg["inactive"],
    }


class ResumeTypeStatsService:
  """파일/텍스트 타입별 개수."""

  def __init__(self, user):
    self.user = user

  def perform(self) -> dict:
    qs = Resume.objects.filter(user=self.user)
    agg = qs.aggregate(
      file_count=Count("pk", filter=Q(type=ResumeType.FILE)),
      text_count=Count("pk", filter=Q(type=ResumeType.TEXT)),
    )
    return {
      "file_count": agg["file_count"],
      "text_count": agg["text_count"],
    }


class ResumeTopSkillsStatsService:
  """parsed_data에서 가장 자주 등장하는 스킬 Top N."""

  def __init__(self, user, limit: int = 5):
    self.user = user
    self.limit = limit

  def perform(self) -> dict:
    qs = Resume.objects.filter(
      user=self.user,
      is_parsed=True,
      parsed_data__isnull=False,
    )
    counter: Counter = Counter()
    for resume in qs.only("parsed_data"):
      data = resume.parsed_data or {}
      skills = data.get("skills") or {}
      # 정규화 스키마: { technical, soft, tools, languages }
      if isinstance(skills, dict):
        for group_skills in skills.values():
          if isinstance(group_skills, list):
            counter.update(str(s).strip() for s in group_skills if s)
      # 구형 호환: skills가 list인 경우
      elif isinstance(skills, list):
        counter.update(str(s).strip() for s in skills if s)

    top = counter.most_common(self.limit)
    return {
      "top_skills": [{
        "name": name,
        "count": count
      } for name, count in top],
      "total_unique_skills": len(counter),
    }


class ResumeRecentActivityStatsService:
  """최근 N일 내 분석 완료된 이력서 수."""

  DEFAULT_DAYS = 7

  def __init__(self, user, days: int = DEFAULT_DAYS):
    self.user = user
    self.days = days

  def perform(self) -> dict:
    since = timezone.now() - timedelta(days=self.days)
    recent_count = Resume.objects.filter(
      user=self.user,
      analyzed_at__gte=since,
      analysis_status=AnalysisStatus.COMPLETED,
    ).count()
    return {
      "days": self.days,
      "recently_analyzed_count": recent_count,
    }
