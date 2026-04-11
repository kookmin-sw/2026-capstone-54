"""면접 세션 설정 상수."""

# 꼬리질문형(FOLLOWUP) 면접 설정
FOLLOWUP_ANCHOR_COUNT = 2  # 앵커 질문 수
MAX_FOLLOWUP_PER_ANCHOR = 3  # 앵커당 최대 꼬리질문 수
# 총 질문 수 = FOLLOWUP_ANCHOR_COUNT * (1 + MAX_FOLLOWUP_PER_ANCHOR) = 8
