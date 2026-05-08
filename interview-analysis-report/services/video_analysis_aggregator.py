"""
영상 분석 결과 집계 서비스.

각 턴의 face_analysis_result를 읽어 기획 문서의 video_analysis_result 구조로 변환한다.

매핑:
  - face_analyzer의 "positive" → 기획의 "긍정" (happy)
  - face_analyzer의 "neutral"  → 기획의 "무표정" (neutral)
  - face_analyzer의 "negative" → 기획의 "부정" (negative)
  - "no_face"는 표정 분포 계산에서 제외 (얼굴 미감지 프레임)

video_score 산출 (표정 기반만 사용):
  face_score  = (neutral_ratio + positive_ratio) × 100
  video_score = round(face_score)
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any

from db.connection import get_session
from db.models import InterviewRecordingTable

logger = logging.getLogger(__name__)


@dataclass
class VideoAnalysisResult:
    """영상 분석 집계 결과."""

    video_score: int = 0
    video_analysis_comment: str = ""
    per_turn: list[dict] = field(default_factory=list)
    summary: dict = field(default_factory=dict)


class VideoAnalysisAggregator:
    """face_analysis_result를 집계하여 video_score와 표정 분포를 산출한다."""

    def aggregate(self, session_id: str) -> VideoAnalysisResult:
        """세션의 모든 턴 face_analysis_result를 읽어 집계한다."""
        recordings = self._load_recordings(session_id)

        if not recordings:
            logger.warning("영상 분석 데이터 없음: session_id=%s", session_id)
            return VideoAnalysisResult()

        per_turn: list[dict] = []
        total_positive = 0.0
        total_neutral = 0.0
        total_negative = 0.0
        total_valid_frames = 0

        for rec in recordings:
            face_result = rec.face_analysis_result or {}
            statistics = face_result.get("statistics", {})
            expr_dist = statistics.get("expression_distribution", {})

            frames_count = statistics.get("total_frames", 0)
            if frames_count == 0:
                continue

            # 표정 분포 (no_face 제외하고 정규화)
            positive_raw = expr_dist.get("positive", 0.0)
            neutral_raw = expr_dist.get("neutral", 0.0)
            negative_raw = expr_dist.get("negative", 0.0)
            no_face_raw = expr_dist.get("no_face", 0.0)

            # no_face를 제외한 유효 프레임 비율 합
            valid_ratio = positive_raw + neutral_raw + negative_raw
            if valid_ratio <= 0:
                continue

            # 정규화: no_face 제외 후 비율 재계산
            positive_ratio = positive_raw / valid_ratio
            neutral_ratio = neutral_raw / valid_ratio
            negative_ratio = negative_raw / valid_ratio

            # 유효 프레임 수 (no_face 제외)
            valid_frames = int(frames_count * valid_ratio)

            per_turn.append({
                "turn_id": rec.interview_turn_id,
                "expression_distribution": {
                    "happy": round(positive_ratio, 4),
                    "neutral": round(neutral_ratio, 4),
                    "negative": round(negative_ratio, 4),
                },
            })

            # 가중 합산 (유효 프레임 수 기준)
            total_positive += positive_ratio * valid_frames
            total_neutral += neutral_ratio * valid_frames
            total_negative += negative_ratio * valid_frames
            total_valid_frames += valid_frames

        if total_valid_frames == 0:
            return VideoAnalysisResult()

        # 전체 집계
        avg_positive = total_positive / total_valid_frames
        avg_neutral = total_neutral / total_valid_frames
        avg_negative = total_negative / total_valid_frames

        summary = {
            "total_expression_distribution": {
                "happy": round(avg_positive, 4),
                "neutral": round(avg_neutral, 4),
                "negative": round(avg_negative, 4),
            },
            "negative_expression_ratio": round(avg_negative, 4),
        }

        # video_score 산출 (표정 기반)
        face_score = (avg_neutral + avg_positive) * 100
        video_score = round(face_score)
        video_score = max(0, min(100, video_score))

        # 코멘트 생성 (rule-based)
        comment = self._generate_comment(avg_positive, avg_neutral)

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
    def _generate_comment(positive_ratio: float, neutral_ratio: float) -> str:
        """rule-based 영상 분석 코멘트 생성."""
        face_pct = (neutral_ratio + positive_ratio) * 100

        parts = []
        if positive_ratio >= 0.3:
            parts.append(f"긍정 표현 비율이 {positive_ratio * 100:.0f}%로 호감 있는 인상을 주었습니다.")
        elif positive_ratio >= 0.15:
            parts.append("표정은 대체로 중립적이며 적절한 긍정 표현이 있었습니다.")
        else:
            parts.append("표정 변화가 적어 다소 딱딱한 인상을 줄 수 있습니다.")

        parts.append(f"긍정+무표정 비율은 {face_pct:.0f}%입니다.")

        return " ".join(parts)
