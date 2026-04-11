/** idle/checking/ok/fail 상태에 따라 배경색과 인디케이터가 바뀌는 점검 카드. */
import type { ReactNode } from "react";

type CheckStatus = "idle" | "checking" | "ok" | "fail";

interface CheckStatusCardProps {
  status: CheckStatus;
  icon: string;
  title: string;
  okText?: string;
  checkingText?: string;
  children?: ReactNode;
  className?: string;
}

const baseCls = "rounded-lg py-[18px] px-[14px] text-center shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-all duration-300 relative overflow-hidden";

const bgCls: Record<CheckStatus, string> = {
  ok: `${baseCls} bg-[#F0FDF4] border border-[rgba(5,150,105,.25)]`,
  checking: `${baseCls} bg-[#F9FAFB] border border-[#E5E7EB] animate-[ipc-cardGlow_1.8s_ease-in-out_infinite]`,
  fail: `${baseCls} bg-[#FFF1F2] border border-[rgba(225,29,72,.2)]`,
  idle: `${baseCls} bg-[#F9FAFB] border border-[#E5E7EB]`,
};

const dotCls: Record<CheckStatus, string> = {
  ok: "bg-[#10B981]",
  checking: "bg-[#0991B2] animate-[ipc-blink_1s_ease_infinite]",
  fail: "bg-[#E11D48]",
  idle: "bg-[#E5E7EB]",
};

const iconBgCls: Record<CheckStatus, string> = {
  ok: "bg-[#ECFDF5] border-[#BBF7D0]",
  checking: "bg-[#E6F7FA] border-[rgba(9,145,178,.2)]",
  fail: "bg-[#FFF1F2] border-[#FECDD3]",
  idle: "bg-[#F9FAFB] border-[#E5E7EB]",
};

export function CheckStatusCard({
  status, icon, title, okText = "정상", checkingText = "⟳ 측정 중...", children, className = "",
}: CheckStatusCardProps) {
  const statusLabel =
    status === "ok" ? <div className="text-[12px] font-semibold text-[#059669]">✓ {okText}</div>
    : status === "checking" ? <div className="text-[12px] font-semibold text-[#0991B2]">{checkingText}</div>
    : status === "fail" ? <div className="text-[12px] font-semibold text-[#E11D48]">✕ 오류 발생</div>
    : <div className="text-[12px] font-semibold text-[#6B7280]">대기 중</div>;

  return (
    <div className={`${bgCls[status]} ${className}`}>
      <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${dotCls[status]}`} />
      <div className={`w-[44px] h-[44px] rounded-lg mx-auto mb-2 flex items-center justify-center text-[20px] transition-all border ${iconBgCls[status]}`}>
        {icon}
      </div>
      <div className="text-[13px] font-extrabold mb-[3px]">{title}</div>
      {statusLabel}
      {children && <div className="text-[10px] text-[#6B7280] mt-[3px] leading-[1.4]">{children}</div>}
    </div>
  );
}
