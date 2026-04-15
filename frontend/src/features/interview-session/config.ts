/**
 * 면접 세션 설정 상수.
 * 백엔드 interviews/constants.py 와 동기화해서 관리한다.
 */

export const FOLLOWUP_ANCHOR_COUNT = 2;
export const MAX_FOLLOWUP_PER_ANCHOR = 3;
/** 꼬리질문형 전체 질문 수 = FOLLOWUP_ANCHOR_COUNT * (1 + MAX_FOLLOWUP_PER_ANCHOR) */
export const FOLLOWUP_TOTAL_QUESTIONS = FOLLOWUP_ANCHOR_COUNT * (1 + MAX_FOLLOWUP_PER_ANCHOR); // 8
