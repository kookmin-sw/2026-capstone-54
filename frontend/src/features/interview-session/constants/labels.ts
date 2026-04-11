export const SESSION_TYPE_LABEL: Record<string, string> = {
  followup: "꼬리질문형",
  full_process: "전체 프로세스",
};

export const DIFFICULTY_LABEL: Record<string, string> = {
  friendly: "친근",
  normal: "일반",
  pressure: "압박",
};

export const REPORT_STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending:    { label: "리포트 대기",   cls: "text-[#D97706] bg-[#FFF7ED] border-[#FED7AA]" },
  generating: { label: "리포트 생성 중", cls: "text-[#0991B2] bg-[#E6F7FA] border-[#BAE6FD]" },
  completed:  { label: "리포트 완료",   cls: "text-[#059669] bg-[#F0FDF4] border-[#BBF7D0]" },
  failed:     { label: "리포트 실패",   cls: "text-[#DC2626] bg-[#FEF2F2] border-[#FECACA]" },
};
