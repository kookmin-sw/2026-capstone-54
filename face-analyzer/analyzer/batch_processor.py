"""
배치 프레임 분석 프로세서.

여러 이미지를 순차 분석하고 결과를 통합합니다.
입력: 로컬 폴더 또는 S3 객체 리스트
출력: 프레임별 분석 결과 + 통계
"""

from __future__ import annotations

import glob
import logging
import os
from dataclasses import asdict
from datetime import datetime, timezone
from typing import Any, Dict, List

import cv2
import numpy as np

from .frame_analyzer import FrameAnalysisResult, analyze_frame, analyze_frame_from_path
from .frame_analyzer import _no_face_result
from .statistics import compute_statistics

logger = logging.getLogger(__name__)


def analyze_local_folder(
    folder_path: str,
    pattern: str = "*.jpg",
    **kwargs,
) -> Dict[str, Any]:
    """로컬 폴더의 이미지들을 순차 분석."""
    image_paths = sorted(glob.glob(os.path.join(folder_path, pattern)))
    if not image_paths:
        image_paths = sorted(glob.glob(
            os.path.join(folder_path, "**", pattern), recursive=True
        ))

    if not image_paths:
        return {
            "metadata": _build_metadata(0),
            "frames": [],
            "statistics": {"error": "No images found", "total_frames": 0},
        }

    logger.info("Found %d images in %s", len(image_paths), folder_path)
    results = [_safe_analyze(path) for path in image_paths]
    stats = compute_statistics(results)

    return {
        "metadata": _build_metadata(len(image_paths)),
        "frames": [asdict(r) for r in results],
        "statistics": stats,
    }


def analyze_s3_images(
    s3_client,
    bucket: str,
    keys: List[str],
    **kwargs,
) -> Dict[str, Any]:
    """S3 객체 리스트의 이미지들을 순차 분석."""
    if not keys:
        return {
            "metadata": _build_metadata(0),
            "frames": [],
            "statistics": {"error": "No S3 keys provided", "total_frames": 0},
        }

    logger.info("Analyzing %d S3 images from s3://%s", len(keys), bucket)
    results: List[FrameAnalysisResult] = []

    for key in sorted(keys):
        frame_id = os.path.basename(key)
        try:
            response = s3_client.get_object(Bucket=bucket, Key=key)
            image_bytes = response["Body"].read()
            nparr = np.frombuffer(image_bytes, np.uint8)
            image_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if image_bgr is None:
                raise ValueError("Failed to decode image")
            results.append(analyze_frame(frame_id, image_bgr))
        except Exception as e:
            logger.error("Failed to analyze S3 image %s: %s", key, str(e)[:200])
            results.append(_no_face_result(frame_id, error=str(e)[:200]))

    stats = compute_statistics(results)

    return {
        "metadata": _build_metadata(len(keys)),
        "frames": [asdict(r) for r in results],
        "statistics": stats,
    }


def _safe_analyze(path: str) -> FrameAnalysisResult:
    frame_id = os.path.basename(path)
    try:
        return analyze_frame_from_path(frame_id, path)
    except Exception as e:
        logger.error("Unexpected error analyzing %s: %s", path, e)
        return _no_face_result(frame_id, error=f"Unhandled exception: {str(e)[:200]}")


def _build_metadata(total_frames: int) -> Dict[str, Any]:
    return {
        "total_frames": total_frames,
        "analyzed_at": datetime.now(timezone.utc).isoformat(),
        "analyzer_version": "3.0.0",
        "model": "MediaPipe Face Landmarker (blendshapes, 3.7MB)",
        "expressions": ["positive", "negative", "neutral", "no_face"],
    }
