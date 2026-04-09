"""
DB 기반 이력서·채용공고 콘텐츠 조회 유틸리티.

resume_id(UUID), user_job_description_id(UUID)를 기반으로
SQLAlchemy 세션에서 직접 콘텐츠를 조회한다.
"""

from __future__ import annotations

import json
import logging

from db.models import (
    JobDescriptionTable,
    ResumeFileContentTable,
    ResumeTable,
    ResumeTextContentTable,
    UserJobDescriptionTable,
)

logger = logging.getLogger(__name__)


def get_resume_content(session, resume_id: str) -> str:
    """resume_id(UUID)로 이력서 텍스트 내용을 조회한다.

    - file 타입: resume_file_contents.content (파싱된 텍스트)
    - text 타입: resume_text_contents.content (사용자 직접 입력 텍스트)
    """
    if not resume_id:
        return ""

    resume = (
        session.query(ResumeTable)
        .filter(ResumeTable.uuid == resume_id, ResumeTable.deleted_at.is_(None))
        .first()
    )
    if not resume:
        logger.warning("이력서를 찾을 수 없습니다: resume_id=%s", resume_id)
        return ""

    if resume.type == "file":
        row = (
            session.query(ResumeFileContentTable)
            .filter(
                ResumeFileContentTable.resume_id == resume_id,
                ResumeFileContentTable.deleted_at.is_(None),
            )
            .first()
        )
        return (row.content or "") if row else ""

    if resume.type == "text":
        row = (
            session.query(ResumeTextContentTable)
            .filter(
                ResumeTextContentTable.resume_id == resume_id,
                ResumeTextContentTable.deleted_at.is_(None),
            )
            .first()
        )
        return (row.content or "") if row else ""

    logger.warning("알 수 없는 이력서 타입: %s (resume_id=%s)", resume.type, resume_id)
    return ""


def get_job_description_content(session, user_job_description_id: str) -> str:
    """user_job_description_id(UUID)로 채용공고 내용을 JSON 문자열로 반환한다."""
    if not user_job_description_id:
        return ""

    ujd = (
        session.query(UserJobDescriptionTable)
        .filter(UserJobDescriptionTable.uuid == user_job_description_id)
        .first()
    )
    if not ujd:
        logger.warning(
            "UserJobDescription을 찾을 수 없습니다: id=%s", user_job_description_id
        )
        return ""

    jd = (
        session.query(JobDescriptionTable)
        .filter(JobDescriptionTable.id == ujd.job_description_id)
        .first()
    )
    if not jd:
        logger.warning(
            "JobDescription을 찾을 수 없습니다: id=%d", ujd.job_description_id
        )
        return ""

    data = {
        "company": jd.company or "",
        "title": jd.title or "",
        "platform": jd.platform or "",
        "duties": jd.duties or "",
        "requirements": jd.requirements or "",
        "preferred": jd.preferred or "",
        "work_type": jd.work_type or "",
        "salary": jd.salary or "",
        "location": jd.location or "",
        "education": jd.education or "",
        "experience": jd.experience or "",
    }
    return json.dumps(data, ensure_ascii=False, indent=2)
