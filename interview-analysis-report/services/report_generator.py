"""
리포트 생성 오케스트레이션 서비스.

SQLAlchemy로 면접 데이터를 조회하고, DB에서 이력서·채용공고 콘텐츠를 로드한 뒤
LLMAnalyzer를 호출하여 분석 결과를 DB에 저장한다.
토큰 사용량은 AnalysisReport에 직접 기록하지 않고 TokenUsage 테이블에 별도 저장한다.
"""

from __future__ import annotations

import logging
from datetime import datetime

from config import OPENAI_MODEL
from db.connection import get_session
from db.models import (
    AnalysisReportTable,
    DjangoContentTypeTable,
    InterviewBehaviorAnalysisTable,
    InterviewSessionTable,
    InterviewTurnTable,
    TokenUsageTable,
)
from services.llm_analyzer import AnalysisContext, ExchangeData, LLMAnalyzer
from services.voice_analysis_invoker import VoiceAnalysisInvoker
from services.video_analysis_aggregator import VideoAnalysisAggregator
from sqlalchemy import case, Integer
from utils.content_loader import get_job_description_content, get_resume_content

logger = logging.getLogger(__name__)


class ReportGeneratorService:
    """면접 분석 리포트 생성 서비스."""

    def __init__(self) -> None:
        self._analyzer = LLMAnalyzer()
        self._voice_invoker = VoiceAnalysisInvoker()
        self._video_aggregator = VideoAnalysisAggregator()

    def generate(self, report_id: int, bundle_url: str = "") -> None:
        try:
            self._do_generate(report_id, bundle_url=bundle_url)
        except Exception as e:
            logger.exception("리포트 생성 실패 (report_id=%d): %s", report_id, e)
            self._mark_failed(report_id, str(e))

    def _do_generate(self, report_id: int, bundle_url: str = "") -> None:
        with get_session() as session:
            report = (
                session.query(AnalysisReportTable)
                .filter(AnalysisReportTable.id == report_id)
                .one()
            )
            session_id = report.interview_session_id

            interview = (
                session.query(InterviewSessionTable)
                .filter(InterviewSessionTable.uuid == session_id)
                .one()
            )

            turns = (
                session.query(InterviewTurnTable)
                .filter(InterviewTurnTable.interview_session_id == session_id)
                .order_by(
                    InterviewTurnTable.turn_number,
                    case(
                        (InterviewTurnTable.followup_order.is_(None), 0),
                        else_=InterviewTurnTable.followup_order,
                    ).cast(Integer),
                )
                .all()
            )

            resume_content = get_resume_content(bundle_url)
            job_posting_content = get_job_description_content(
                session, interview.user_job_description_id or ""
            )

            self._ensure_behavior_analyses(str(session_id), turns, interview.user_id)

            # 6) 음성 분석 (병렬 Lambda 호출)
            voice_results = {}
            try:
                voice_results = self._voice_invoker.analyze_all_turns(str(session_id))
                logger.info("음성 분석 완료: %d턴", len(voice_results))
            except Exception:
                logger.exception("음성 분석 실패 — LLM 분석은 음성 데이터 없이 진행")

            # 6) AnalysisContext 구성
            exchange_data_list = [
                ExchangeData(
                    turn_id=turn.id,
                    question=turn.question or "",
                    answer=turn.answer or "",
                    turn_type=turn.turn_type or "",
                    question_source=turn.question_source or "",
                    voice_summary=voice_results.get(turn.id, {}).get("summary"),
                )
                for turn in turns
            ]

            context = AnalysisContext(
                session_id=session_id,
                difficulty_level=interview.interview_difficulty_level or "",
                total_questions=interview.total_questions or 0,
                total_followup_questions=interview.total_followup_questions or 0,
                exchanges=exchange_data_list,
                resume_content=resume_content,
                job_posting_content=job_posting_content,
            )

            # 7) LLM 분석 실행
            result = self._analyzer.analyze(context)

            # 8) 영상 분석 집계 (face_analysis_result → video_score + 면접태도)
            video_score = 0
            try:
                video_result = self._video_aggregator.aggregate(str(session_id))
                if video_result.video_score > 0:
                    video_score = video_result.video_score
                    # category_scores에 "면접태도" append
                    result.category_scores.append({
                        "category": "면접태도",
                        "score": video_result.video_score,
                        "comment": video_result.video_analysis_comment,
                    })
                    logger.info("영상 분석 집계 완료: video_score=%d", video_score)
            except Exception:
                logger.exception("영상 분석 집계 실패 — 면접태도 카테고리 없이 진행")

            # 9) content_score 산출 (LLM 4개 카테고리 평균)
            llm_category_scores = [
                cat["score"] for cat in result.category_scores
                if cat["category"] != "면접태도"
            ]
            content_score = (
                round(sum(llm_category_scores) / len(llm_category_scores))
                if llm_category_scores else 0
            )

            # 10) overall_score 재산출: content 50% + audio 25% + video 25%
            # audio_score는 현재 음성 워커에서 별도 산출하지 않으므로 0으로 처리
            # TODO: 음성 워커 완성 후 audio_score 연동
            audio_score = 0
            overall_score = round(
                content_score * 0.50
                + audio_score * 0.25
                + video_score * 0.25
            )
            overall_score = max(0, min(100, overall_score))

            # 등급 재산출
            overall_grade = self._analyzer.score_to_grade(overall_score)

            # 11) 결과를 AnalysisReport에 저장
            report.interview_analysis_report_status = "completed"
            report.overall_score = overall_score
            report.overall_grade = overall_grade
            report.overall_comment = result.overall_comment
            report.category_scores = result.category_scores
            report.question_feedbacks = result.question_feedbacks
            report.strengths = result.strengths
            report.improvement_areas = result.improvement_areas
            report.updated_at = datetime.utcnow()

            # 12) TokenUsage 별도 저장 (GenericForeignKey: InterviewAnalysisReport)
            content_type = (
                session.query(DjangoContentTypeTable)
                .filter_by(app_label="interviews", model="interviewanalysisreport")
                .one()
            )
            token_usage = TokenUsageTable(
                token_usable_type_id=content_type.id,
                token_usable_id=str(report.id),
                operation="completion",
                context="interview_analysis",
                model_name=OPENAI_MODEL,
                input_tokens=result.input_tokens,
                output_tokens=result.output_tokens,
                total_tokens=result.total_tokens,
                cost_usd=result.total_cost_usd,
            )
            session.add(token_usage)

    @staticmethod
    def _ensure_behavior_analyses(session_id: str, turns, user_id: int) -> None:
        import uuid as uuid_mod

        now = datetime.utcnow()
        with get_session() as db:
            existing = set(
                r[0]
                for r in db.query(InterviewBehaviorAnalysisTable.interview_turn_id)
                .filter(
                    InterviewBehaviorAnalysisTable.interview_session_id == session_id
                )
                .all()
            )

            for turn in turns:
                if turn.id not in existing:
                    db.add(
                        InterviewBehaviorAnalysisTable(
                            uuid=str(uuid_mod.uuid4()),
                            created_at=now,
                            updated_at=now,
                            interview_session_id=session_id,
                            interview_turn_id=turn.id,
                            user_id=user_id,
                            status="pending",
                        )
                    )

    def _mark_failed(self, report_id: int, error_message: str) -> None:
        """리포트 상태를 failed로 업데이트한다."""
        try:
            with get_session() as session:
                report = (
                    session.query(AnalysisReportTable)
                    .filter(AnalysisReportTable.id == report_id)
                    .one()
                )
                report.interview_analysis_report_status = "failed"
                report.error_message = error_message
                report.updated_at = datetime.utcnow()
        except Exception:
            logger.exception(
                "리포트 실패 상태 업데이트 중 추가 에러 (report_id=%d)", report_id
            )
