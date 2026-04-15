"""ResumeParsedDataReader 테스트."""

from django.test import TestCase
from resumes.factories import ResumeFactory
from resumes.services.resume_parsed_data_reader import ResumeParsedDataReader
from resumes.services.resume_parsed_data_writer import ResumeParsedDataWriter

_PARSED = {
  "basic_info": {
    "name": "홍길동",
    "email": "hong@example.com",
    "phone": "010-1111-2222",
    "location": "Seoul",
  },
  "summary": "백엔드 개발자",
  "skills": {
    "technical": ["Python", "Django"],
    "soft": ["커뮤니케이션"],
    "tools": ["Docker"],
    "languages": ["English"],
  },
  "experiences": [
    {
      "company": "ACME",
      "role": "Backend",
      "period": "2022-2024",
      "responsibilities": ["API 설계"],
      "highlights": ["QPS 3배"],
    },
  ],
  "educations": [
    {
      "school": "KMU",
      "degree": "학사",
      "major": "CS",
      "period": "2016-2020"
    },
  ],
  "certifications": [{
    "name": "AWS SAA",
    "issuer": "AWS",
    "date": "2023-05"
  }],
  "projects": [
    {
      "name": "Nova",
      "role": "Lead",
      "period": "2023",
      "description": "플랫폼 리팩터",
      "tech_stack": ["Go", "Kafka"],
    }
  ],
  "languages_spoken": [{
    "language": "English",
    "level": "Business"
  }],
  "total_experience_years": 5,
  "total_experience_months": 6,
  "industry_domains": ["핀테크", "이커머스"],
  "keywords": ["microservices"],
  "job_category": "IT/개발",
}


class ResumeParsedDataReaderTests(TestCase):
  """ResumeParsedDataReader 동작 검증."""

  def test_build_dict_reconstructs_parsed_data_from_normalized_tables(self):
    """writer 로 저장 후 reader 로 읽으면 원본 parsed_data 와 동등한 dict 가 만들어진다."""
    resume = ResumeFactory()
    ResumeParsedDataWriter(resume=resume, parsed_data=_PARSED).write()
    resume.refresh_from_db()

    result = ResumeParsedDataReader(resume).build_dict()

    self.assertEqual(result["basic_info"]["name"], "홍길동")
    self.assertEqual(result["summary"], "백엔드 개발자")
    self.assertEqual(result["total_experience_years"], 5)
    self.assertEqual(result["total_experience_months"], 6)
    self.assertEqual(result["job_category"], "IT/개발")
    # skills 는 lowercase 정규화 후 저장되므로 그 상태로 읽힌다
    self.assertIn("python", result["skills"]["technical"])
    self.assertIn("docker", result["skills"]["tools"])
    self.assertEqual(len(result["experiences"]), 1)
    self.assertEqual(result["experiences"][0]["responsibilities"], ["API 설계"])
    self.assertEqual(result["projects"][0]["tech_stack"], ["Go", "Kafka"])
    self.assertEqual(result["industry_domains"], ["핀테크", "이커머스"])
    self.assertEqual(result["keywords"], ["microservices"])

  def test_build_dict_returns_empty_when_no_normalized_rows(self):
    """정규화 테이블에 아무 것도 없으면 빈 dict 를 반환한다."""
    resume = ResumeFactory()
    result = ResumeParsedDataReader(resume).build_dict()
    self.assertEqual(result, {})

  def test_build_or_fallback_uses_jsonfield_when_not_normalized(self):
    """정규화 안 된 과거 데이터는 Resume.parsed_data JSONField 를 그대로 돌려준다."""
    resume = ResumeFactory(parsed_data={"legacy": "payload"})
    result = ResumeParsedDataReader(resume).build_or_fallback()
    self.assertEqual(result, {"legacy": "payload"})
