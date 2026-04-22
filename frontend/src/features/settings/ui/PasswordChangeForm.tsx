import { KeyRound, Lock } from "lucide-react";

interface PasswordChangeFormProps {
  passwordDraft: { currentPassword: string; newPassword: string; confirmPassword: string };
  pwdStrength: { width: string; color: string; label: string };
  pwdMatch: boolean | null;
  inputClass: string;
  saving: boolean;
  onSetPassword: (field: "currentPassword" | "newPassword" | "confirmPassword", value: string) => void;
  onSave: () => void;
  onReset: () => void;
  error: string | null;
  saveMessage: string | null;
}

export function PasswordChangeForm({
  passwordDraft,
  pwdStrength,
  pwdMatch,
  inputClass,
  saving,
  onSetPassword,
  onSave,
  onReset,
  error,
  saveMessage,
}: PasswordChangeFormProps) {
  return (
    <>
      <div className="mb-7">
        <h2 className="font-plex-sans-kr text-[20px] font-black tracking-[-0.4px] text-[#0A0A0A] mb-[5px]">비밀번호 변경</h2>
        <p className="text-[14px] text-[#6B7280] leading-[1.55]">주기적으로 비밀번호를 변경하면 계정을 더 안전하게 지킬 수 있어요</p>
      </div>

      <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-7 py-7 shadow-[var(--sc)] mb-4 max-[640px]:px-[18px]">
        <div className="font-plex-sans-kr text-[14px] font-extrabold tracking-[-0.1px] mb-[18px] flex items-center gap-[7px] text-[#0A0A0A]">
          <KeyRound size={15} className="text-[#F59E0B]" /> 비밀번호 변경
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-[5px]">
            <label className="font-plex-sans-kr text-[12px] font-bold text-[#0A0A0A] tracking-[0.1px] flex items-center gap-1">
              현재 비밀번호 <span className="text-[#EF4444] text-[10px]">*</span>
            </label>
            <input
              id="settings-current-password"
              name="currentPassword"
              type="password"
              className={inputClass}
              value={passwordDraft.currentPassword}
              onChange={(e) => onSetPassword("currentPassword", e.target.value)}
              placeholder="현재 비밀번호를 입력하세요"
            />
          </div>
          <div className="flex flex-col gap-[5px]">
            <label className="font-plex-sans-kr text-[12px] font-bold text-[#0A0A0A] tracking-[0.1px] flex items-center gap-1">
              새 비밀번호 <span className="text-[#EF4444] text-[10px]">*</span>
            </label>
            <input
              id="settings-new-password"
              name="newPassword"
              type="password"
              className={inputClass}
              value={passwordDraft.newPassword}
              onChange={(e) => onSetPassword("newPassword", e.target.value)}
              placeholder="새 비밀번호를 입력하세요"
            />
            <div className="h-1 bg-[#E5E7EB] rounded-full mt-2 overflow-hidden">
              <div className="h-full rounded-full transition-[width_0.4s_ease,background_0.3s]" style={{ width: pwdStrength.width, background: pwdStrength.color }} />
            </div>
            <p className="text-[11px] font-semibold mt-1 transition-[color] duration-300" style={{ color: pwdStrength.color }}>{pwdStrength.label}</p>
          </div>
          <div className="flex flex-col gap-[5px]">
            <label className="font-plex-sans-kr text-[12px] font-bold text-[#0A0A0A] tracking-[0.1px] flex items-center gap-1">
              새 비밀번호 확인 <span className="text-[#EF4444] text-[10px]">*</span>
            </label>
            <input
              id="settings-confirm-password"
              name="confirmPassword"
              type="password"
              className={inputClass}
              value={passwordDraft.confirmPassword}
              onChange={(e) => onSetPassword("confirmPassword", e.target.value)}
              placeholder="새 비밀번호를 다시 입력하세요"
            />
            {passwordDraft.confirmPassword && (
              <p className="text-[11px] leading-[1.45]" style={{ color: pwdMatch ? "#059669" : "#EF4444" }}>
                {pwdMatch ? "✓ 비밀번호가 일치합니다" : "✕ 비밀번호가 일치하지 않습니다"}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-7 py-7 shadow-[var(--sc)] mb-4 max-[640px]:px-[18px]" style={{ background: "rgba(9,145,178,.03)", borderColor: "rgba(9,145,178,.12)" }}>
        <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.7 }}>
          <Lock size={13} className="text-[#0991B2] inline-block mr-1 align-text-bottom" /> 비밀번호는 암호화되어 저장됩니다.<br />
          분실 시 로그인 화면에서 <strong style={{ color: "#0991B2" }}>비밀번호 찾기</strong>를 이용하세요.
        </p>
      </div>

      <div className="flex items-center justify-end gap-[10px] pt-5 border-t border-[#E5E7EB] mt-1 max-[640px]:flex-col-reverse max-[640px]:items-stretch">
        {saveMessage && <span className="text-[12px] font-bold text-[#059669] mr-auto animate-[spFadeUp_0.3s_ease]">✓ {saveMessage}</span>}
        {error && <span className="text-[12px] font-bold text-[#EF4444] mr-auto animate-[spFadeUp_0.3s_ease]">✕ {error}</span>}
        <button className="font-plex-sans-kr text-[14px] font-semibold text-[#6B7280] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-5 py-[10px] cursor-pointer transition-all duration-150 hover:bg-[#F3F4F6] hover:text-[#0A0A0A]" onClick={onReset}>취소</button>
        <button
          className="font-plex-sans-kr text-[14px] font-bold text-white bg-[#0A0A0A] border-none rounded-lg px-6 py-[10px] cursor-pointer transition-all duration-150 flex items-center gap-[7px] hover:opacity-85 hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 max-[640px]:justify-center"
          onClick={onSave}
          disabled={saving || !passwordDraft.currentPassword || !passwordDraft.newPassword || pwdMatch !== true}
        >
          {saving ? <span className="w-[14px] h-[14px] border-2 border-white/40 border-t-white rounded-full animate-[spSpin_0.6s_linear_infinite]" /> : <span>변경하기</span>}
        </button>
      </div>
    </>
  );
}