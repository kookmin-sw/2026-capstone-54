"""
Blendshape 기반 표정 분류 모듈.

MediaPipe Face Landmarker의 52개 blendshape 계수를 사용하여
면접 서비스에 적합한 표정 카테고리로 분류합니다.

카테고리:
  - positive  : 웃는 표정, 놀라는 표정 등 긍정적/활발한 표정
  - negative  : 찡그리거나 우는 등 부정적 표정
  - neutral   : 무표정/차분한 표정
  - no_face   : 얼굴 미감지 또는 화면에 완전히 들어오지 않음

판별 기준은 blendshape 수치의 임계값으로 결정되며,
근육 움직임 기반이라 인종에 무관하게 동작합니다.
"""

from __future__ import annotations

# ── positive 판별 임계값 ──
# 입꼬리 올라감 (웃음)
SMILE_THRESHOLD = 0.25
# 입 벌림 (놀람) — 웃음이 아닌데 입이 크게 벌어진 경우
JAW_OPEN_THRESHOLD = 0.25

# ── negative 판별 임계값 ──
# 입꼬리 내려감 (울상)
FROWN_THRESHOLD = 0.13
# 눈썹 내려감 (화남/불쾌)
BROW_DOWN_THRESHOLD = 0.20
# 눈 찡그림 (찡그림/불쾌) — 단독으로 높으면 negative
EYE_SQUINT_THRESHOLD = 0.50


def classify_expression(
    smile_score: float,
    frown_score: float,
    brow_down_score: float,
    jaw_open_score: float = 0.0,
    eye_squint_score: float = 0.0,
) -> str:
    """
    blendshape 핵심 지표로 표정을 분류.

    Args:
        smile_score: 입꼬리 올라감 정도 (0~1), 좌우 평균
        frown_score: 입꼬리 내려감 정도 (0~1), 좌우 평균
        brow_down_score: 눈썹 내려감 정도 (0~1), 좌우 평균
        jaw_open_score: 입 벌림 정도 (0~1)
        eye_squint_score: 눈 찡그림 정도 (0~1), 좌우 평균

    Returns:
        "positive", "negative", "neutral" 중 하나
    """
    # ── positive: 웃음 또는 놀람 ──
    if smile_score >= SMILE_THRESHOLD:
        return "positive"

    if jaw_open_score >= JAW_OPEN_THRESHOLD and smile_score < SMILE_THRESHOLD:
        # 입이 크게 벌어졌지만 웃는 게 아닌 경우 → 놀람 → positive
        return "positive"

    # ── negative: 찡그림, 울상, 불쾌 ──
    if frown_score >= FROWN_THRESHOLD:
        return "negative"

    if brow_down_score >= BROW_DOWN_THRESHOLD:
        return "negative"

    # 눈 찡그림이 높으면서 frown이나 browDown도 어느 정도 있는 경우 → negative
    # (eyeSquint 단독으로는 판별하지 않음 — 동양인은 무표정에서도 높게 나옴)
    if eye_squint_score >= EYE_SQUINT_THRESHOLD and (
        frown_score >= FROWN_THRESHOLD * 0.5
        or brow_down_score >= BROW_DOWN_THRESHOLD * 0.4
    ):
        return "negative"

    # ── neutral ──
    return "neutral"
