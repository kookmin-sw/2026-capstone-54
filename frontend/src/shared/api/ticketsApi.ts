import { apiRequest } from "./client";

/* ── Types ── */
export interface TicketRewardPolicy {
  interviewOrder: number;
  ticketReward: number;
}

export interface TicketPolicy {
  freeDailyTicketAmount: number;
  proDailyTicketAmount: number;
  ticketCostFollowupInterview: number;
  ticketCostFullProcessInterview: number;
  ticketCostAnalysisReport: number;
  maxRewardedInterviewsPerDay: number;
  ticketRewardPerInterviewOrder: TicketRewardPolicy[];
}

export interface UserTicket {
  dailyCount: number;
  purchasedCount: number;
  totalCount: number;
}

/* ── Fetch Ticket Policy (비인증) ── */
export async function fetchTicketPolicyApi(): Promise<{
  success: boolean;
  data?: TicketPolicy;
  error?: string;
}> {
  try {
    const data = await apiRequest<TicketPolicy>("/api/v1/tickets/policies/");
    return { success: true, data };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "정책 조회 실패";
    return { success: false, error: msg };
  }
}

/* ── Fetch User Ticket (인증 필요) ── */
export async function fetchUserTicketApi(): Promise<{
  success: boolean;
  data?: UserTicket;
  error?: string;
}> {
  try {
    const data = await apiRequest<UserTicket>("/api/v1/tickets/me/", { auth: true });
    return { success: true, data };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "티켓 조회 실패";
    return { success: false, error: msg };
  }
}
