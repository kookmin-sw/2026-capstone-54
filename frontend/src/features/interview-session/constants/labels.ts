export const SESSION_TYPE_LABEL: Record<string, string> = {
  followup: "꼬리질문형",
  full_process: "전체 프로세스",
};

export const DIFFICULTY_LABEL: Record<string, string> = {
  friendly: "친근한 면접관",
  normal: "일반 면접관",
  pressure: "압박 면접관",
};

export const DIFFICULTY_STYLE: Record<string, { label: string; cls: string }> = {
  friendly: { label: "친근한 면접관", cls: "border-[#A7F3D0] bg-[#ECFDF5] text-[#059669]" },
  normal:   { label: "일반 면접관",   cls: "border-[#BAE6FD] bg-[#E6F7FA] text-[#0991B2]" },
  pressure: { label: "압박 면접관",   cls: "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]" },
};

export const REPORT_STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending:    { label: "리포트 대기",   cls: "text-[#D97706] bg-[#FFF7ED] border-[#FED7AA]" },
  generating: { label: "리포트 생성 중", cls: "text-[#0991B2] bg-[#E6F7FA] border-[#BAE6FD]" },
  completed:  { label: "리포트 완료",   cls: "text-[#059669] bg-[#F0FDF4] border-[#BBF7D0]" },
  failed:     { label: "리포트 실패",   cls: "text-[#DC2626] bg-[#FEF2F2] border-[#FECACA]" },
};
