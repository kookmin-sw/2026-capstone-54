from django.db import transaction
from profiles.models import Job, JobCategory


class SeedService:
  """직군 및 직업 기본 데이터 생성 서비스"""

  # 기본 직군 데이터
  CATEGORIES = [
    {
      "emoji": "💻",
      "name": "IT/개발"
    },
    {
      "emoji": "📢",
      "name": "마케팅"
    },
    {
      "emoji": "💰",
      "name": "금융/회계"
    },
    {
      "emoji": "🤝",
      "name": "영업/서비스"
    },
    {
      "emoji": "👥",
      "name": "인사/HR"
    },
  ]

  # 직군별 직업 데이터
  JOBS_BY_CATEGORY = {
    "IT/개발": [
      "백엔드 개발자",
      "프론트엔드 개발자",
      "풀스택 개발자",
      "DevOps 엔지니어",
      "데이터 엔지니어",
      "머신러닝 엔지니어",
      "iOS 개발자",
      "Android 개발자",
      "게임 개발자",
      "QA 엔지니어",
      "보안 엔지니어",
      "DBA",
      "시스템 엔지니어",
      "네트워크 엔지니어",
      "클라우드 엔지니어",
    ],
    "마케팅": [
      "디지털 마케터",
      "퍼포먼스 마케터",
      "콘텐츠 마케터",
      "브랜드 마케터",
      "그로스 마케터",
      "CRM 마케터",
      "소셜미디어 마케터",
      "SEO 전문가",
      "마케팅 기획자",
      "광고 기획자",
      "프로덕트 마케터",
    ],
    "금융/회계": [
      "회계사",
      "세무사",
      "재무 분석가",
      "투자 분석가",
      "펀드 매니저",
      "리스크 매니저",
      "회계 담당자",
      "재무 담당자",
      "IR 담당자",
      "금융 상품 기획자",
      "신용 분석가",
    ],
    "영업/서비스": [
      "B2B 영업",
      "B2C 영업",
      "기술 영업",
      "해외 영업",
      "영업 기획자",
      "영업 관리자",
      "고객 서비스",
      "CS 매니저",
      "Account Manager",
      "Sales Engineer",
      "영업 지원",
    ],
    "인사/HR": [
      "인사 담당자",
      "채용 담당자",
      "HR 기획자",
      "조직문화 담당자",
      "교육 담당자",
      "보상 담당자",
      "노무 담당자",
      "HRBP",
      "리크루터",
      "헤드헌터",
      "인재개발 담당자",
    ],
  }

  @classmethod
  @transaction.atomic
  def seed_all(cls):
    """모든 기본 데이터 생성"""
    created_categories = cls.seed_categories()
    created_jobs = cls.seed_jobs()

    return {
      "categories_created": created_categories,
      "jobs_created": created_jobs,
    }

  @classmethod
  def seed_categories(cls):
    """직군 기본 데이터 생성"""
    created_count = 0

    for category_data in cls.CATEGORIES:
      _, created = JobCategory.objects.get_or_create(
        name=category_data["name"], defaults={"emoji": category_data["emoji"]}
      )
      if created:
        created_count += 1

    return created_count

  @classmethod
  def seed_jobs(cls):
    """직업 기본 데이터 생성"""
    created_count = 0

    for category_name, job_names in cls.JOBS_BY_CATEGORY.items():
      try:
        category = JobCategory.objects.get(name=category_name)
      except JobCategory.DoesNotExist:
        continue

      for job_name in job_names:
        _, created = Job.objects.get_or_create(name=job_name, category=category)
        if created:
          created_count += 1

    return created_count
