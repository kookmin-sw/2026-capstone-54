"""
단일 프레임 분석 오케스트레이터.

MediaPipe Face Landmarker를 사용하여 하나의 이미지를 분석합니다.

분석 흐름:
  1. Face Landmarker로 얼굴 감지 + blendshape 추출
  2. blendshape 수치로 표정 분류 (positive / negative / neutral / no_face)
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Optional

import cv2
import numpy as np

from .emotion_category import classify_expression
from .face_detector import analyze_face

logger = logging.getLogger(__name__)

_NO_FACE = "no_face"


@dataclass
class FrameAnalysisResult:
    """단일 프레임 분석 결과.

    head_pose, blendshapes는 DB 저장 용량 최적화를 위해 제외한다.
    표정 분류에 필요한 5개 score와 분류 결과만 보존한다.
    """

    frame_id: str
    expression: str  # positive / negative / neutral / no_face
    face_detected: bool
    face_fully_visible: bool
    smile_score: float
    frown_score: float
    brow_down_score: float
    jaw_open_score: float
    eye_squint_score: float
    face_area_ratio: float
    error: Optional[str] = None


def analyze_frame(frame_id: str, image_bgr: np.ndarray) -> FrameAnalysisResult:
    """단일 이미지 프레임을 분석."""
    try:
        return _analyze_frame_inner(frame_id, image_bgr)
    except Exception as e:
        logger.error("Unhandled error in analyze_frame(%s): %s", frame_id, e, exc_info=True)
        return _no_face_result(frame_id, error=f"Unhandled exception: {str(e)[:300]}")


def _analyze_frame_inner(frame_id: str, image_bgr: np.ndarray) -> FrameAnalysisResult:
    face = analyze_face(image_bgr)

    if not face.detected:
        return _no_face_result(frame_id, error="No face detected")

    if not face.fully_visible:
        return FrameAnalysisResult(
            frame_id=frame_id,
            expression=_NO_FACE,
            face_detected=True,
            face_fully_visible=False,
            smile_score=face.smile_score,
            frown_score=face.frown_score,
            brow_down_score=face.brow_down_score,
            jaw_open_score=face.jaw_open_score,
            eye_squint_score=face.eye_squint_score,
            face_area_ratio=face.face_area_ratio,
            error="Face not fully visible in frame",
        )

    expression = classify_expression(
        face.smile_score, face.frown_score, face.brow_down_score,
        face.jaw_open_score, face.eye_squint_score,
    )

    return FrameAnalysisResult(
        frame_id=frame_id,
        expression=expression,
        face_detected=True,
        face_fully_visible=True,
        smile_score=face.smile_score,
        frown_score=face.frown_score,
        brow_down_score=face.brow_down_score,
        jaw_open_score=face.jaw_open_score,
        eye_squint_score=face.eye_squint_score,
        face_area_ratio=face.face_area_ratio,
    )


def analyze_frame_from_path(frame_id: str, image_path: str) -> FrameAnalysisResult:
    """파일 경로에서 이미지를 읽어 분석."""
    image_bgr = cv2.imread(image_path)
    if image_bgr is None:
        return _no_face_result(frame_id, error=f"Failed to read image: {image_path}")
    return analyze_frame(frame_id, image_bgr)


def _no_face_result(frame_id: str, error: str = "") -> FrameAnalysisResult:
    return FrameAnalysisResult(
        frame_id=frame_id,
        expression=_NO_FACE,
        face_detected=False,
        face_fully_visible=False,
        smile_score=0.0,
        frown_score=0.0,
        brow_down_score=0.0,
        jaw_open_score=0.0,
        eye_squint_score=0.0,
        face_area_ratio=0.0,
        error=error,
    )
