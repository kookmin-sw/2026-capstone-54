"""structured 모드 이력서 생성 요청 serializer.

사용자가 이미 구조화 입력 UI 로 직접 작성한 정규화 데이터를 한 번에 수신한다.
LLM 분석 단계는 생략되고, 저장 직후 곧바로 임베딩 파이프라인이 발행된다.

drf-writable-nested 로 basic_info / summary / career_meta / experiences / educations /
certifications / awards / projects / languages_spoken 까지 단일 트랜잭션에서 저장하고,
canonical 참조 테이블을 거치는 N:M (skills / industry_domains / keywords) 과
FK(resume_job_category) 는 write-only 필드로 받아 create() 후처리에서 서비스로 위임한다.
"""

from django.utils import timezone
from drf_writable_nested import WritableNestedModelSerializer
from rest_framework import serializers
from resumes.enums import AnalysisStatus, AnalysisStep, ResumeSourceMode, ResumeType
from resumes.models import Resume, ResumeJobCategory
from resumes.services import (
  ReplaceResumeIndustryDomainsService,
  ReplaceResumeKeywordsService,
  ReplaceResumeSkillsService,
  UpdateResumeJobCategoryService,
)

from .resume_award_nested_serializer import ResumeAwardNestedSerializer
from .resume_basic_info_nested_serializer import ResumeBasicInfoNestedSerializer
from .resume_career_meta_nested_serializer import ResumeCareerMetaNestedSerializer
from .resume_certification_nested_serializer import ResumeCertificationNestedSerializer
from .resume_education_nested_serializer import ResumeEducationNestedSerializer
from .resume_experience_nested_serializer import ResumeExperienceNestedSerializer
from .resume_language_spoken_nested_serializer import ResumeLanguageSpokenNestedSerializer
from .resume_project_nested_serializer import ResumeProjectNestedSerializer
from .resume_skills_group_serializer import ResumeSkillsGroupSerializer
from .resume_summary_nested_serializer import ResumeSummaryNestedSerializer


class ResumeStructuredCreateRequestSerializer(WritableNestedModelSerializer):
  """사용자가 구조화 입력 UI 로 작성한 이력서를 한 번에 저장한다."""

  title = serializers.CharField(max_length=255)

  # 1:1 reverse
  basic_info = ResumeBasicInfoNestedSerializer(required=False)
  summary = ResumeSummaryNestedSerializer(required=False)
  career_meta = ResumeCareerMetaNestedSerializer(required=False)

  # 1:N reverse
  experiences = ResumeExperienceNestedSerializer(many=True, required=False)
  educations = ResumeEducationNestedSerializer(many=True, required=False)
  certifications = ResumeCertificationNestedSerializer(many=True, required=False)
  awards = ResumeAwardNestedSerializer(many=True, required=False)
  projects = ResumeProjectNestedSerializer(many=True, required=False)
  languages_spoken = ResumeLanguageSpokenNestedSerializer(many=True, required=False)

  # N:M (canonical 참조 → service 후처리)
  skills = ResumeSkillsGroupSerializer(required=False, write_only=True)
  industry_domains = serializers.ListField(
    child=serializers.CharField(allow_blank=True),
    required=False,
    write_only=True,
  )
  keywords = serializers.ListField(
    child=serializers.CharField(allow_blank=True),
    required=False,
    write_only=True,
  )

  # FK 참조 — 생성 시 `_id` suffix, 응답에는 없는 키 (ResumeSerializer.resume_job_category)
  resume_job_category_id = serializers.PrimaryKeyRelatedField(
    source="resume_job_category",
    queryset=ResumeJobCategory.objects.all(),
    required=False,
    allow_null=True,
    write_only=True,
  )
  # lookup-or-create: 이름 문자열을 받아 canonical 행을 upsert 한다.
  # FK `_id` 규칙의 예외 — 사용자가 chip/autocomplete 으로 라벨을 선택하는 flow 전용.
  resume_job_category_name = serializers.CharField(
    required=False,
    allow_blank=True,
    write_only=True,
  )

  class Meta:
    model = Resume
    fields = [
      "title",
      "basic_info",
      "summary",
      "career_meta",
      "experiences",
      "educations",
      "certifications",
      "awards",
      "projects",
      "languages_spoken",
      "skills",
      "industry_domains",
      "keywords",
      "resume_job_category_id",
      "resume_job_category_name",
    ]

  def create(self, validated_data):
    # 1) canonical N:M 은 nested 가 아니라 별도 서비스로 처리하기 위해 pop
    skills = validated_data.pop("skills", None)
    industry_domains = validated_data.pop("industry_domains", None)
    keywords = validated_data.pop("keywords", None)
    job_category_name = validated_data.pop("resume_job_category_name", "") or ""

    # 2) structured 전용 기본 상태 세팅
    validated_data["type"] = ResumeType.STRUCTURED
    validated_data["source_mode"] = ResumeSourceMode.STRUCTURED
    validated_data["analysis_status"] = AnalysisStatus.COMPLETED
    validated_data["analysis_step"] = AnalysisStep.DONE
    validated_data["is_parsed"] = True
    validated_data["analyzed_at"] = timezone.now()

    # 3) drf-writable-nested 의 create() 가 nested 자식 저장까지 모두 처리
    resume = super().create(validated_data)

    # 4) canonical 참조 테이블 경유 N:M 은 기존 replace 서비스로 위임
    if skills:
      ReplaceResumeSkillsService(resume=resume, skills=skills).perform()
    if industry_domains:
      ReplaceResumeIndustryDomainsService(resume=resume, industry_domains=industry_domains).perform()
    if keywords:
      ReplaceResumeKeywordsService(resume=resume, keywords=keywords).perform()

    # 5) 이름 기반 job category upsert (chip/autocomplete 으로 선택된 라벨)
    #    _id 로 직접 붙이지 못한 경우에만 name lookup-or-create 를 태운다.
    if job_category_name and not resume.resume_job_category_id:
      UpdateResumeJobCategoryService(resume=resume, name=job_category_name).perform()
      resume.refresh_from_db()

    return resume
