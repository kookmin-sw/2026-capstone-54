"""
영상 분석 결과 집계 서비스.

각 턴의 face_analysis_result(표정)과 InterviewTurn의 gaze_away_count(시선 이탈)를
읽어 기획 문서의 video_analysis_result 구조로 변환한다.

video_score 산출:
  gaze_score  = (1 - avg_gaze_deviation_ratio) × 100
  face_score  = (neutral_ratio + positive_ratio) × 100
  video_score = round(gaze_score × 0.6 + face_score × 0.4)
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field

from db.connection import get_session
from db.models import InterviewRecordingTable, InterviewTurnTable

logger = logging.getLogger(__name__)

# 시선 이탈 비율 산출 시 기준 프레임 수 (1fps 기준, duration_ms로 계산)
_MS_PER_FRAME = 1000


@dataclass
class VideoAnalysisResult:
    """영상 분석 집계 결과."""

    video_score: int = 0
    video_analysis_comment: str = ""
    per_turn: list[dict] = field(default_factory=list)
    summary: dict = field(default_factory=dict)


class VideoAnalysisAggregator:
    """face_analysis_result + gaze_away_count를 집계하여 video_score를 산출한다."""

    def aggregate(self, session_id: str) -> VideoAnalysisResult:
        """세션의 모든 턴 영상 분석 데이터를 읽어 집계한다."""
        recordings = self._load_recordings(session_id)
        turn_gaze_map = self._load_gaze_data(session_id)

        if not recordings and not turn_gaze_map:
            logger.warning("영상 분석 데이터 없음: session_id=%s", session_id)
            return VideoAnalysisResult()

        per_turn: list[dict] = []
        total_positive = 0.0
        total_neutral = 0.0
        total_negative = 0.0
        total_valid_frames = 0
        total_gaze_deviation_count = 0
        total_estimated_frames = 0

        rec_by_turn: dict[int, object] = {
            rec.interview_turn_id: rec for rec in recordings
        }
        all_turn_ids = set(rec_by_turn.keys()) | set(turn_gaze_map.keys())

        for turn_id in sorted(all_turn_ids):
            turn_data: dict = {"turn_id": turn_id}

            # 시선 이탈 데이터
            gaze_info = turn_gaze_map.get(turn_id, {})
            gaze_count = gaze_info.get("gaze_away_count", 0)
            duration_ms = gaze_info.get("duration_ms", 0)

            estimated_frames = max(duration_ms // _MS_PER_FRAME, 1) if duration_ms > 0 else 0

            if estimated_frames > 0:
                gaze_ratio = min(gaze_count / estimated_frames, 1.0)
            else:
                gaze_ratio = 0.0

            turn_data["gaze_deviation_ratio"] = round(gaze_ratio, 4)
            turn_data["gaze_deviation_count"] = gaze_count

            total_gaze_deviation_count += gaze_count
            total_estimated_frames += estimated_frames

            # 표정 분포 데이터
            rec = rec_by_turn.get(turn_id)
            if rec:
                face_result = rec.face_analysis_result or {}
                statistics = face_result.get("statistics", {})
                expr_dist = statistics.get("expression_distribution", {})
                frames_count = statistics.get("total_frames", 0)

                if frames_count > 0:
                    positive_raw = expr_dist.get("positive", 0.0)
                    neutral_raw = expr_dist.get("neutral", 0.0)
                    negative_raw = expr_dist.get("negative", 0.0)

                    valid_ratio = positive_raw + neutral_raw + negative_raw
                    if valid_ratio > 0:
                        positive_ratio = positive_raw / valid_ratio
                        neutral_ratio = neutral_raw / valid_ratio
                        negative_ratio = negative_raw / valid_ratio
                        valid_frames = int(frames_count * valid_ratio)

                        turn_data["expression_distribution"] = {
                            "happy": round(positive_ratio, 4),
                            "neutral": round(neutral_ratio, 4),
                            "negative": round(negative_ratio, 4),
                        }

                        total_positive += positive_ratio * valid_frames
                        total_neutral += neutral_ratio * valid_frames
                        total_negative += negative_ratio * valid_frames
                        total_valid_frames += valid_frames

            if "expression_distribution" not in turn_data:
                turn_data["expression_distribution"] = {
                    "happy": 0.0, "neutral": 0.0, "negative": 0.0,
                }

            per_turn.append(turn_data)

        # 전체 집계
        avg_gaze_deviation_ratio = (
            total_gaze_deviation_count / total_estimated_frames
            if total_estimated_frames > 0 else 0.0
        )
        avg_gaze_deviation_ratio = min(avg_gaze_deviation_ratio, 1.0)

        if total_valid_frames > 0:
            avg_positive = total_positive / total_valid_frames
            avg_neutral = total_neutral / total_valid_frames
            avg_negative = total_negative / total_valid_frames
        else:
            avg_positive = 0.0
            avg_neutral = 0.0
            avg_negative = 0.0

        summary = {
            "avg_gaze_deviation_ratio": round(avg_gaze_deviation_ratio, 4),
            "total_expression_distribution": {
                "happy": round(avg_positive, 4),
                "neutral": round(avg_neutral, 4),
                "negative": round(avg_negative, 4),
            },
            "negative_expression_ratio": round(avg_negative, 4),
        }

        # video_score: gaze 60% + face 40%
        gaze_score = (1 - avg_gaze_deviation_ratio) * 100
        face_score = (avg_neutral + avg_positive) * 100
        video_score = round(gaze_score * 0.6 + face_score * 0.4)
        video_score = max(0, min(100, video_score))

        comment = self._generate_comment(
            avg_gaze_deviation_ratio, avg_positive, avg_neutral
        )

        return VideoAnalysisResult(
            video_score=video_score,
            video_analysis_comment=comment,
            per_turn=per_turn,
            summary=summary,
        )

    @staticmethod
    def _load_recordings(session_id: str) -> list:
        with get_session() as db:
            return (
                db.query(InterviewRecordingTable)
                .filter(InterviewRecordingTable.interview_session_id == session_id)
                .filter(InterviewRecordingTable.face_analysis_result != {})
                .order_by(InterviewRecordingTable.interview_turn_id)
                .all()
            )

    @staticmethod
    def _load_gaze_data(session_id: str) -> dict[int, dict]:
        """InterviewTurn에서 gaze_away_count, Recording에서 duration_ms를 로드."""
        with get_session() as db:
            recordings = (
                db.query(
                    InterviewRecordingTable.interview_turn_id,
                    InterviewRecordingTable.duration_ms,
                )
                .filter(InterviewRecordingTable.interview_session_id == session_id)
                .all()
            )
            duration_map = {r.interview_turn_id: r.duration_ms or 0 for r in recordings}

            turns = (
                db.query(
                    InterviewTurnTable.id,
                    InterviewTurnTable.gaze_away_count,
                )
                .filter(InterviewTurnTable.interview_session_id == session_id)
                .all()
            )

        return {
            t.id: {
                "gaze_away_count": t.gaze_away_count or 0,
                "duration_ms": duration_map.get(t.id, 0),
            }
            for t in turns
        }

    @staticmethod
    def _generate_comment(
        gaze_ratio: float, positive_ratio: float, neutral_ratio: float
    ) -> str:
        """rule-based 영상 분석 코멘트 (기획 REQ-2-7 템플릿)."""
        # 시선 멘트
        if gaze_ratio <= 0.1:
            gaze_comment = "시선이 안정적으로 정면을 유지했습니다."
        elif gaze_ratio <= 0.3:
            gaze_comment = "시선이 대체로 정면을 유지했으나 간헐적으로 이탈이 있었습니다."
        else:
            gaze_comment = "시선 이탈이 잦아 시선 처리에 주의가 필요합니다."

        # 표정 멘트
        if neutral_ratio >= 0.8:
            face_comment = "표정은 전반적으로 중립적이며 안정적인 인상을 주었습니다."
        elif positive_ratio >= 0.3:
            face_comment = "긍정적인 표정이 자주 나타나 밝은 인상을 주었습니다."
        elif (neutral_ratio + positive_ratio) >= 0.6:
            face_comment = "표정은 대체로 안정적이었습니다."
        else:
            face_comment = "부정적인 표정이 다소 나타나 표정 관리에 신경 쓰면 좋겠습니다."

        return f"{gaze_comment} {face_comment}"