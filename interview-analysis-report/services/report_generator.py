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

            # 음성 분석 (병렬 Lambda 호출)
            voice_results = {}
            try:
                voice_results = self._voice_invoker.analyze_all_turns(str(session_id))
                logger.info("음성 분석 완료: %d턴", len(voice_results))
            except Exception:
                logger.exception("음성 분석 실패 — LLM 분석은 음성 데이터 없이 진행")

            # AnalysisContext 구성
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

            # LLM 분석 실행
            result = self._analyzer.analyze(context)

            # 영상 분석 집계 (face_analysis_result + gaze_away_count)
            video_score = 0
            video_result = None
            try:
                video_result = self._video_aggregator.aggregate(str(session_id))
                if video_result.video_score > 0:
                    video_score = video_result.video_score
                    result.category_scores.append({
                        "category": "면접태도",
                        "score": video_result.video_score,
                        "comment": video_result.video_analysis_comment,
                    })
                    logger.info("영상 분석 집계 완료: video_score=%d", video_score)
            except Exception:
                logger.exception("영상 분석 집계 실패 — 면접태도 카테고리 없이 진행")

            # 음성 분석 집계 → audio_analysis_result + audio_score
            audio_score, audio_analysis_result, audio_analysis_comment = (
                self._aggregate_audio_analysis(turns, voice_results)
            )

            # content_score 산출 (LLM 4개 카테고리 평균)
            llm_category_scores = [
                cat["score"] for cat in result.category_scores
                if cat["category"] != "면접태도"
            ]
            content_score = (
                round(sum(llm_category_scores) / len(llm_category_scores))
                if llm_category_scores else 0
            )

            # overall_score: content 50% + audio 25% + video 25%
            overall_score = round(
                content_score * 0.7
                + audio_score * 0.15
                + video_score * 0.15
            )
            overall_score = max(0, min(100, overall_score))
            overall_grade = self._analyzer.score_to_grade(overall_score)

            # question_feedbacks에 턴별 음성/영상 지표 병합
            self._enrich_question_feedbacks(
                result.question_feedbacks, turns, voice_results, video_result
            )

            # 결과를 AnalysisReport에 저장
            report.interview_analysis_report_status = "completed"
            report.overall_score = overall_score
            report.overall_grade = overall_grade
            report.overall_comment = result.overall_comment
            report.category_scores = result.category_scores
            report.question_feedbacks = result.question_feedbacks
            report.strengths = result.strengths
            report.improvement_areas = result.improvement_areas
            report.content_score = content_score
            report.video_score = video_score
            report.audio_score = audio_score
            report.video_analysis_result = (
                video_result.summary if video_result and video_result.video_score > 0 else {}
            )
            report.video_analysis_comment = (
                video_result.video_analysis_comment
                if video_result and video_result.video_score > 0 else ""
            )
            report.audio_analysis_result = audio_analysis_result
            report.audio_analysis_comment = audio_analysis_comment
            report.updated_at = datetime.utcnow()

            # TokenUsage 별도 저장
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

    def _aggregate_audio_analysis(
        self, turns, voice_results: dict[int, dict]
    ) -> tuple[int, dict, str]:
        """턴별 음성 데이터를 기획의 audio_analysis_result 구조로 집계한다.

        Returns:
            (audio_score, audio_analysis_result, audio_analysis_comment)
        """
        per_turn: list[dict] = []
        total_speech_rate_spm = 0.0
        total_filler_count = 0
        total_syllables = 0
        total_filler_syllables = 0
        total_silence_ratio = 0.0
        total_volume_dbfs = 0.0
        valid_turn_count = 0
        all_filler_detail: dict[str, int] = {}

        for turn in turns:
            turn_id = turn.id
            voice_data = voice_results.get(turn_id, {})
            summary = voice_data.get("summary", {})

            # speech_rate: InterviewTurn.speech_rate_sps (음절/초) → SPM (음절/분)
            sps = float(turn.speech_rate_sps) if turn.speech_rate_sps else 0.0
            spm = round(sps * 60)

            # 필러워드: InterviewTurn.pillar_word_counts
            filler_detail = turn.pillar_word_counts or {}
            filler_count = sum(filler_detail.values()) if filler_detail else 0

            # 발화 시간으로 총 음절 수 추정 (SPM 기반)
            speech_duration_ms = summary.get("speechDurationMs", 0)
            estimated_syllables = (
                round(sps * (speech_duration_ms / 1000)) if sps > 0 else 0
            )

            # 필러워드 비율
            filler_ratio = (
                filler_count / estimated_syllables
                if estimated_syllables > 0 else 0.0
            )

            # 묵음 비율
            silence_ratio = summary.get("silenceRatio", 0.0)

            # 평균 음량
            avg_volume = summary.get("avgDbfsSpeech")

            turn_entry = {
                "turn_number": turn.turn_number or 0,
                "speech_rate_spm": spm,
                "filler_word_count": filler_count,
                "filler_word_ratio": round(filler_ratio, 4),
                "filler_word_detail": filler_detail,
                "silence_ratio": round(silence_ratio, 4),
                "avg_volume_dbfs": (
                    round(avg_volume, 2) if avg_volume is not None else None
                ),
            }
            per_turn.append(turn_entry)

            # 집계용 누적
            if spm > 0 or silence_ratio > 0 or avg_volume is not None:
                valid_turn_count += 1
                total_speech_rate_spm += spm
                total_filler_count += filler_count
                total_syllables += estimated_syllables
                total_filler_syllables += filler_count
                total_silence_ratio += silence_ratio
                total_volume_dbfs += avg_volume if avg_volume is not None else 0.0

                for word, cnt in filler_detail.items():
                    all_filler_detail[word] = all_filler_detail.get(word, 0) + cnt

        # summary 산출
        if valid_turn_count > 0:
            avg_spm = round(total_speech_rate_spm / valid_turn_count)
            total_filler_ratio = (
                total_filler_syllables / total_syllables
                if total_syllables > 0 else 0.0
            )
            avg_silence = total_silence_ratio / valid_turn_count
            avg_volume = total_volume_dbfs / valid_turn_count
        else:
            avg_spm = 0
            total_filler_ratio = 0.0
            avg_silence = 0.0
            avg_volume = 0.0

        audio_summary = {
            "avg_speech_rate_spm": avg_spm,
            "total_filler_word_count": total_filler_count,
            "total_filler_word_ratio": round(total_filler_ratio, 4),
            "total_filler_word_detail": all_filler_detail,
            "avg_silence_ratio": round(avg_silence, 4),
            "avg_volume_dbfs": round(avg_volume, 2),
        }

        audio_analysis_result = {"per_turn": per_turn, "summary": audio_summary}

        # audio_score 산출 (기획 공식)
        audio_score = self._calculate_audio_score(
            avg_spm, total_filler_ratio, avg_silence, avg_volume
        )

        # audio_analysis_comment (rule-based)
        audio_comment = self._generate_audio_comment(
            avg_spm, total_filler_ratio, avg_silence, all_filler_detail
        )

        return audio_score, audio_analysis_result, audio_comment

    @staticmethod
    def _calculate_audio_score(
        avg_spm: int, filler_ratio: float, silence_ratio: float, avg_volume: float
    ) -> int:
        """기획의 audio_score 감점 공식."""
        score = 100.0

        # 발화속도 감점 (정상 260-350, 최대 -15)
        if avg_spm > 0:
            if avg_spm < 260:
                penalty = min((260 - avg_spm) * 0.15, 15)
                score -= penalty
            elif avg_spm > 350:
                penalty = min((avg_spm - 350) * 0.15, 15)
                score -= penalty

        # 필러워드 감점 (정상 < 5%, 최대 -20)
        if filler_ratio > 0.05:
            penalty = min((filler_ratio - 0.05) * 200, 20)
            score -= penalty

        # 묵음 비율 감점 (정상 < 20%, 최대 -15)
        if silence_ratio > 0.20:
            penalty = min((silence_ratio - 0.20) * 150, 15)
            score -= penalty

        # 음량 감점 (정상 -30 ~ -10, 최대 -10)
        if avg_volume != 0.0:
            if avg_volume < -30:
                penalty = min((-30 - avg_volume) * 0.5, 10)
                score -= penalty
            elif avg_volume > -10:
                penalty = min((avg_volume - (-10)) * 0.5, 10)
                score -= penalty

        return max(0, min(100, round(score)))

    @staticmethod
    def _generate_audio_comment(
        avg_spm: int, filler_ratio: float, silence_ratio: float,
        filler_detail: dict[str, int]
    ) -> str:
        """rule-based 음성 분석 코멘트 (기획 REQ-2-6)."""
        parts = []

        # 발화속도
        if avg_spm > 0:
            if avg_spm < 260:
                parts.append(f"발화 속도가 분당 {avg_spm} 음절로 다소 느립니다.")
            elif avg_spm > 350:
                parts.append(f"발화 속도가 분당 {avg_spm} 음절로 다소 빠릅니다.")
            else:
                parts.append(f"발화 속도가 분당 {avg_spm} 음절로 적절합니다.")

        # 필러워드
        if filler_detail:
            top_fillers = sorted(filler_detail.items(), key=lambda x: -x[1])[:2]
            top_words = ", ".join(f"'{w}'" for w, _ in top_fillers)
            pct = filler_ratio * 100
            if filler_ratio >= 0.05:
                parts.append(
                    f"필러워드 ({top_words})가 전체의 {pct:.1f}%로 높습니다."
                )
            else:
                parts.append("필러워드 사용이 적절한 수준입니다.")
        else:
            parts.append("필러워드 사용이 적절한 수준입니다.")

        # 묵음
        if silence_ratio > 0.30:
            parts.append("묵음 구간이 다소 길어 답변 준비 시간을 줄이면 좋겠습니다.")
        elif silence_ratio > 0.20:
            parts.append("묵음 구간이 약간 많지만 전달에는 지장이 없는 수준입니다.")
        else:
            parts.append("묵음 구간은 적절한 수준입니다.")

        return " ".join(parts)

    @staticmethod
    def _enrich_question_feedbacks(
        feedbacks: list[dict],
        turns,
        voice_results: dict[int, dict],
        video_result,
    ) -> None:
        """question_feedbacks에 턴별 음성/영상 지표를 병합한다 (REQ-7-3)."""
        # video per_turn을 turn_id로 인덱싱
        video_per_turn_map: dict[int, dict] = {}
        if video_result and video_result.per_turn:
            for vt in video_result.per_turn:
                video_per_turn_map[vt["turn_id"]] = vt

        # turns를 turn_id로 인덱싱
        turn_map = {t.id: t for t in turns}

        for fb in feedbacks:
            turn_id = fb.get("turn_id")
            if not turn_id:
                continue

            turn = turn_map.get(turn_id)
            if not turn:
                continue

            # 메타 정보 추가
            fb["turn_type"] = turn.turn_type or ""
            fb["question_source"] = turn.question_source or ""
            fb["answer"] = turn.answer or ""

            # 음성 지표
            voice_data = voice_results.get(turn_id, {})
            summary = voice_data.get("summary", {})

            sps = float(turn.speech_rate_sps) if turn.speech_rate_sps else 0.0
            spm = round(sps * 60)
            filler_detail = turn.pillar_word_counts or {}
            filler_count = sum(filler_detail.values()) if filler_detail else 0
            speech_duration_ms = summary.get("speechDurationMs", 0)
            estimated_syllables = (
                round(sps * (speech_duration_ms / 1000)) if sps > 0 else 0
            )
            filler_ratio = (
                filler_count / estimated_syllables if estimated_syllables > 0 else 0.0
            )
            silence_ratio = summary.get("silenceRatio", 0.0)

            fb["speech_rate_spm"] = spm
            fb["filler_word_count"] = filler_count
            fb["filler_word_ratio"] = round(filler_ratio, 4)
            fb["filler_word_detail"] = filler_detail
            fb["silence_ratio"] = round(silence_ratio, 4)

            # 영상 지표 (시선 이탈)
            video_turn = video_per_turn_map.get(turn_id, {})
            fb["gaze_deviation_count"] = video_turn.get("gaze_deviation_count", 0)
            fb["gaze_deviation_ratio"] = video_turn.get("gaze_deviation_ratio", 0.0)

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
