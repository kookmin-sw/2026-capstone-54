import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useSettingsStore } from "@/features/settings";
import type { SettingsPanel } from "@/features/settings";

/* ── Password strength helper ── */
const PWD_STATES = [
  { width: "25%", color: "#EF4444", label: "약함 — 더 길게 작성해주세요" },
  { width: "50%", color: "#F97316", label: "보통 — 숫자를 추가하세요" },
  { width: "75%", color: "#F59E0B", label: "강함 — 특수문자를 추가하면 완벽해요" },
  { width: "100%", color: "#10B981", label: "매우 강함 ✓" },
];

function calcPwdScore(val: string): number {
  return [
    val.length >= 8,
    val.length >= 12,
    /[A-Za-z]/.test(val) && /[0-9]/.test(val),
    /[^A-Za-z0-9]/.test(val),
  ].filter(Boolean).length;
}

function getPwdStrength(val: string): { width: string; color: string; label: string } {
  if (!val) return { width: "0%", color: "#9CA3AF", label: "8자 이상, 영문+숫자+특수문자 포함 권장" };
  return PWD_STATES[Math.min(calcPwdScore(val) - 1, 3)] ?? PWD_STATES[0];
}

export function SettingsPage() {
  const navigate = useNavigate();
  const {
    data, loading, saving, error, saveMessage, activePanel, consentBadge,
    profileDraft, notificationsDraft, passwordDraft, aiDataDraft,
    jobCategories, jobCategoriesLoading, availableJobs, availableJobsLoading,
    fetchSettings, setActivePanel,
    loadJobCategories,
    setProfileDraftField, toggleJobId, saveProfile, resetProfileDraft,
    setPasswordDraft, savePassword, resetPasswordDraft,
    toggleNotification, saveNotifications, resetNotificationsDraft,
    setAiDataDraft, saveConsents,
    deleteInterviewData, deleteAccount,
    clearMessage,
  } = useSettingsStore();

  const [searchParams] = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<"data" | "account" | null>(null);

  // URL 쿼리로 패널 초기화 (?panel=notifications)
  useEffect(() => {
    const panel = searchParams.get("panel") as SettingsPanel | null;
    if (panel) setActivePanel(panel);
  }, [searchParams, setActivePanel]);

  useEffect(() => {
    fetchSettings();
    loadJobCategories();
  }, [fetchSettings, loadJobCategories]);

  useEffect(() => {
    if (saveMessage) {
      const t = setTimeout(() => clearMessage(), 3000);
      return () => clearTimeout(t);
    }
  }, [saveMessage, clearMessage]);

  const pwdStrength = getPwdStrength(passwordDraft.newPassword);
  const pwdMatch =
    passwordDraft.confirmPassword
      ? passwordDraft.newPassword === passwordDraft.confirmPassword
      : null;

  const handleDeleteConfirm = async () => {
    if (deleteConfirm === "data") await deleteInterviewData();
    if (deleteConfirm === "account") {
      await deleteAccount();
      navigate("/");
    }
    setDeleteConfirm(null);
  };

  const navItems: { key: SettingsPanel; icon: string; label: string; badge?: boolean }[] = [
    { key: "profile", icon: "👤", label: "프로필" },
    { key: "password", icon: "🔑", label: "비밀번호" },
    { key: "notifications", icon: "🔔", label: "알림 설정" },
    { key: "subscription", icon: "💎", label: "요금제" },
    { key: "consent", icon: "📋", label: "동의 관리", badge: consentBadge },
  ];

  const inputClass = "font-inter text-[14px] text-[#0A0A0A] bg-white border-[1.5px] border-[#E5E7EB] rounded-lg px-[14px] py-[10px] outline-none transition-[border-color,box-shadow] duration-[180ms] w-full placeholder-[#9CA3AF] focus:border-[#0991B2] focus:shadow-[0_0_0_3px_rgba(9,145,178,0.1)] read-only:opacity-50 read-only:cursor-not-allowed read-only:bg-[#F9FAFB]";
  const selectClass = "font-inter text-[14px] text-[#0A0A0A] bg-white border-[1.5px] border-[#E5E7EB] rounded-lg px-[14px] py-[10px] outline-none appearance-none cursor-pointer w-full transition-[border-color] duration-[180ms] focus:border-[#0991B2] focus:shadow-[0_0_0_3px_rgba(9,145,178,0.1)]";

  return (
    <>
      <div className="sp-wrap">

        {/* Overlay */}
        <div
          className={`${menuOpen ? "block" : "hidden"} fixed inset-0 z-[199] bg-black/40`}
          onClick={() => setMenuOpen(false)}
        />

        <div className="grid grid-cols-[240px_1fr] min-h-[calc(100vh-60px)] bg-white max-[1024px]:grid-cols-1">
          {/* SIDEBAR */}
          <aside className={`${menuOpen ? "translate-x-0" : ""} sticky top-[60px] h-[calc(100vh-60px)] overflow-y-auto border-r border-[#E5E7EB] px-3 py-5 flex flex-col gap-0.5 bg-white max-[1024px]:fixed max-[1024px]:left-0 max-[1024px]:top-[60px] max-[1024px]:bottom-0 max-[1024px]:w-[260px] max-[1024px]:z-[201] max-[1024px]:-translate-x-full max-[1024px]:transition-transform max-[1024px]:duration-300 max-[1024px]:shadow-[2px_0_8px_rgba(0,0,0,0.1)]`}>
            {data && (
              <div className="bg-[#0A0A0A] rounded-lg px-4 py-[14px] mb-4 flex items-center gap-[10px]">
                <div className="w-9 h-9 rounded-full bg-[#0991B2] flex items-center justify-center font-black text-[14px] text-white shrink-0">
                  {data.profile.avatarInitial}
                </div>
                <div>
                  <div className="font-inter text-[13px] font-extrabold text-white">{data.profile.name}</div>
                  <div className="text-[11px] text-white/45 mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap max-w-[130px]">{data.profile.email}</div>
                </div>
              </div>
            )}

            <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-[#9CA3AF] px-3 pt-[14px] pb-[6px]">설정</div>
            {navItems.map((item) => (
              <button
                key={item.key}
                className={`flex items-center gap-[9px] px-3 py-2 rounded-lg text-[13px] font-medium cursor-pointer select-none relative border-none w-full text-left font-inter transition-all duration-150 ${
                  activePanel === item.key
                    ? "bg-[#E6F7FA] text-[#0991B2] font-bold before:content-[''] before:absolute before:left-0 before:top-[20%] before:bottom-[20%] before:w-[3px] before:bg-[#0991B2] before:rounded-[0_4px_4px_0]"
                    : "text-[#6B7280] bg-none hover:bg-[#F9FAFB] hover:text-[#0A0A0A]"
                }`}
                onClick={() => { setActivePanel(item.key); setMenuOpen(false); }}
              >
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[14px] shrink-0 ${activePanel === item.key ? "bg-[rgba(9,145,178,0.12)]" : "bg-[#F9FAFB]"}`}>
                  {item.icon}
                </span>
                {item.label}
                {item.badge && item.key !== activePanel && (
                  <span className="ml-auto text-[10px] font-bold bg-[#E6F7FA] text-[#0991B2] px-[7px] py-0.5 rounded-full">1</span>
                )}
              </button>
            ))}

            <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-[#9CA3AF] px-3 pt-[14px] pb-[6px]">알림</div>
            <Link
              to="/notifications"
              className="flex items-center gap-[9px] px-3 py-2 rounded-lg text-[13px] font-medium text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#0A0A0A] transition-all duration-150 no-underline"
              onClick={() => setMenuOpen(false)}
            >
              <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[14px] shrink-0 bg-[#F9FAFB]">🔔</span>
              알림 내역
            </Link>
          </aside>

          {/* MAIN CONTENT */}
          <main className="px-10 py-8 min-w-0 bg-white max-[640px]:px-4 max-[640px]:py-5">
            {loading && !data ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="bg-gradient-to-r from-[#F3F4F6] via-[#E9EAEC] to-[#F3F4F6] bg-[length:200%_100%] animate-[spShimmer_1.4s_infinite] rounded-lg" style={{ height: 60, marginBottom: 8 }} />
                <div className="bg-gradient-to-r from-[#F3F4F6] via-[#E9EAEC] to-[#F3F4F6] bg-[length:200%_100%] animate-[spShimmer_1.4s_infinite] rounded-lg" style={{ height: 140 }} />
                <div className="bg-gradient-to-r from-[#F3F4F6] via-[#E9EAEC] to-[#F3F4F6] bg-[length:200%_100%] animate-[spShimmer_1.4s_infinite] rounded-lg" style={{ height: 200 }} />
              </div>
            ) : data ? (
              <>
                {/* ─── PROFILE PANEL ─── */}
                <div className={`${activePanel === "profile" ? "block animate-[spFadeUp_0.3s_ease_both]" : "hidden"}`}>
                  <div className="mb-7">
                    <h1 className="font-inter text-[26px] font-black tracking-[-0.5px] text-[#0A0A0A] mb-[5px]">프로필 수정</h1>
                    <p className="text-[14px] text-[#6B7280] leading-[1.55]">서비스에서 표시되는 이름, 직군 등 개인정보를 변경합니다</p>
                  </div>

                  <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-7 py-7 shadow-[var(--sc)] mb-4 max-[640px]:px-[18px]">
                    <div className="font-inter text-[14px] font-extrabold tracking-[-0.1px] mb-[18px] flex items-center gap-[7px] text-[#0A0A0A]">👤 프로필 사진</div>
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-16 h-16 rounded-full bg-[#0991B2] flex items-center justify-center font-inter text-[24px] font-black text-white shadow-[0_2px_8px_rgba(9,145,178,0.3)] shrink-0">
                        {data.profile.avatarInitial}
                      </div>
                      <div className="flex flex-col gap-[6px]">
                        <button className="font-inter text-[13px] font-bold text-[#0991B2] bg-[rgba(9,145,178,0.08)] border-[1.5px] border-[rgba(9,145,178,0.25)] rounded-lg px-4 py-[7px] cursor-pointer transition-all duration-150 hover:bg-[rgba(9,145,178,0.14)]">
                          사진 변경
                        </button>
                        <button className="font-inter text-[12px] font-semibold text-[#6B7280] bg-none border-none cursor-pointer transition-[color] duration-150 hover:text-[#0A0A0A]">
                          사진 삭제
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#6B7280] leading-[1.45]">JPG, PNG 파일 · 최대 5MB · 권장 크기 400×400px</p>
                  </div>

                  <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-7 py-7 shadow-[var(--sc)] mb-4 max-[640px]:px-[18px]">
                    <div className="font-inter text-[14px] font-extrabold tracking-[-0.1px] mb-[18px] flex items-center gap-[7px] text-[#0A0A0A]">📝 기본 정보</div>
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-[5px]">
                        <label className="font-inter text-[12px] font-bold text-[#0A0A0A] tracking-[0.1px] flex items-center gap-1">
                          이름 <span className="text-[#EF4444] text-[10px]">*</span>
                        </label>
                        <input
                          type="text"
                          className={inputClass}
                          value={profileDraft.name ?? ""}
                          onChange={(e) => setProfileDraftField("name", e.target.value)}
                          placeholder="이름을 입력하세요"
                        />
                      </div>
                      <div className="flex flex-col gap-[5px]">
                        <label className="font-inter text-[12px] font-bold text-[#0A0A0A] tracking-[0.1px]">이메일 주소</label>
                        <input type="email" className={inputClass} value={data.profile.email} readOnly />
                        <p className="text-[11px] text-[#6B7280] leading-[1.45]">이메일 주소는 변경할 수 없습니다. 고객센터로 문의해주세요.</p>
                      </div>
                      <div className="flex flex-col gap-4">
                        {/* 직군 선택 */}
                        <div className="flex flex-col gap-[5px]">
                          <label className="font-inter text-[12px] font-bold text-[#0A0A0A] tracking-[0.1px] flex items-center gap-1">
                            희망 직군 <span className="text-[#EF4444] text-[10px]">*</span>
                          </label>
                          {jobCategoriesLoading ? (
                            <div className="text-[12px] text-[#9CA3AF] py-2">직군 목록 불러오는 중...</div>
                          ) : (
                            <select
                              className={selectClass}
                              value={profileDraft.jobCategoryId ?? ""}
                              onChange={(e) => {
                                const id = e.target.value ? Number(e.target.value) : null;
                                setProfileDraftField("jobCategoryId", id);
                              }}
                            >
                              <option value="">직군을 선택하세요</option>
                              {jobCategories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.emoji} {cat.name}
                                </option>
                              ))}
                            </select>
                          )}
                          <p className="text-[11px] text-[#6B7280] leading-[1.45]">면접 질문 생성에 반영됩니다</p>
                        </div>

                        {/* 직업 다중 선택 */}
                        {profileDraft.jobCategoryId && (
                          <div className="flex flex-col gap-[5px]">
                            <label className="font-inter text-[12px] font-bold text-[#0A0A0A] tracking-[0.1px]">
                              직업 선택 <span className="text-[11px] font-normal text-[#6B7280]">(복수 선택 가능)</span>
                            </label>
                            {availableJobsLoading ? (
                              <div className="text-[12px] text-[#9CA3AF]">직업 목록 불러오는 중...</div>
                            ) : (
                              <div className="grid grid-cols-2 gap-2 max-[640px]:grid-cols-1">
                                {availableJobs.map((job) => {
                                  const isSelected = profileDraft.jobIds.includes(job.id);
                                  return (
                                    <button
                                      key={job.id}
                                      type="button"
                                      onClick={() => toggleJobId(job.id)}
                                      className={`text-left text-[12px] font-semibold px-3 py-2 rounded-lg border-[1.5px] transition-all ${
                                        isSelected
                                          ? "border-[#0991B2] bg-[#E6F7FA] text-[#0991B2]"
                                          : "border-[#E5E7EB] bg-[#F9FAFB] text-[#374151] hover:border-[#0991B2]"
                                      }`}
                                    >
                                      {isSelected ? "✓ " : ""}{job.name}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                            <p className="text-[11px] text-[#6B7280] leading-[1.45]">면접 맥락 설정에 활용됩니다</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-[10px] pt-5 border-t border-[#E5E7EB] mt-1 max-[640px]:flex-col-reverse max-[640px]:items-stretch">
                    {saveMessage && activePanel === "profile" && <span className="text-[12px] font-bold text-[#059669] mr-auto animate-[spFadeUp_0.3s_ease]">✓ {saveMessage}</span>}
                    {error && activePanel === "profile" && <span className="text-[12px] font-bold text-[#EF4444] mr-auto animate-[spFadeUp_0.3s_ease]">✕ {error}</span>}
                    <button className="font-inter text-[14px] font-semibold text-[#6B7280] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-5 py-[10px] cursor-pointer transition-all duration-150 hover:bg-[#F3F4F6] hover:text-[#0A0A0A]" onClick={resetProfileDraft}>취소</button>
                    <button className="font-inter text-[14px] font-bold text-white bg-[#0A0A0A] border-none rounded-lg px-6 py-[10px] cursor-pointer transition-all duration-150 flex items-center gap-[7px] hover:opacity-85 hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 max-[640px]:justify-center" onClick={saveProfile} disabled={saving}>
                      {saving ? <span className="w-[14px] h-[14px] border-2 border-white/40 border-t-white rounded-full animate-[spSpin_0.6s_linear_infinite]" /> : <span>저장하기</span>}
                    </button>
                  </div>
                </div>

                {/* ─── PASSWORD PANEL ─── */}
                <div className={`${activePanel === "password" ? "block animate-[spFadeUp_0.3s_ease_both]" : "hidden"}`}>
                  <div className="mb-7">
                    <h1 className="font-inter text-[26px] font-black tracking-[-0.5px] text-[#0A0A0A] mb-[5px]">비밀번호 변경</h1>
                    <p className="text-[14px] text-[#6B7280] leading-[1.55]">주기적으로 비밀번호를 변경하면 계정을 더 안전하게 지킬 수 있어요</p>
                  </div>

                  <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-7 py-7 shadow-[var(--sc)] mb-4 max-[640px]:px-[18px]">
                    <div className="font-inter text-[14px] font-extrabold tracking-[-0.1px] mb-[18px] flex items-center gap-[7px] text-[#0A0A0A]">🔑 비밀번호 변경</div>
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-[5px]">
                        <label className="font-inter text-[12px] font-bold text-[#0A0A0A] tracking-[0.1px] flex items-center gap-1">현재 비밀번호 <span className="text-[#EF4444] text-[10px]">*</span></label>
                        <input type="password" className={inputClass} value={passwordDraft.currentPassword} onChange={(e) => setPasswordDraft("currentPassword", e.target.value)} placeholder="현재 비밀번호를 입력하세요" />
                      </div>
                      <div className="flex flex-col gap-[5px]">
                        <label className="font-inter text-[12px] font-bold text-[#0A0A0A] tracking-[0.1px] flex items-center gap-1">새 비밀번호 <span className="text-[#EF4444] text-[10px]">*</span></label>
                        <input type="password" className={inputClass} value={passwordDraft.newPassword} onChange={(e) => setPasswordDraft("newPassword", e.target.value)} placeholder="새 비밀번호를 입력하세요" />
                        <div className="h-1 bg-[#E5E7EB] rounded-full mt-2 overflow-hidden">
                          <div className="h-full rounded-full transition-[width_0.4s_ease,background_0.3s]" style={{ width: pwdStrength.width, background: pwdStrength.color }} />
                        </div>
                        <p className="text-[11px] font-semibold mt-1 transition-[color] duration-300" style={{ color: pwdStrength.color }}>{pwdStrength.label}</p>
                      </div>
                      <div className="flex flex-col gap-[5px]">
                        <label className="font-inter text-[12px] font-bold text-[#0A0A0A] tracking-[0.1px] flex items-center gap-1">새 비밀번호 확인 <span className="text-[#EF4444] text-[10px]">*</span></label>
                        <input type="password" className={inputClass} value={passwordDraft.confirmPassword} onChange={(e) => setPasswordDraft("confirmPassword", e.target.value)} placeholder="새 비밀번호를 다시 입력하세요" />
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
                      🔒 비밀번호는 암호화되어 저장됩니다.<br />
                      분실 시 로그인 화면에서 <strong style={{ color: "#0991B2" }}>비밀번호 찾기</strong>를 이용하세요.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-[10px] pt-5 border-t border-[#E5E7EB] mt-1 max-[640px]:flex-col-reverse max-[640px]:items-stretch">
                    {saveMessage && activePanel === "password" && <span className="text-[12px] font-bold text-[#059669] mr-auto animate-[spFadeUp_0.3s_ease]">✓ {saveMessage}</span>}
                    {error && activePanel === "password" && <span className="text-[12px] font-bold text-[#EF4444] mr-auto animate-[spFadeUp_0.3s_ease]">✕ {error}</span>}
                    <button className="font-inter text-[14px] font-semibold text-[#6B7280] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-5 py-[10px] cursor-pointer transition-all duration-150 hover:bg-[#F3F4F6] hover:text-[#0A0A0A]" onClick={resetPasswordDraft}>취소</button>
                    <button
                      className="font-inter text-[14px] font-bold text-white bg-[#0A0A0A] border-none rounded-lg px-6 py-[10px] cursor-pointer transition-all duration-150 flex items-center gap-[7px] hover:opacity-85 hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 max-[640px]:justify-center"
                      onClick={savePassword}
                      disabled={saving || !passwordDraft.currentPassword || !passwordDraft.newPassword || pwdMatch === false}
                    >
                      {saving ? <span className="w-[14px] h-[14px] border-2 border-white/40 border-t-white rounded-full animate-[spSpin_0.6s_linear_infinite]" /> : <span>변경하기</span>}
                    </button>
                  </div>
                </div>

                {/* ─── NOTIFICATIONS PANEL ─── */}
                <div className={`${activePanel === "notifications" ? "block animate-[spFadeUp_0.3s_ease_both]" : "hidden"}`}>
                  <div className="mb-7">
                    <h1 className="font-inter text-[26px] font-black tracking-[-0.5px] text-[#0A0A0A] mb-[5px]">알림 설정</h1>
                    <p className="text-[14px] text-[#6B7280] leading-[1.55]">원하는 알림만 골라서 받아보세요</p>
                  </div>

                  <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-7 py-7 shadow-[var(--sc)] mb-4 max-[640px]:px-[18px]">
                    <div className="font-inter text-[14px] font-extrabold tracking-[-0.1px] mb-[18px] flex items-center gap-[7px] text-[#0A0A0A]">🔥 스트릭 &amp; 면접</div>
                    {([
                      { key: "streakReminder" as const, title: "스트릭 리마인더", desc: "오늘 면접 연습을 아직 하지 않았을 때 저녁 8시에 알림" },
                      { key: "streakExpire" as const, title: "스트릭 만료 경고", desc: "자정 1시간 전, 오늘 스트릭이 만료될 예정일 때 알림" },
                      { key: "streakReward" as const, title: "스트릭 보상 수령", desc: "마일스톤 달성 시 보상이 지급되었을 때 알림" },
                      { key: "reportReady" as const, title: "면접 리포트 완성", desc: "AI 면접 리뷰 리포트 생성이 완료되었을 때 알림" },
                    ] as const).map((item) => (
                      <div key={item.key} className="flex items-center justify-between px-4 py-[13px] bg-white border border-[#E5E7EB] rounded-[10px] mb-2 last:mb-0 transition-all duration-150 cursor-default hover:shadow-[0_2px_8px_rgba(0,0,0,0.1),0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-px">
                        <div>
                          <div className="font-inter text-[13px] font-bold mb-0.5 text-[#0A0A0A]">{item.title}</div>
                          <div className="text-[11px] text-[#6B7280] leading-[1.45]">{item.desc}</div>
                        </div>
                        <button
                          className={`w-10 h-[22px] rounded-full cursor-pointer relative transition-[background] duration-[250ms] shrink-0 border-none after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:w-4 after:h-4 after:rounded-full after:bg-white after:shadow-[0_1px_4px_rgba(0,0,0,0.15)] after:transition-transform after:duration-[250ms] after:[cubic-bezier(0.34,1.56,0.64,1)] ${notificationsDraft[item.key] ? "bg-[#0991B2] after:translate-x-[18px]" : "bg-[#E5E7EB]"}`}
                          onClick={() => toggleNotification(item.key)}
                          aria-label={item.title}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-7 py-7 shadow-[var(--sc)] mb-4 max-[640px]:px-[18px]">
                    <div className="font-inter text-[14px] font-extrabold tracking-[-0.1px] mb-[18px] flex items-center gap-[7px] text-[#0A0A0A]">📢 서비스 &amp; 마케팅</div>
                    {([
                      { key: "serviceNotice" as const, title: "서비스 공지 및 업데이트", desc: "새 기능, 점검, 약관 변경 등 중요 서비스 소식" },
                      { key: "marketing" as const, title: "마케팅 정보 수신", desc: "할인, 프로모션, 이벤트 등 혜택 정보 이메일 발송" },
                    ] as const).map((item) => (
                      <div key={item.key} className="flex items-center justify-between px-4 py-[13px] bg-white border border-[#E5E7EB] rounded-[10px] mb-2 last:mb-0 transition-all duration-150 cursor-default hover:shadow-[0_2px_8px_rgba(0,0,0,0.1),0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-px">
                        <div>
                          <div className="font-inter text-[13px] font-bold mb-0.5 text-[#0A0A0A]">{item.title}</div>
                          <div className="text-[11px] text-[#6B7280] leading-[1.45]">{item.desc}</div>
                        </div>
                        <button
                          className={`w-10 h-[22px] rounded-full cursor-pointer relative transition-[background] duration-[250ms] shrink-0 border-none after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:w-4 after:h-4 after:rounded-full after:bg-white after:shadow-[0_1px_4px_rgba(0,0,0,0.15)] after:transition-transform after:duration-[250ms] ${notificationsDraft[item.key] ? "bg-[#0991B2] after:translate-x-[18px]" : "bg-[#E5E7EB]"}`}
                          onClick={() => toggleNotification(item.key)}
                          aria-label={item.title}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-end gap-[10px] pt-5 border-t border-[#E5E7EB] mt-1 max-[640px]:flex-col-reverse max-[640px]:items-stretch">
                    {saveMessage && activePanel === "notifications" && <span className="text-[12px] font-bold text-[#059669] mr-auto animate-[spFadeUp_0.3s_ease]">✓ {saveMessage}</span>}
                    {error && activePanel === "notifications" && <span className="text-[12px] font-bold text-[#EF4444] mr-auto animate-[spFadeUp_0.3s_ease]">✕ {error}</span>}
                    <button className="font-inter text-[14px] font-semibold text-[#6B7280] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-5 py-[10px] cursor-pointer transition-all duration-150 hover:bg-[#F3F4F6] hover:text-[#0A0A0A]" onClick={resetNotificationsDraft}>취소</button>
                    <button className="font-inter text-[14px] font-bold text-white bg-[#0A0A0A] border-none rounded-lg px-6 py-[10px] cursor-pointer transition-all duration-150 flex items-center gap-[7px] hover:opacity-85 hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed max-[640px]:justify-center" onClick={saveNotifications} disabled={saving}>
                      {saving ? <span className="w-[14px] h-[14px] border-2 border-white/40 border-t-white rounded-full animate-[spSpin_0.6s_linear_infinite]" /> : <span>저장하기</span>}
                    </button>
                  </div>
                </div>

                {/* ─── SUBSCRIPTION PANEL ─── */}
                <div className={`${activePanel === "subscription" ? "block animate-[spFadeUp_0.3s_ease_both]" : "hidden"}`}>
                  <div className="mb-7">
                    <h1 className="font-inter text-[26px] font-black tracking-[-0.5px] text-[#0A0A0A] mb-[5px]">요금제 관리</h1>
                    <p className="text-[14px] text-[#6B7280] leading-[1.55]">현재 이용 중인 요금제를 확인하고 변경하세요</p>
                  </div>

                  <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-7 py-7 shadow-[var(--sc)] mb-4 max-[640px]:px-[18px]">
                    <div className="font-inter text-[14px] font-extrabold tracking-[-0.1px] mb-[18px] flex items-center gap-[7px] text-[#0A0A0A]">⭐ 현재 플랜</div>
                    <div className="bg-[#0A0A0A] rounded-[10px] px-[22px] py-5 relative overflow-hidden">
                      <div className="flex items-center justify-between gap-3 max-[640px]:flex-col max-[640px]:items-start">
                        <div>
                          <div className="font-inter text-[20px] font-black text-white">{data.subscription.plan === "free" ? "Free 플랜" : "Pro 플랜"}</div>
                          <div className="text-[12px] text-white/45 mt-0.5">
                            {data.subscription.plan === "free"
                              ? "기본 기능 무료 이용 중 · 결제 정보 없음"
                              : `다음 결제일: ${data.subscription.nextBillingDate}`}
                          </div>
                        </div>
                        <a href="#" className="font-inter text-[13px] font-bold text-[#0A0A0A] bg-white border-none rounded-lg px-[18px] py-[9px] cursor-pointer whitespace-nowrap no-underline inline-block transition-all duration-150 hover:bg-[#F3F4F6] hover:-translate-y-px">요금제 변경 →</a>
                      </div>
                      <div className="mt-[14px]">
                        <div className="flex justify-between text-[11px] text-white/45 mb-[5px]">
                          <span>이력서 사용량</span>
                          <span>{data.subscription.resumeUsed} / {data.subscription.resumeMax}개</span>
                        </div>
                        <div className="h-[5px] bg-white/12 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#06B6D4] rounded-full"
                            style={{ width: `${(data.subscription.resumeUsed / data.subscription.resumeMax) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-7 py-7 shadow-[var(--sc)] mb-4 max-[640px]:px-[18px]">
                    <div className="font-inter text-[14px] font-extrabold tracking-[-0.1px] mb-[18px] flex items-center gap-[7px] text-[#0A0A0A]">💎 Pro 플랜 혜택</div>
                    <div className="grid grid-cols-2 gap-[10px] max-[640px]:grid-cols-1">
                      {[
                        { icon: "👁️", name: "시선 추적 분석", desc: "면접 중 시선 이탈 횟수 측정" },
                        { icon: "⚡", name: "실전 모드", desc: "랜덤 대기 후 자동 시작" },
                        { icon: "📄", name: "상세 리포트 PDF", desc: "면접 리포트 저장·공유" },
                        { icon: "🗂️", name: "무제한 아카이브", desc: "전체 면접 세션 보관" },
                      ].map((item) => (
                        <div key={item.name} className="bg-white border border-[#E5E7EB] rounded-[10px] px-4 py-[14px] transition-all duration-150 hover:border-[rgba(9,145,178,0.3)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.1),0_8px_24px_rgba(0,0,0,0.08)]">
                          <div className="text-[20px] mb-[6px]">{item.icon}</div>
                          <div className="font-inter text-[13px] font-bold text-[#0A0A0A] mb-0.5">{item.name}</div>
                          <div className="text-[11px] text-[#6B7280]">{item.desc}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 16 }}>
                      <button
                        className="font-inter text-[14px] font-bold text-white bg-[#0A0A0A] border-none rounded-lg py-[10px] cursor-pointer transition-all duration-150 flex items-center gap-[7px] hover:opacity-85 hover:-translate-y-px justify-center w-full"
                        style={{ borderRadius: 8 }}
                      >
                        💎 Pro 업그레이드 — 첫 7일 무료
                      </button>
                    </div>
                  </div>
                </div>

                {/* ─── CONSENT PANEL ─── */}
                <div className={`${activePanel === "consent" ? "block animate-[spFadeUp_0.3s_ease_both]" : "hidden"}`}>
                  <div className="mb-7">
                    <h1 className="font-inter text-[26px] font-black tracking-[-0.5px] text-[#0A0A0A] mb-[5px]">동의 관리</h1>
                    <p className="text-[14px] text-[#6B7280] leading-[1.55]">수집된 데이터의 활용 범위를 직접 관리하세요</p>
                  </div>

                  <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-7 py-7 shadow-[var(--sc)] mb-4 max-[640px]:px-[18px]">
                    <div className="font-inter text-[14px] font-extrabold tracking-[-0.1px] mb-[18px] flex items-center gap-[7px] text-[#0A0A0A]">📋 약관 및 개인정보 동의</div>

                    <div className="flex gap-3 px-4 py-[14px] bg-white border border-[#E5E7EB] rounded-[10px] mb-2 transition-all duration-150">
                      <button className="w-[22px] h-[22px] rounded-[6px] shrink-0 flex items-center justify-center text-[10px] font-extrabold cursor-not-allowed opacity-70 border-none bg-[#0991B2] text-white shadow-[0_2px_8px_rgba(9,145,178,0.3)] mt-0.5" disabled>✓</button>
                      <div style={{ flex: 1 }}>
                        <div className="flex items-center gap-[6px] mb-[3px] flex-wrap">
                          <span className="font-inter text-[13px] font-bold text-[#0A0A0A]">이용약관 동의</span>
                          <span className="text-[10px] text-[#EF4444] font-bold">(필수)</span>
                        </div>
                        <p className="text-[12px] text-[#6B7280] leading-[1.55]">서비스 이용에 관한 권리·의무 및 규칙에 동의합니다</p>
                        <div className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0991B2] bg-[#E6F7FA] px-2 py-0.5 rounded-full mt-[5px]">v2025-01 · {data.consents.termsAgreedAt} 동의</div>
                      </div>
                    </div>

                    <div className="flex gap-3 px-4 py-[14px] bg-white border border-[#E5E7EB] rounded-[10px] mb-2 transition-all duration-150">
                      <button className="w-[22px] h-[22px] rounded-[6px] shrink-0 flex items-center justify-center text-[10px] font-extrabold cursor-not-allowed opacity-70 border-none bg-[#0991B2] text-white shadow-[0_2px_8px_rgba(9,145,178,0.3)] mt-0.5" disabled>✓</button>
                      <div style={{ flex: 1 }}>
                        <div className="flex items-center gap-[6px] mb-[3px] flex-wrap">
                          <span className="font-inter text-[13px] font-bold text-[#0A0A0A]">개인정보처리방침 동의</span>
                          <span className="text-[10px] text-[#EF4444] font-bold">(필수)</span>
                        </div>
                        <p className="text-[12px] text-[#6B7280] leading-[1.55]">수집되는 개인정보의 항목, 목적, 보존 기간에 동의합니다</p>
                        <div className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0991B2] bg-[#E6F7FA] px-2 py-0.5 rounded-full mt-[5px]">v2025-01 · {data.consents.privacyAgreedAt} 동의</div>
                      </div>
                    </div>

                    <div className="flex gap-3 px-4 py-[14px] bg-white border-[rgba(9,145,178,0.3)] bg-[rgba(9,145,178,0.02)] rounded-[10px] mb-2 transition-all duration-150 border">
                      <button
                        className={`w-[22px] h-[22px] rounded-[6px] shrink-0 flex items-center justify-center text-[10px] font-extrabold cursor-pointer border-none mt-0.5 transition-all duration-200 ${aiDataDraft ? "bg-[#0991B2] text-white shadow-[0_2px_8px_rgba(9,145,178,0.3)]" : "bg-[#E6F7FA] text-[#0991B2]"}`}
                        onClick={() => setAiDataDraft(!aiDataDraft)}
                      >
                        {aiDataDraft ? "✓" : "+"}
                      </button>
                      <div style={{ flex: 1 }}>
                        <div className="flex items-center gap-[6px] mb-[3px] flex-wrap">
                          <span className="font-inter text-[13px] font-bold text-[#0A0A0A]">AI 학습 데이터 활용 동의</span>
                          <span className="text-[10px] text-[#0991B2] font-bold">(선택)</span>
                        </div>
                        <p className="text-[12px] text-[#6B7280] leading-[1.55]">
                          면접 영상·음성 데이터를 AI 모델 개선에 활용하는 것에 동의합니다. 동의 시 서비스 품질 향상에 기여하며 추가 스트릭 보상을 받을 수 있어요.
                        </p>
                        <div className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-[#0A0A0A] px-2 py-0.5 rounded-full mt-[5px]">⚠ v2025-03 업데이트 · 재동의 필요</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-7 py-7 shadow-[var(--sc)] mb-4 max-[640px]:px-[18px]">
                    <div className="font-inter text-[14px] font-extrabold tracking-[-0.1px] mb-3 flex items-center gap-[7px] text-[#EF4444]">⚠ 위험 구역</div>
                    <div className="bg-[rgba(239,68,68,0.03)] border border-[rgba(239,68,68,0.15)] rounded-[10px] px-5 py-[18px]">
                      <div className="flex items-center justify-between gap-3 flex-wrap py-[10px] border-b border-[rgba(239,68,68,0.08)] first:pt-0 last:border-b-0 last:pb-0">
                        <div>
                          <div className="font-inter text-[13px] font-bold text-[#0A0A0A] mb-0.5">모든 면접 데이터 삭제</div>
                          <div className="text-[11px] text-[#6B7280]">저장된 면접 세션, 리포트, 답변 내역이 영구 삭제됩니다</div>
                        </div>
                        <button className="font-inter text-[13px] font-bold text-[#EF4444] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-lg px-4 py-2 cursor-pointer whitespace-nowrap transition-all duration-150 hover:bg-[rgba(239,68,68,0.14)]" onClick={() => setDeleteConfirm("data")}>데이터 삭제</button>
                      </div>
                      <div className="flex items-center justify-between gap-3 flex-wrap py-[10px]">
                        <div>
                          <div className="font-inter text-[13px] font-bold text-[#0A0A0A] mb-0.5">계정 탈퇴</div>
                          <div className="text-[11px] text-[#6B7280]">계정과 모든 데이터가 영구 삭제됩니다. 이 작업은 되돌릴 수 없습니다</div>
                        </div>
                        <button className="font-inter text-[13px] font-bold text-[#DC2626] bg-[rgba(220,38,38,0.08)] border border-[rgba(220,38,38,0.25)] rounded-lg px-4 py-2 cursor-pointer whitespace-nowrap transition-all duration-150 hover:bg-[rgba(239,68,68,0.14)]" onClick={() => setDeleteConfirm("account")}>계정 탈퇴</button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-[10px] pt-5 border-t border-[#E5E7EB] mt-1 max-[640px]:flex-col-reverse max-[640px]:items-stretch">
                    {saveMessage && activePanel === "consent" && <span className="text-[12px] font-bold text-[#059669] mr-auto animate-[spFadeUp_0.3s_ease]">✓ {saveMessage}</span>}
                    {error && activePanel === "consent" && <span className="text-[12px] font-bold text-[#EF4444] mr-auto animate-[spFadeUp_0.3s_ease]">✕ {error}</span>}
                    <button className="font-inter text-[14px] font-semibold text-[#6B7280] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-5 py-[10px] cursor-pointer transition-all duration-150 hover:bg-[#F3F4F6] hover:text-[#0A0A0A]" onClick={() => setAiDataDraft(data.consents.aiDataAgreed)}>취소</button>
                    <button className="font-inter text-[14px] font-bold text-white bg-[#0A0A0A] border-none rounded-lg px-6 py-[10px] cursor-pointer transition-all duration-150 flex items-center gap-[7px] hover:opacity-85 hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed max-[640px]:justify-center" onClick={saveConsents} disabled={saving}>
                      {saving ? <span className="w-[14px] h-[14px] border-2 border-white/40 border-t-white rounded-full animate-[spSpin_0.6s_linear_infinite]" /> : <span>저장하기</span>}
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </main>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[300] bg-black/50 flex items-center justify-center p-5" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-xl px-7 py-7 max-w-[400px] w-full shadow-[0_4px_24px_rgba(0,0,0,0.15)]" onClick={(e) => e.stopPropagation()}>
            <div className="font-inter text-[16px] font-extrabold text-[#0A0A0A] mb-2">
              {deleteConfirm === "data" ? "면접 데이터를 삭제하시겠습니까?" : "정말로 계정을 탈퇴하시겠습니까?"}
            </div>
            <p className="text-[13px] text-[#6B7280] leading-[1.6] mb-5">
              {deleteConfirm === "data"
                ? "저장된 모든 면접 세션, 리포트, 답변 내역이 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다."
                : "계정과 연결된 모든 데이터가 즉시 삭제됩니다. 탈퇴 후에는 복구가 불가능합니다."}
            </p>
            <div className="flex gap-[10px] justify-end">
              <button className="font-inter text-[14px] font-semibold text-[#6B7280] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-[18px] py-[9px] cursor-pointer" onClick={() => setDeleteConfirm(null)}>취소</button>
              <button className="font-inter text-[14px] font-bold text-white bg-[#EF4444] border-none rounded-lg px-[18px] py-[9px] cursor-pointer" onClick={handleDeleteConfirm} disabled={saving}>
                {saving ? "처리 중..." : deleteConfirm === "data" ? "삭제하기" : "탈퇴하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
