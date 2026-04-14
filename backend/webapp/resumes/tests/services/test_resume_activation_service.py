from unittest.mock import patch

from django.test import TestCase
from resumes.factories import TextResumeFactory
from resumes.services.resume_activation_service import (
  ActivateResumeService,
  DeactivateResumeService,
)
from users.factories import UserFactory


class ActivateResumeServiceTests(TestCase):
  """ActivateResumeService 테스트."""

  def setUp(self):
    self.user = UserFactory()

  @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
  def test_activate_noop_when_already_active(self, mock_send_task):
    """이미 is_active=True 이면 save() 가 호출되지 않는다 (멱등)."""
    resume = TextResumeFactory(user=self.user, is_active=True)
    with patch.object(type(resume), "save") as mock_save:
      ActivateResumeService(resume=resume).perform()
      mock_save.assert_not_called()

  @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
  def test_activate_flips_inactive_resume_to_active(self, mock_send_task):
    """is_active=False 인 이력서를 True 로 전환한다."""
    resume = TextResumeFactory(user=self.user, is_active=False)
    ActivateResumeService(resume=resume).perform()
    resume.refresh_from_db()
    self.assertTrue(resume.is_active)


class DeactivateResumeServiceTests(TestCase):
  """DeactivateResumeService 테스트."""

  def setUp(self):
    self.user = UserFactory()

  @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
  def test_deactivate_flips_active_resume_to_inactive(self, mock_send_task):
    """is_active=True 인 이력서를 False 로 전환한다."""
    resume = TextResumeFactory(user=self.user, is_active=True)
    DeactivateResumeService(resume=resume).perform()
    resume.refresh_from_db()
    self.assertFalse(resume.is_active)

  @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
  def test_deactivate_noop_when_already_inactive(self, mock_send_task):
    """이미 is_active=False 이면 save() 가 호출되지 않는다 (멱등)."""
    resume = TextResumeFactory(user=self.user, is_active=False)
    with patch.object(type(resume), "save") as mock_save:
      DeactivateResumeService(resume=resume).perform()
      mock_save.assert_not_called()
