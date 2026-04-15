"""ResumeSkillsSectionViewSet 테스트."""

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from resumes.enums import SkillType
from resumes.factories import ResumeFactory
from resumes.models import ResumeSkill, Skill
from users.factories import UserFactory


class ResumeSkillsSectionViewSetTests(TestCase):
  """PUT /sections/skills/ — 4-group skills 전체 교체."""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(RefreshToken.for_user(self.user).access_token)}")
    self.resume = ResumeFactory(user=self.user, is_dirty=False)
    self.url = reverse(
      "resume-sections:resume-section-skills",
      kwargs={"resume_uuid": self.resume.pk},
    )

  def test_put_replaces_skills_and_creates_canonical_rows(self):
    response = self.client.put(
      self.url,
      data={"skills": {
        "technical": ["Python", "Django"],
        "soft": ["커뮤니케이션"],
        "tools": ["Docker"],
        "languages": [],
      }},
      format="json",
    )
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(ResumeSkill.objects.filter(resume=self.resume).count(), 4)
    self.assertTrue(Skill.objects.filter(name="python", skill_type=SkillType.TECHNICAL).exists())

  def test_put_second_time_replaces_not_appends(self):
    self.client.put(
      self.url,
      data={"skills": {
        "technical": ["Python"],
        "soft": [],
        "tools": [],
        "languages": []
      }},
      format="json",
    )
    self.client.put(
      self.url,
      data={"skills": {
        "technical": ["Rust"],
        "soft": [],
        "tools": [],
        "languages": []
      }},
      format="json",
    )
    self.assertEqual(ResumeSkill.objects.filter(resume=self.resume).count(), 1)
    skill_names = set(ResumeSkill.objects.filter(resume=self.resume).values_list("skill__name", flat=True))
    self.assertEqual(skill_names, {"rust"})

  def test_put_empty_groups_clears_all(self):
    self.client.put(
      self.url,
      data={"skills": {
        "technical": ["Python"],
        "soft": [],
        "tools": [],
        "languages": []
      }},
      format="json",
    )
    self.client.put(
      self.url,
      data={"skills": {
        "technical": [],
        "soft": [],
        "tools": [],
        "languages": []
      }},
      format="json",
    )
    self.assertEqual(ResumeSkill.objects.filter(resume=self.resume).count(), 0)

  def test_put_other_users_resume_returns_404(self):
    other = ResumeFactory(user=UserFactory(email_confirmed_at=timezone.now()))
    url = reverse(
      "resume-sections:resume-section-skills",
      kwargs={"resume_uuid": other.pk},
    )
    response = self.client.put(
      url,
      data={"skills": {
        "technical": ["x"],
        "soft": [],
        "tools": [],
        "languages": []
      }},
      format="json",
    )
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

  def test_unauthenticated_request_returns_401(self):
    response = APIClient().put(
      self.url,
      data={"skills": {
        "technical": [],
        "soft": [],
        "tools": [],
        "languages": []
      }},
      format="json",
    )
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
