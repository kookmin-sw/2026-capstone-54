"""
문서 파일 로딩 유틸리티.

InterviewSession에 연결된 이력서(resume_file)와 채용공고(job_posting_file)의
원본 마크다운 내용을 로드한다. FILE_STORAGE_TYPE에 따라 로컬 파일 시스템 또는
향후 S3 등 오브젝트 스토리지를 지원한다.
"""

import logging
import os

from config import FILE_STORAGE_TYPE, MEDIA_ROOT

logger = logging.getLogger(__name__)


def load_document(relative_path: str) -> str:
    """파일 경로로부터 문서 내용을 로드한다.

    Args:
        relative_path: MEDIA_ROOT 기준 상대 경로 (e.g. "resumes/resume.md")

    Returns:
        파일 내용 문자열. 파일이 없거나 읽기 실패 시 빈 문자열.
    """
    if not relative_path:
        return ""

    if FILE_STORAGE_TYPE == "local":
        return _load_local(relative_path)

    logger.warning("지원하지 않는 FILE_STORAGE_TYPE: %s", FILE_STORAGE_TYPE)
    return ""


def _load_local(relative_path: str) -> str:
    """로컬 파일 시스템에서 문서를 읽는다."""
    full_path = os.path.join(MEDIA_ROOT, relative_path)
    try:
        with open(full_path, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        logger.warning("파일을 찾을 수 없습니다: %s", full_path)
        return ""
    except OSError as e:
        logger.error("파일 읽기 실패 (%s): %s", full_path, e)
        return ""
