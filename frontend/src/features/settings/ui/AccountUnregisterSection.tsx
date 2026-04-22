interface AccountUnregisterSectionProps {
  onDeleteAccount: () => void;
}

export function AccountUnregisterSection({ onDeleteAccount }: AccountUnregisterSectionProps) {
  return (
    <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-7 py-7 shadow-[var(--sc)] mb-4 max-[640px]:px-[18px]">
      <div className="bg-[rgba(239,68,68,0.03)] border border-[rgba(239,68,68,0.15)] rounded-[10px] px-5 py-[18px]">
        <div className="flex items-center justify-between gap-3 flex-wrap py-[10px]">
          <div>
            <div className="font-plex-sans-kr text-[13px] font-bold text-[#0A0A0A] mb-0.5">계정 탈퇴</div>
            <div className="text-[11px] text-[#6B7280]">계정과 모든 데이터가 영구 삭제됩니다. 이 작업은 되돌릴 수 없습니다</div>
          </div>
          <button
            className="font-plex-sans-kr text-[13px] font-bold text-[#DC2626] bg-[rgba(220,38,38,0.08)] border border-[rgba(220,38,38,0.25)] rounded-lg px-4 py-2 cursor-pointer whitespace-nowrap transition-all duration-150 hover:bg-[rgba(239,68,68,0.14)]"
            onClick={onDeleteAccount}
          >
            계정 탈퇴
          </button>
        </div>
      </div>
    </div>
  );
}