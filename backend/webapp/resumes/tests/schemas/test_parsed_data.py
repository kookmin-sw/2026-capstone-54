from django.test import TestCase
from resumes.schemas.parsed_data import ParsedResumeData


class ParsedResumeDataTests(TestCase):
  """ParsedResumeData Pydantic 스키마 테스트."""

  def test_from_raw_with_empty_dict_returns_defaults(self):
    """빈 dict 를 받아도 기본 필드들로 정상 생성된다."""
    data = ParsedResumeData.from_raw({})
    self.assertEqual(data.summary, "")
    self.assertEqual(data.skills.technical, [])
    self.assertEqual(data.experiences, [])

  def test_from_raw_with_none_returns_default_instance(self):
    """None 이면 기본값 인스턴스가 반환된다."""
    data = ParsedResumeData.from_raw(None)
    self.assertIsNone(data.total_experience_years)
    self.assertIsNone(data.job_category)

  def test_from_raw_parses_normalized_schema(self):
    """정규화된 스키마(dict skills 포함)를 파싱한다."""
    raw = {
      "summary": "백엔드 개발자",
      "skills": {
        "technical": ["Python", "Django"],
        "tools": ["Docker"],
        "soft": [],
        "languages": [],
      },
      "total_experience_years": 5,
      "total_experience_months": 6,
      "job_category": "IT/개발",
    }
    data = ParsedResumeData.from_raw(raw)
    self.assertEqual(data.summary, "백엔드 개발자")
    self.assertEqual(data.skills.technical, ["Python", "Django"])
    self.assertEqual(data.skills.tools, ["Docker"])
    self.assertEqual(data.total_experience_years, 5)
    self.assertEqual(data.total_experience_months, 6)
    self.assertEqual(data.job_category, "IT/개발")

  def test_from_raw_converts_legacy_list_skills_to_technical(self):
    """skills 가 list 형태여도 technical 그룹으로 흡수된다 (구형 포맷 호환)."""
    raw = {"skills": ["Python", "React"]}
    data = ParsedResumeData.from_raw(raw)
    self.assertEqual(data.skills.technical, ["Python", "React"])
