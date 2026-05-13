"""Celery 태스크: 면접 분석 리포트 생성."""

from __future__ import annotations

import logging

from celery_app import app
from services.report_generator import ReportGeneratorService

logger = logging.getLogger(__name__)


@app.task(name="analysis.tasks.generate_report.generate_analysis_report")
def generate_analysis_report(report_id: int, bundle_url: str = "") -> None:
    """면접 분석 리포트를 생성한다.

    Args:
        report_id: AnalysisReport 레코드의 PK.
        bundle_url: backend 가 업로드한 이력서 정규화 bundle JSON 의 URL.
    """
    logger.info(
        "리포트 생성 태스크 시작 (report_id=%d, bundle_url=%s)", report_id, bundle_url
    )
    try:
        service = ReportGeneratorService()
        service.generate(report_id, bundle_url=bundle_url)
        logger.info("리포트 생성 태스크 완료 (report_id=%d)", report_id)
    except Exception:
        logger.exception("리포트 생성 태스크 실패 (report_id=%d)", report_id)
        raise
