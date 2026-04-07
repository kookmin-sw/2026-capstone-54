"""
리포트 생성 오케스트레이션 서비스.

SQLAlchemy로 면접 데이터를 조회하고, 문서를 로드한 뒤
LLMAnalyzer를 호출하여 분석 결과를 DB에 저장한다.
"""

from __future__ import annotations

import logging
from datetime import datetime

from db.connection import get_session
from db.models import (
    AnalysisReportTable,
    InterviewExchangeTable,
    InterviewSessionTable,
)
from services.llm_analyzer import AnalysisContext, ExchangeData, LLMAnalyzer
from utils.document_loader import load_document

logger = logging.getLogger(__name__)


class ReportGeneratorService:
    """면접 분석 리포트 생성 서비스."""

    def __init__(self) -> None:
        self._analyzer = LLMAnalyzer()

    def generate(self, report_id: int) -> None:
        """리포트를 생성하고 DB에 저장한다.

        Args:
            report_id: AnalysisReport 레코드의 PK.
        """
        try:
            self._do_generate(report_id)
        except Exception as e:
            logger.exception("리포트 생성 실패 (report_id=%d): %s", report_id, e)
            self._mark_failed(report_id, str(e))

    def _do_generate(self, report_id: int) -> None:
        """실제 생성 로직. 예외는 호출자가 처리한다."""
        with get_session() as session:
            # 1) AnalysisReport 조회 → session_id 획득
            report = (
                session.query(AnalysisReportTable)
                .filter(AnalysisReportTable.id == report_id)
                .one()
            )
            session_id = report.session_id

            # 2) InterviewSession 조회
            interview = (
                session.query(InterviewSessionTable)
                .filter(InterviewSessionTable.id == session_id)
                .one()
            )

            # 3) InterviewExchange 목록 조회
            exchanges = (
                session.query(InterviewExchangeTable)
                .filter(InterviewExchangeTable.session_id == session_id)
                .order_by(InterviewExchangeTable.id)
                .all()
            )

            # 4) 이력서 / 채용공고 파일 로드
            resume_content = load_document(interview.resume_file or "")
            job_posting_content = load_document(interview.job_posting_file or "")

            # 5) AnalysisContext 구성
            exchange_data_list = [
                ExchangeData(
                    exchange_id=ex.id,
                    question=ex.question or "",
                    answer=ex.answer or "",
                    exchange_type=ex.exchange_type or "",
                    question_source=ex.question_source or "",
                    question_purpose=ex.question_purpose or "",
                )
                for ex in exchanges
            ]

            context = AnalysisContext(
                session_id=session_id,
                started_at=str(interview.started_at or ""),
                duration_seconds=interview.duration_seconds or 0,
                difficulty_level=interview.difficulty_level or "",
                resume_file=interview.resume_file or "",
                job_posting_file=interview.job_posting_file or "",
                total_initial_questions=interview.total_initial_questions or 0,
                total_followup_questions=interview.total_followup_questions or 0,
                avg_answer_length=interview.avg_answer_length or 0,
                exchanges=exchange_data_list,
                resume_content=resume_content,
                job_posting_content=job_posting_content,
            )

            # 6) LLM 분석 실행
            result = self._analyzer.analyze(context)

            # 7) 결과를 AnalysisReport에 저장
            report.status = "completed"
            report.overall_score = result.overall_score
            report.overall_grade = result.overall_grade
            report.overall_comment = result.overall_comment
            report.category_scores = result.category_scores
            report.question_feedbacks = result.question_feedbacks
            report.strengths = result.strengths
            report.improvement_areas = result.improvement_areas
            report.input_tokens = result.input_tokens
            report.output_tokens = result.output_tokens
            report.total_tokens = result.total_tokens
            report.total_cost_usd = result.total_cost_usd
            report.updated_at = datetime.utcnow()

    def _mark_failed(self, report_id: int, error_message: str) -> None:
        """리포트 상태를 failed로 업데이트한다."""
        try:
            with get_session() as session:
                report = (
                    session.query(AnalysisReportTable)
                    .filter(AnalysisReportTable.id == report_id)
                    .one()
                )
                report.status = "failed"
                report.error_message = error_message
                report.updated_at = datetime.utcnow()
        except Exception:
            logger.exception(
                "리포트 실패 상태 업데이트 중 추가 에러 (report_id=%d)", report_id
            )
