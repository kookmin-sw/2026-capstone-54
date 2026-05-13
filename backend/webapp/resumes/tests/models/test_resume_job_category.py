from django.test import TestCase
from resumes.models import ResumeJobCategory


class ResumeJobCategoryTests(TestCase):
  """ResumeJobCategory 모델 테스트."""

  def test_get_or_create_from_text_creates_when_missing(self):
    """존재하지 않는 이름이면 새로 생성한다."""
    category = ResumeJobCategory.get_or_create_from_text("IT/개발")
    self.assertIsNotNone(category)
    self.assertEqual(category.name, "IT/개발")
    self.assertEqual(ResumeJobCategory.objects.count(), 1)

  def test_get_or_create_from_text_reuses_existing(self):
    """이미 같은 이름이 있으면 새로 만들지 않고 기존 것을 반환한다."""
    existing = ResumeJobCategory.objects.create(name="마케팅")
    got = ResumeJobCategory.get_or_create_from_text("마케팅")
    self.assertEqual(got.pk, existing.pk)
    self.assertEqual(ResumeJobCategory.objects.count(), 1)

  def test_get_or_create_from_text_strips_whitespace(self):
    """입력 앞뒤 공백은 strip 되어 저장된다."""
    category = ResumeJobCategory.get_or_create_from_text("  디자인  ")
    self.assertEqual(category.name, "디자인")

  def test_get_or_create_from_text_returns_none_for_empty(self):
    """빈 문자열이거나 None 이면 None 을 반환한다."""
    self.assertIsNone(ResumeJobCategory.get_or_create_from_text(""))
    self.assertIsNone(ResumeJobCategory.get_or_create_from_text("   "))
    self.assertIsNone(ResumeJobCategory.get_or_create_from_text(None))  # type: ignore
