"""면접 컨텍스트 조회 서비스.

이력서 내용과 채용공고 정보를 DB에서 조회하여 LLM에 주입할 형태로 반환한다.
사용자 입력을 신뢰하지 않고, 항상 DB 레코드에서 직접 조회한다.
"""

from __future__ import annotations

import json

from resumes.models import Resume


def _safe_str(value) -> str:
  """None 또는 빈 값을 빈 문자열로 정규화한다."""
  if value is None:
    return ""
  return str(value).strip()


def get_resume_content(resume: Resume) -> str:
  """이력서 타입에 따라 전문 텍스트를 반환한다.

    - file 타입: ResumeFileContent.content (파싱된 텍스트)
    - text 타입: ResumeTextContent.content (사용자 직접 입력 텍스트)
    """
  if resume.type == "file":
    try:
      return _safe_str(resume.file_content.content)
    except AttributeError:
      return ""

  if resume.type == "text":
    try:
      return _safe_str(resume.text_content.content)
    except AttributeError:
      return ""

  return ""


def get_job_description_content(user_job_description) -> str:
  """UserJobDescription에 연결된 JobDescription의 모든 필드를 JSON 문자열로 반환한다.

    각 필드는 None 또는 빈 값이어도 안전하게 처리된다.
    """
  jd = user_job_description.job_description
  data = {
    "company": _safe_str(getattr(jd, "company", None)),
    "title": _safe_str(getattr(jd, "title", None)),
    "platform": _safe_str(getattr(jd, "platform", None)),
    "duties": _safe_str(getattr(jd, "duties", None)),
    "requirements": _safe_str(getattr(jd, "requirements", None)),
    "preferred": _safe_str(getattr(jd, "preferred", None)),
    "work_type": _safe_str(getattr(jd, "work_type", None)),
    "salary": _safe_str(getattr(jd, "salary", None)),
    "location": _safe_str(getattr(jd, "location", None)),
    "education": _safe_str(getattr(jd, "education", None)),
    "experience": _safe_str(getattr(jd, "experience", None)),
  }
  return json.dumps(data, ensure_ascii=False, indent=2)
