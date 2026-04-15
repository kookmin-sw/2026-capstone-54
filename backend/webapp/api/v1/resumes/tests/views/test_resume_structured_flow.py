"""구조화 생성 + 최종 저장 (finalize) 플로우 통합 스모크 테스트."""

from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from resumes.factories import ResumeFactory
from resumes.models import (
  ResumeBasicInfo,
  ResumeExperience,
  ResumeSkill,
)
from users.factories import UserFactory

# 구조화 요청 payload — drf-writable-nested 가 처리할 nested 구조 그대로 전송
_NESTED_PAYLOAD = {
  "type": "structured",
  "title": "구조화 이력서",
  "basic_info": {
    "name": "홍길동",
    "email": "hong@example.com"
  },
  "summary": {
    "text": "백엔드 개발자입니다."
  },
  "skills": {
    "technical": ["Python"],
    "soft": [],
    "tools": [],
    "languages": []
  },
  "experiences": [
    {
      "company": "ACME",
      "role": "Backend",
      "period": "2022-2024",
      "responsibilities": [],
      "highlights": [],
    }
  ],
}


class ResumeStructuredFlowTests(TestCase):
  """구조화 모드 생성 + finalize 통합 테스트."""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    token = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token.access_token)}")

  @patch("resumes.services.upload_resume_bundle_service.default_storage")
  @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
  def test_create_structured_resume_writes_submodels_and_dispatches_reembed(self, mock_send_task, mock_storage):
    """type=structured 생성 → nested sub-model 저장 + reembed 태스크 dispatch."""
    mock_storage.exists.return_value = False
    mock_storage.save.return_value = "resume_bundles/test.json"
    mock_storage.url.return_value = "http://s3mock/resume_bundles/test.json"

    response = self.client.post(
      reverse("resume-list"),
      data=_NESTED_PAYLOAD,
      format="json",
    )

    self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
    body = response.json()
    self.assertEqual(body["sourceMode"], "structured")

    # 정규화 sub-model 저장 확인 (drf-writable-nested 가 단일 트랜잭션에서 저장)
    self.assertTrue(ResumeBasicInfo.objects.filter(name="홍길동").exists())
    self.assertTrue(ResumeExperience.objects.filter(company="ACME").exists())
    # canonical 참조 테이블 경유 N:M (ReplaceResumeSkillsService 호출)
    self.assertEqual(ResumeSkill.objects.count(), 1)

    # reembed 태스크 dispatch 확인
    mock_send_task.assert_called_once()
    call = mock_send_task.call_args
    self.assertEqual(call.args[0], "analysis_resume.tasks.reembed_resume")
    self.assertEqual(call.kwargs["queue"], "analysis-resume")
    self.assertIn("bundle_url", call.kwargs["kwargs"])

  @patch("resumes.services.upload_resume_bundle_service.default_storage")
  @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
  def test_create_structured_with_minimal_payload_is_valid(self, mock_send_task, mock_storage):
    """title 만 있는 최소 payload 도 유효하다 (이후 section API 로 채울 수 있음)."""
    mock_storage.exists.return_value = False
    mock_storage.save.return_value = "resume_bundles/test.json"
    mock_storage.url.return_value = "http://s3mock/resume_bundles/test.json"

    response = self.client.post(
      reverse("resume-list"),
      data={
        "type": "structured",
        "title": "빈 구조화 이력서"
      },
      format="json",
    )
    self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)

  @patch("resumes.services.upload_resume_bundle_service.default_storage")
  @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
  def test_finalize_dispatches_reembed_and_clears_dirty(self, mock_send_task, mock_storage):
    """POST /resumes/{uuid}/finalize/ 시 is_dirty 해제 + reembed 태스크 dispatch."""
    mock_storage.exists.return_value = False
    mock_storage.save.return_value = "resume_bundles/test.json"
    mock_storage.url.return_value = "http://s3mock/resume_bundles/test.json"

    resume = ResumeFactory(user=self.user, is_dirty=True)

    response = self.client.post(reverse("resume-finalize", kwargs={"uuid": resume.pk}))

    self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
    resume.refresh_from_db()
    self.assertFalse(resume.is_dirty)
    self.assertIsNotNone(resume.last_finalized_at)

    mock_send_task.assert_called_once()
    self.assertEqual(mock_send_task.call_args.args[0], "analysis_resume.tasks.reembed_resume")
