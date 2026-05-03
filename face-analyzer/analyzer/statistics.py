"""전체 프레임 분석 결과에 대한 통계 생성 모듈."""

from __future__ import annotations

import math
from collections import Counter
from typing import Any, Dict, List

from .frame_analyzer import FrameAnalysisResult

_NO_FACE = "no_face"


def compute_statistics(results: List[FrameAnalysisResult]) -> Dict[str, Any]:
    total = len(results)
    if total == 0:
        return {"error": "No frames to analyze", "total_frames": 0}

    face_detected_count = sum(1 for r in results if r.face_detected)
    fully_visible_count = sum(1 for r in results if r.face_fully_visible)
    error_count = sum(1 for r in results if r.error)

    expr_counter = Counter(r.expression for r in results)
    expression_distribution = {
        k: round(v / total, 4) for k, v in expr_counter.most_common()
    }

    faced = [r for r in results if r.face_detected]

    avg_scores = {}
    if faced:
        avg_scores = {
            "smile": round(_mean([r.smile_score for r in faced]), 4),
            "frown": round(_mean([r.frown_score for r in faced]), 4),
            "brow_down": round(_mean([r.brow_down_score for r in faced]), 4),
            "jaw_open": round(_mean([r.jaw_open_score for r in faced]), 4),
            "eye_squint": round(_mean([r.eye_squint_score for r in faced]), 4),
        }

    head_pose_stats = {}
    if faced:
        yaws = [r.head_pose["yaw"] for r in faced]
        pitches = [r.head_pose["pitch"] for r in faced]
        rolls = [r.head_pose["roll"] for r in faced]
        head_pose_stats = {
            "yaw": {"mean": round(_mean(yaws), 2), "std": round(_std(yaws), 2)},
            "pitch": {"mean": round(_mean(pitches), 2), "std": round(_std(pitches), 2)},
            "roll": {"mean": round(_mean(rolls), 2), "std": round(_std(rolls), 2)},
        }

    expr_changes = sum(
        1 for i in range(1, total)
        if results[i].expression != results[i - 1].expression
    )

    non_noface = {k: v for k, v in expr_counter.items() if k != _NO_FACE}
    dominant_expression = max(non_noface, key=non_noface.get) if non_noface else _NO_FACE

    return {
        "total_frames": total,
        "face_detected_count": face_detected_count,
        "face_detected_rate": round(face_detected_count / total, 4),
        "face_fully_visible_count": fully_visible_count,
        "face_fully_visible_rate": round(fully_visible_count / total, 4),
        "no_face_count": expr_counter.get(_NO_FACE, 0),
        "no_face_rate": round(expr_counter.get(_NO_FACE, 0) / total, 4),
        "error_count": error_count,
        "expression_distribution": expression_distribution,
        "dominant_expression": dominant_expression,
        "avg_scores": avg_scores,
        "head_pose_stats": head_pose_stats,
        "expression_change_count": expr_changes,
        "expression_change_rate": round(expr_changes / max(total - 1, 1), 4),
    }


def _mean(values: List[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def _std(values: List[float]) -> float:
    if len(values) < 2:
        return 0.0
    m = _mean(values)
    return math.sqrt(sum((x - m) ** 2 for x in values) / len(values))
