"""
Django Ticket Policy Settings

MeFit 티켓 정책 관련 상수를 정의한다.
"""

# ── Daily Ticket (일일 티켓) ────────────────────────────────────────────────

FREE_DAILY_TICKET_AMOUNT = 10
PRO_DAILY_TICKET_AMOUNT = 30

# ── Interview Ticket Costs (면접 티켓 소모량) ─────────────────────────────────

TICKET_COST_FOLLOWUP_INTERVIEW = 5
TICKET_COST_FULL_PROCESS_INTERVIEW = 8
TICKET_COST_ANALYSIS_REPORT = 2

# ── Interview Reward Policy (면접 완료 보상) ─────────────────────────────────

MAX_REWARDED_INTERVIEWS_PER_DAY = 5

TICKET_REWARD_PER_INTERVIEW_ORDER = [
  0,  # index 0: 미사용 (순서는 1부터 시작)
  5,  # 1번째 면접 → 5 tickets
  3,  # 2번째 면접 → 3 tickets
  3,  # 3번째 면접 → 3 tickets
  2,  # 4번째 면접 → 2 tickets
  2,  # 5번째 면접 → 2 tickets
]

__all__ = [
  "FREE_DAILY_TICKET_AMOUNT",
  "PRO_DAILY_TICKET_AMOUNT",
  "TICKET_COST_FOLLOWUP_INTERVIEW",
  "TICKET_COST_FULL_PROCESS_INTERVIEW",
  "TICKET_COST_ANALYSIS_REPORT",
  "MAX_REWARDED_INTERVIEWS_PER_DAY",
  "TICKET_REWARD_PER_INTERVIEW_ORDER",
]
