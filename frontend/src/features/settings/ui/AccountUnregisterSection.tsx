interface AccountUnregisterSectionProps {
  onDeleteAccount: () => void;
}

export function AccountUnregisterSection({ onDeleteAccount }: AccountUnregisterSectionProps) {
  return (
    <>
      <div className="mb-7">
        <h2 className="font-plex-sans-kr text-[20px] font-black tracking-[-0.4px] text-[#0A0A0A] mb-[5px]">회원 탈퇴</h2>
        <p className="text-[14px] text-[#6B7280] leading-[1.55]">아래 버튼을 클릭하면 회원 탈퇴가 진행돼요.</p>
      </div>

      <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-7 py-7 shadow-[var(--sc)] mb-4 max-[640px]:px-[18px]">
        <div className="bg-[rgba(239,68,68,0.03)] border border-[rgba(239,68,68,0.15)] rounded-[10px] px-5 py-[18px]">
          <div className="flex items-center justify-between gap-3 flex-wrap py-[10px]">
            <div>
              <div className="text-[13px] text-[#6B7280]">계정과 모든 데이터가 삭제 처리돼요. 이 작업은 되돌릴 수 없어요.</div>
            </div>
            <button
              className="font-plex-sans-kr text-[13px] font-bold text-[#DC2626] bg-[rgba(220,38,38,0.08)] border border-[rgba(220,38,38,0.25)] rounded-lg px-4 py-2 cursor-pointer whitespace-nowrap transition-all duration-150 hover:bg-[rgba(239,68,68,0.14)]"
              onClick={onDeleteAccount}
            >
              탈퇴하기
            </button>
          </div>
        </div>
      </div>
    </>
  );
}