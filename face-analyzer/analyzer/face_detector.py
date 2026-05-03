"""
MediaPipe Face Landmarker 기반 얼굴 감지 + 표정 분석 모듈.

역할:
  1. 얼굴 존재 여부 및 화면 내 완전 노출 판단
  2. 52개 blendshape 계수 추출 (표정 판별용)
  3. 고개 방향(head pose) 추정

blendshape 기반 표정 판별은 얼굴 근육 움직임 수치를 직접 사용하므로
인종 편향이 없고, 임계값 조정만으로 커스터마이징이 가능합니다.
"""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, Optional, Tuple

import cv2
import mediapipe as mp
import numpy as np

logger = logging.getLogger(__name__)

_MODEL_DIR = Path(__file__).parent.parent / "models"
_MODEL_FILENAME = "face_landmarker.task"

_MIN_FACE_AREA_RATIO = 0.02
_EDGE_MARGIN = 0.03

_landmarker = None


def _get_landmarker():
    """Lazy init — 콜드 스타트 시 한 번만 모델 로드."""
    global _landmarker
    if _landmarker is not None:
        return _landmarker

    model_path = str(_MODEL_DIR / _MODEL_FILENAME)
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Face Landmarker model not found: {model_path}")

    options = mp.tasks.vision.FaceLandmarkerOptions(
        base_options=mp.tasks.BaseOptions(model_asset_path=model_path),
        running_mode=mp.tasks.vision.RunningMode.IMAGE,
        output_face_blendshapes=True,
        num_faces=1,
        min_face_detection_confidence=0.4,
        min_face_presence_confidence=0.4,
    )
    _landmarker = mp.tasks.vision.FaceLandmarker.create_from_options(options)
    logger.info("Face Landmarker loaded: %s", model_path)
    return _landmarker


@dataclass
class FaceAnalysisResult:
    """Face Landmarker 분석 결과."""

    detected: bool = False
    fully_visible: bool = False
    face_area_ratio: float = 0.0
    blendshapes: Dict[str, float] = field(default_factory=dict)
    smile_score: float = 0.0
    frown_score: float = 0.0
    brow_down_score: float = 0.0
    jaw_open_score: float = 0.0
    eye_squint_score: float = 0.0
    head_yaw: float = 0.0
    head_pitch: float = 0.0
    head_roll: float = 0.0


def _estimate_head_pose(
    landmarks: list, img_w: int, img_h: int
) -> Tuple[float, float, float]:
    """6개 핵심 랜드마크로 고개 방향(yaw, pitch, roll)을 추정."""
    indices = [1, 33, 263, 61, 291, 199]
    image_points = np.array(
        [[landmarks[i].x * img_w, landmarks[i].y * img_h] for i in indices],
        dtype=np.float64,
    )
    model_points = np.array(
        [[0, 0, 0], [-30, -30, -30], [30, -30, -30],
         [-25, 30, -20], [25, 30, -20], [0, 55, -10]],
        dtype=np.float64,
    )
    focal_length = img_w
    center = (img_w / 2, img_h / 2)
    camera_matrix = np.array(
        [[focal_length, 0, center[0]],
         [0, focal_length, center[1]],
         [0, 0, 1]], dtype=np.float64,
    )
    success, rvec, _ = cv2.solvePnP(
        model_points, image_points, camera_matrix,
        np.zeros((4, 1)), flags=cv2.SOLVEPNP_ITERATIVE,
    )
    if not success:
        return 0.0, 0.0, 0.0
    rmat, _ = cv2.Rodrigues(rvec)
    angles, _, _, _, _, _ = cv2.RQDecomp3x3(rmat)
    return float(angles[1]), float(angles[0]), float(angles[2])


def analyze_face(image_bgr: np.ndarray) -> FaceAnalysisResult:
    """이미지에서 얼굴 감지 + blendshape 추출."""
    h, w = image_bgr.shape[:2]
    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)

    result = _get_landmarker().detect(mp_image)

    if not result.face_landmarks:
        return FaceAnalysisResult(detected=False)

    face_lms = result.face_landmarks[0]

    xs = [lm.x for lm in face_lms]
    ys = [lm.y for lm in face_lms]
    x_min, x_max = min(xs), max(xs)
    y_min, y_max = min(ys), max(ys)
    face_area_ratio = (x_max - x_min) * (y_max - y_min)

    fully_visible = (
        x_min > _EDGE_MARGIN
        and y_min > _EDGE_MARGIN
        and x_max < (1.0 - _EDGE_MARGIN)
        and y_max < (1.0 - _EDGE_MARGIN)
        and face_area_ratio >= _MIN_FACE_AREA_RATIO
    )

    yaw, pitch, roll = _estimate_head_pose(face_lms, w, h)

    blendshapes: Dict[str, float] = {}
    smile = frown = brow_down = jaw_open = eye_squint = 0.0

    if result.face_blendshapes:
        blendshapes = {
            b.category_name: round(b.score, 4)
            for b in result.face_blendshapes[0]
        }
        smile = (blendshapes.get("mouthSmileLeft", 0) + blendshapes.get("mouthSmileRight", 0)) / 2
        frown = (blendshapes.get("mouthFrownLeft", 0) + blendshapes.get("mouthFrownRight", 0)) / 2
        brow_down = (blendshapes.get("browDownLeft", 0) + blendshapes.get("browDownRight", 0)) / 2
        jaw_open = blendshapes.get("jawOpen", 0)
        eye_squint = (blendshapes.get("eyeSquintLeft", 0) + blendshapes.get("eyeSquintRight", 0)) / 2

    return FaceAnalysisResult(
        detected=True,
        fully_visible=fully_visible,
        face_area_ratio=round(face_area_ratio, 4),
        blendshapes=blendshapes,
        smile_score=round(smile, 4),
        frown_score=round(frown, 4),
        brow_down_score=round(brow_down, 4),
        jaw_open_score=round(jaw_open, 4),
        eye_squint_score=round(eye_squint, 4),
        head_yaw=round(yaw, 2),
        head_pitch=round(pitch, 2),
        head_roll=round(roll, 2),
    )
