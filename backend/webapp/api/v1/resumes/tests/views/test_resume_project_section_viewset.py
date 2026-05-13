"""ResumeProjectSectionViewSet 테스트."""

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from resumes.factories import ResumeFactory, ResumeProjectFactory
from resumes.models import ResumeProject, ResumeProjectTechStack
from users.factories import UserFactory


class ResumeProjectSectionViewSetTests(TestCase):
  """프로젝트 섹션 CRUD + tech_stack canonical 처리."""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(RefreshToken.for_user(self.user).access_token)}")
    self.resume = ResumeFactory(user=self.user, is_dirty=False)
    self.list_url = reverse(
      "resume-sections:resume-section-projects",
      kwargs={"resume_uuid": self.resume.pk},
    )

  def _item_url(self, uuid):
    return reverse(
      "resume-sections:resume-section-project-item",
      kwargs={
        "resume_uuid": self.resume.pk,
        "uuid": uuid
      },
    )

  def test_get_list_returns_tech_stack_names(self):
    ResumeProjectFactory(resume=self.resume, name="Nova")
    response = self.client.get(self.list_url)
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(len(response.data), 1)
    # response.data 는 snake_case; 응답 본문은 CamelCaseJSONRenderer 가 techStack 으로 변환한다
    self.assertIn("tech_stack", response.data[0])
    self.assertIn("techStack", response.json()[0])

  def test_post_creates_project_with_tech_stack_junction(self):
    response = self.client.post(
      self.list_url,
      data={
        "name": "Nova",
        "role": "Lead",
        "period": "2023",
        "description": "플랫폼 리팩터",
        "tech_stack": ["Go", "Kafka"],
      },
      format="json",
    )
    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    uuid = response.json()["uuid"]
    self.assertEqual(
      ResumeProjectTechStack.objects.filter(resume_project__pk=uuid).count(),
      2,
    )

  def test_put_updates_project_and_replaces_tech_stack(self):
    project = ResumeProjectFactory(resume=self.resume, name="Old")
    response = self.client.put(
      self._item_url(project.pk),
      data={
        "name": "New",
        "tech_stack": ["Rust"]
      },
      format="json",
    )
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    project.refresh_from_db()
    self.assertEqual(project.name, "New")

  def test_delete_cascades_to_tech_stack(self):
    project = ResumeProjectFactory(resume=self.resume)
    response = self.client.delete(self._item_url(project.pk))
    self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
    self.assertFalse(ResumeProject.objects.filter(pk=project.pk).exists())

  def test_other_users_resume_returns_404(self):
    other = ResumeFactory(user=UserFactory(email_confirmed_at=timezone.now()))
    url = reverse(
      "resume-sections:resume-section-projects",
      kwargs={"resume_uuid": other.pk},
    )
    self.assertEqual(self.client.get(url).status_code, status.HTTP_404_NOT_FOUND)

  def test_unauthenticated_request_returns_401(self):
    response = APIClient().get(self.list_url)
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
