import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSettingsStore } from "@/features/settings";
import type { SettingsPanel } from "@/features/settings";

/* ── Password strength helper ── */
function getPwdStrength(val: string): { width: string; color: string; label: string } {
  if (!val) return { width: "0%", color: "#9CA3AF", label: "8자 이상, 영문+숫자+특수문자 포함 권장" };
  let score = 0;
  if (val.length >= 8) score++;
  if (val.length >= 12) score++;
  if (/[A-Za-z]/.test(val) && /[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  const states = [
    { width: "25%", color: "#EF4444", label: "약함 — 더 길게 작성해주세요" },
    { width: "50%", color: "#F97316", label: "보통 — 숫자를 추가하세요" },
    { width: "75%", color: "#F59E0B", label: "강함 — 특수문자를 추가하면 완벽해요" },
    { width: "100%", color: "#10B981", label: "매우 강함 ✓" },
  ];
  return states[Math.min(score - 1, 3)] ?? states[0];
}

export function SettingsPage() {
  const navigate = useNavigate();
  const {
    data, loading, saving, error, saveMessage, activePanel, consentBadge,
    profileDraft, notificationsDraft, passwordDraft, aiDataDraft,
    fetchSettings, setActivePanel,
    setProfileDraft, saveProfile, resetProfileDraft,
    setPasswordDraft, savePassword, resetPasswordDraft,
    toggleNotification, saveNotifications, resetNotificationsDraft,
    setAiDataDraft, saveConsents,
    deleteInterviewData, deleteAccount,
    clearMessage,
  } = useSettingsStore();

  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<"data" | "account" | null>(null);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

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

  return (
    <>
      <style>{`
        /* ── RESET ── */
        .sp-wrap *, .sp-wrap *::before, .sp-wrap *::after { box-sizing: border-box; }
        :root {
          --sc: 0 1px 3px rgba(0,0,0,.08), 0 4px 16px rgba(0,0,0,.06);
          --sc-hover: 0 2px 8px rgba(0,0,0,.1), 0 8px 24px rgba(0,0,0,.08);
        }

        /* ── NAV ── */
        .sp-nav {
          position: sticky; top: 0; z-index: 200;
          background: rgba(255,255,255,.92);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid #E5E7EB;
          height: 60px; display: flex; align-items: center;
          padding: 0 32px; gap: 16px;
        }
        .sp-nav-logo {
          font-size: 20px; font-weight: 900; color: #0A0A0A;
          text-decoration: none; letter-spacing: -.4px; margin-right: auto;
          font-family: 'Inter', sans-serif;
        }
        .sp-nav-logo .hi { color: #0991B2; }
        .sp-menu-btn {
          display: none; width: 40px; height: 40px;
          background: none; border: 1px solid #E5E7EB;
          border-radius: 8px; cursor: pointer;
          align-items: center; justify-content: center;
          transition: background .15s;
        }
        .sp-menu-btn:hover { background: #F9FAFB; }
        .sp-menu-icon { display: flex; flex-direction: column; gap: 4px; }
        .sp-menu-icon span { width: 18px; height: 2px; background: #0A0A0A; border-radius: 2px; transition: all .2s; }
        .sp-menu-btn.open .sp-menu-icon span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
        .sp-menu-btn.open .sp-menu-icon span:nth-child(2) { opacity: 0; }
        .sp-menu-btn.open .sp-menu-icon span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }
        .sp-nav-back {
          font-size: 13px; font-weight: 600; color: #6B7280;
          text-decoration: none; padding: 6px 12px; border-radius: 8px;
          transition: color .15s, background .15s; display: flex; align-items: center; gap: 4px;
        }
        .sp-nav-back:hover { color: #0A0A0A; background: #F9FAFB; }

        /* ── LAYOUT ── */
        .sp-shell {
          display: grid; grid-template-columns: 240px 1fr;
          min-height: calc(100vh - 60px);
          background: #FFFFFF;
        }

        /* ── SIDEBAR ── */
        .sp-sidebar {
          position: sticky; top: 60px; height: calc(100vh - 60px);
          overflow-y: auto; border-right: 1px solid #E5E7EB;
          padding: 20px 12px; display: flex; flex-direction: column; gap: 2px;
          background: #FFFFFF;
        }
        .sp-sidebar-overlay {
          display: none; position: fixed; inset: 0; z-index: 199;
          background: rgba(0,0,0,.4);
        }
        .sp-sidebar-overlay.open { display: block; }

        /* Profile mini card in sidebar */
        .sp-sb-profile {
          background: #0A0A0A; border-radius: 8px; padding: 14px 16px;
          margin-bottom: 16px; display: flex; align-items: center; gap: 10px;
        }
        .sp-sb-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: #0991B2; display: flex; align-items: center;
          justify-content: center; font-weight: 900; font-size: 14px;
          color: #fff; flex-shrink: 0;
        }
        .sp-sb-name { font-size: 13px; font-weight: 800; color: #fff; font-family: 'Inter', sans-serif; }
        .sp-sb-email { font-size: 11px; color: rgba(255,255,255,.45); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 130px; }

        .sp-sb-sep {
          font-size: 10px; font-weight: 700; letter-spacing: .1em;
          text-transform: uppercase; color: #9CA3AF; padding: 14px 12px 6px;
        }
        .sp-sb-item {
          display: flex; align-items: center; gap: 9px; padding: 8px 12px;
          border-radius: 8px; font-size: 13px; font-weight: 500; color: #6B7280;
          cursor: pointer; transition: all .15s; user-select: none; position: relative;
          border: none; background: none; width: 100%; text-align: left;
          font-family: 'Inter', sans-serif;
        }
        .sp-sb-item:hover { background: #F9FAFB; color: #0A0A0A; }
        .sp-sb-item.active { background: #E6F7FA; color: #0991B2; font-weight: 700; }
        .sp-sb-item.active::before {
          content: ''; position: absolute; left: 0; top: 20%; bottom: 20%;
          width: 3px; background: #0991B2; border-radius: 0 4px 4px 0;
        }
        .sp-sb-icon {
          width: 28px; height: 28px; border-radius: 8px; display: flex;
          align-items: center; justify-content: center; font-size: 14px;
          flex-shrink: 0; background: #F9FAFB;
        }
        .sp-sb-item.active .sp-sb-icon { background: rgba(9,145,178,.12); }
        .sp-sb-badge {
          margin-left: auto; font-size: 10px; font-weight: 700;
          background: #E6F7FA; color: #0991B2; padding: 2px 7px; border-radius: 100px;
        }

        /* ── MAIN ── */
        .sp-main { padding: 32px 40px; min-width: 0; background: #FFFFFF; }

        /* ── PANEL ── */
        .sp-panel { display: none; }
        .sp-panel.active { display: block; animation: spFadeUp .3s ease both; }
        @keyframes spFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .sp-panel-header { margin-bottom: 28px; }
        .sp-panel-title {
          font-size: 26px; font-weight: 900; letter-spacing: -.5px;
          color: #0A0A0A; margin-bottom: 5px;
          font-family: 'Inter', sans-serif;
        }
        .sp-panel-sub { font-size: 14px; color: #6B7280; line-height: 1.55; }

        /* ── CARD ── */
        .sp-card {
          background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px;
          padding: 28px; box-shadow: var(--sc); margin-bottom: 16px;
        }
        .sp-card-title {
          font-size: 14px; font-weight: 800; letter-spacing: -.1px;
          margin-bottom: 18px; display: flex; align-items: center; gap: 7px;
          color: #0A0A0A; font-family: 'Inter', sans-serif;
        }

        /* ── FORM ── */
        .sp-field-group { display: flex; flex-direction: column; gap: 16px; }
        .sp-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .sp-field { display: flex; flex-direction: column; gap: 5px; }
        .sp-label {
          font-size: 12px; font-weight: 700; color: #0A0A0A;
          letter-spacing: .1px; font-family: 'Inter', sans-serif;
          display: flex; align-items: center; gap: 4px;
        }
        .sp-label-req { color: #EF4444; font-size: 10px; }
        .sp-input {
          font-family: 'Inter', sans-serif; font-size: 14px; color: #0A0A0A;
          background: #FFFFFF; border: 1.5px solid #E5E7EB;
          border-radius: 8px; padding: 10px 14px; outline: none;
          transition: border-color .18s, box-shadow .18s; width: 100%;
        }
        .sp-input:focus { border-color: #0991B2; box-shadow: 0 0 0 3px rgba(9,145,178,.1); }
        .sp-input:read-only { opacity: .5; cursor: not-allowed; background: #F9FAFB; }
        .sp-input::placeholder { color: #9CA3AF; }
        .sp-select {
          font-family: 'Inter', sans-serif; font-size: 14px; color: #0A0A0A;
          background: #FFFFFF; border: 1.5px solid #E5E7EB;
          border-radius: 8px; padding: 10px 14px; outline: none;
          appearance: none; cursor: pointer; width: 100%; transition: border-color .18s;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%236B7280' d='M1 1l5 5 5-5'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 14px center;
        }
        .sp-select:focus { border-color: #0991B2; box-shadow: 0 0 0 3px rgba(9,145,178,.1); }
        .sp-hint { font-size: 11px; color: #6B7280; line-height: 1.45; }

        /* Avatar Upload */
        .sp-avatar-row { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
        .sp-avatar-lg {
          width: 64px; height: 64px; border-radius: 50%;
          background: #0991B2; display: flex; align-items: center; justify-content: center;
          font-size: 24px; font-weight: 900; color: #fff;
          box-shadow: 0 2px 8px rgba(9,145,178,.3); flex-shrink: 0;
          font-family: 'Inter', sans-serif;
        }
        .sp-avatar-btns { display: flex; flex-direction: column; gap: 6px; }
        .sp-btn-upload {
          font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700;
          color: #0991B2; background: rgba(9,145,178,.08);
          border: 1.5px solid rgba(9,145,178,.25); border-radius: 8px;
          padding: 7px 16px; cursor: pointer; transition: all .15s;
        }
        .sp-btn-upload:hover { background: rgba(9,145,178,.14); }
        .sp-btn-remove {
          font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600;
          color: #6B7280; background: none; border: none; cursor: pointer; transition: color .15s;
        }
        .sp-btn-remove:hover { color: #0A0A0A; }

        /* Password strength */
        .sp-pwd-meter {
          height: 4px; background: #E5E7EB; border-radius: 100px;
          margin-top: 8px; overflow: hidden;
        }
        .sp-pwd-bar { height: 100%; border-radius: 100px; transition: width .4s ease, background .3s; }
        .sp-pwd-label { font-size: 11px; font-weight: 600; margin-top: 4px; transition: color .3s; }

        /* Toggle */
        .sp-toggle-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 13px 16px; background: #FFFFFF; border: 1px solid #E5E7EB;
          border-radius: 10px; margin-bottom: 8px; transition: all .15s; cursor: default;
        }
        .sp-toggle-row:last-child { margin-bottom: 0; }
        .sp-toggle-row:hover { box-shadow: var(--sc-hover); transform: translateY(-1px); }
        .sp-tl-title { font-size: 13px; font-weight: 700; margin-bottom: 2px; color: #0A0A0A; font-family: 'Inter', sans-serif; }
        .sp-tl-desc { font-size: 11px; color: #6B7280; line-height: 1.45; }
        .sp-mini-toggle {
          width: 40px; height: 22px; border-radius: 100px;
          background: #E5E7EB; cursor: pointer; position: relative;
          transition: background .25s; flex-shrink: 0; border: none;
        }
        .sp-mini-toggle.on { background: #0991B2; }
        .sp-mini-toggle::after {
          content: ''; position: absolute; top: 3px; left: 3px;
          width: 16px; height: 16px; border-radius: 50%; background: #fff;
          box-shadow: 0 1px 4px rgba(0,0,0,.15); transition: transform .25s cubic-bezier(.34,1.56,.64,1);
        }
        .sp-mini-toggle.on::after { transform: translateX(18px); }

        /* Consent items */
        .sp-consent-item {
          display: flex; gap: 12px; padding: 14px 16px;
          background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 10px;
          margin-bottom: 8px; transition: all .15s;
        }
        .sp-consent-item:last-child { margin-bottom: 0; }
        .sp-consent-item:hover { box-shadow: var(--sc-hover); }
        .sp-consent-item.updatable { border-color: rgba(9,145,178,.3); background: rgba(9,145,178,.02); }
        .sp-consent-check {
          width: 22px; height: 22px; border-radius: 6px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 800; cursor: pointer; transition: all .2s; margin-top: 2px;
          border: none;
        }
        .sp-consent-check.checked { background: #0991B2; color: #fff; box-shadow: 0 2px 8px rgba(9,145,178,.3); }
        .sp-consent-check.unchecked { background: #E6F7FA; color: #0991B2; }
        .sp-consent-check.required { cursor: not-allowed; opacity: .7; }
        .sp-cb-title-row { display: flex; align-items: center; gap: 6px; margin-bottom: 3px; flex-wrap: wrap; }
        .sp-cb-title { font-size: 13px; font-weight: 700; color: #0A0A0A; font-family: 'Inter', sans-serif; }
        .sp-cb-req { font-size: 10px; color: #EF4444; font-weight: 700; }
        .sp-cb-optional { font-size: 10px; color: #0991B2; font-weight: 700; }
        .sp-cb-desc { font-size: 12px; color: #6B7280; line-height: 1.55; }
        .sp-cb-version {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 10px; font-weight: 700; color: #0991B2;
          background: #E6F7FA; padding: 2px 8px; border-radius: 100px; margin-top: 5px;
        }
        .sp-cb-version.new { color: #fff; background: #0A0A0A; }

        /* Subscription */
        .sp-sub-inline {
          background: #0A0A0A; border-radius: 10px; padding: 20px 22px;
          position: relative; overflow: hidden;
        }
        .sp-sub-inner { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .sp-sub-plan { font-size: 20px; font-weight: 900; color: #fff; font-family: 'Inter', sans-serif; }
        .sp-sub-meta { font-size: 12px; color: rgba(255,255,255,.45); margin-top: 2px; }
        .sp-btn-manage {
          font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700;
          color: #0A0A0A; background: #fff; border: none; border-radius: 8px;
          padding: 9px 18px; cursor: pointer; white-space: nowrap;
          transition: all .15s; text-decoration: none; display: inline-block;
        }
        .sp-btn-manage:hover { background: #F3F4F6; transform: translateY(-1px); }
        .sp-usage-row { margin-top: 14px; }
        .sp-usage-label { display: flex; justify-content: space-between; font-size: 11px; color: rgba(255,255,255,.45); margin-bottom: 5px; }
        .sp-usage-bg { height: 5px; background: rgba(255,255,255,.12); border-radius: 100px; overflow: hidden; }
        .sp-usage-fill { height: 100%; background: #06B6D4; border-radius: 100px; }
        .sp-pro-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .sp-pro-item {
          background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 10px; padding: 14px 16px;
          transition: all .15s;
        }
        .sp-pro-item:hover { border-color: rgba(9,145,178,.3); box-shadow: var(--sc-hover); }
        .sp-pro-icon { font-size: 20px; margin-bottom: 6px; }
        .sp-pro-name { font-size: 13px; font-weight: 700; color: #0A0A0A; font-family: 'Inter', sans-serif; margin-bottom: 2px; }
        .sp-pro-desc { font-size: 11px; color: #6B7280; }

        /* Danger Zone */
        .sp-danger-zone {
          background: rgba(239,68,68,.03); border: 1px solid rgba(239,68,68,.15);
          border-radius: 10px; padding: 18px 20px;
        }
        .sp-dz-title {
          font-size: 11px; font-weight: 800; color: #EF4444; letter-spacing: .5px;
          text-transform: uppercase; margin-bottom: 12px; font-family: 'Inter', sans-serif;
        }
        .sp-dz-item {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; flex-wrap: wrap; padding: 10px 0;
          border-bottom: 1px solid rgba(239,68,68,.08);
        }
        .sp-dz-item:last-child { border-bottom: none; padding-bottom: 0; }
        .sp-dz-item:first-child { padding-top: 0; }
        .sp-dz-t { font-size: 13px; font-weight: 700; color: #0A0A0A; font-family: 'Inter', sans-serif; margin-bottom: 2px; }
        .sp-dz-d { font-size: 11px; color: #6B7280; }
        .sp-btn-danger {
          font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700;
          color: #EF4444; background: rgba(239,68,68,.08);
          border: 1px solid rgba(239,68,68,.2); border-radius: 8px;
          padding: 8px 16px; cursor: pointer; transition: all .15s; white-space: nowrap;
        }
        .sp-btn-danger:hover { background: rgba(239,68,68,.14); }
        .sp-btn-danger.critical { color: #DC2626; background: rgba(220,38,38,.08); border-color: rgba(220,38,38,.25); }

        /* Action row */
        .sp-action-row {
          display: flex; align-items: center; justify-content: flex-end; gap: 10px;
          padding-top: 20px; border-top: 1px solid #E5E7EB; margin-top: 4px;
        }
        .sp-save-msg {
          font-size: 12px; font-weight: 700; color: #059669; margin-right: auto;
          animation: spFadeUp .3s ease;
        }
        .sp-err-msg {
          font-size: 12px; font-weight: 700; color: #EF4444; margin-right: auto;
          animation: spFadeUp .3s ease;
        }
        .sp-btn-cancel {
          font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600;
          color: #6B7280; background: #F9FAFB; border: 1px solid #E5E7EB;
          border-radius: 8px; padding: 10px 20px; cursor: pointer; transition: all .15s;
        }
        .sp-btn-cancel:hover { background: #F3F4F6; color: #0A0A0A; }
        .sp-btn-save {
          font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 700;
          color: #FFFFFF; background: #0A0A0A; border: none;
          border-radius: 8px; padding: 10px 24px; cursor: pointer;
          transition: all .15s; display: flex; align-items: center; gap: 7px;
        }
        .sp-btn-save:hover { opacity: .85; transform: translateY(-1px); }
        .sp-btn-save:disabled { opacity: .6; cursor: not-allowed; transform: none; }
        .sp-spinner {
          width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.4);
          border-top-color: #fff; border-radius: 50%;
          animation: spSpin .6s linear infinite;
        }
        @keyframes spSpin { to { transform: rotate(360deg); } }

        /* Modal */
        .sp-modal-overlay {
          position: fixed; inset: 0; z-index: 300;
          background: rgba(0,0,0,.5); display: flex;
          align-items: center; justify-content: center; padding: 20px;
        }
        .sp-modal {
          background: #FFFFFF; border-radius: 12px; padding: 28px; max-width: 400px; width: 100%;
          box-shadow: 0 4px 24px rgba(0,0,0,.15);
        }
        .sp-modal-title { font-size: 16px; font-weight: 800; color: #0A0A0A; margin-bottom: 8px; font-family: 'Inter', sans-serif; }
        .sp-modal-desc { font-size: 13px; color: #6B7280; line-height: 1.6; margin-bottom: 20px; }
        .sp-modal-btns { display: flex; gap: 10px; justify-content: flex-end; }
        .sp-modal-cancel { font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600; color: #6B7280; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 9px 18px; cursor: pointer; }
        .sp-modal-confirm { font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 700; color: #fff; background: #EF4444; border: none; border-radius: 8px; padding: 9px 18px; cursor: pointer; }

        /* Skeleton */
        .sp-skeleton {
          background: linear-gradient(90deg, #F3F4F6 25%, #E9EAEC 50%, #F3F4F6 75%);
          background-size: 200% 100%; animation: spShimmer 1.4s infinite; border-radius: 8px;
        }
        @keyframes spShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .sp-shell { grid-template-columns: 1fr; }
          .sp-menu-btn { display: flex; }
          .sp-sidebar {
            position: fixed; left: 0; top: 60px; bottom: 0; width: 260px; z-index: 201;
            transform: translateX(-100%); transition: transform .3s ease;
            box-shadow: 2px 0 8px rgba(0,0,0,.1);
          }
          .sp-sidebar.open { transform: translateX(0); }
        }
        @media (max-width: 640px) {
          .sp-nav { padding: 0 16px; }
          .sp-main { padding: 20px 16px; }
          .sp-field-row { grid-template-columns: 1fr; }
          .sp-card { padding: 18px; }
          .sp-action-row { flex-direction: column-reverse; align-items: stretch; }
          .sp-btn-save { justify-content: center; }
          .sp-sub-inner { flex-direction: column; align-items: flex-start; }
          .sp-pro-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="sp-wrap">
        {/* NAV */}
        <nav className="sp-nav">
          <button
            className={`sp-menu-btn${menuOpen ? " open" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="메뉴"
          >
            <div className="sp-menu-icon">
              <span /><span /><span />
            </div>
          </button>
          <Link to="/home" className="sp-nav-logo">me<span className="hi">Fit</span></Link>
          <Link to="/home" className="sp-nav-back">← 홈으로</Link>
        </nav>

        {/* Overlay */}
        <div
          className={`sp-sidebar-overlay${menuOpen ? " open" : ""}`}
          onClick={() => setMenuOpen(false)}
        />

        <div className="sp-shell">
          {/* SIDEBAR */}
          <aside className={`sp-sidebar${menuOpen ? " open" : ""}`}>
            {data && (
              <div className="sp-sb-profile">
                <div className="sp-sb-avatar">{data.profile.avatarInitial}</div>
                <div>
                  <div className="sp-sb-name">{data.profile.name}</div>
                  <div className="sp-sb-email">{data.profile.email}</div>
                </div>
              </div>
            )}

            <div className="sp-sb-sep">설정</div>
            {navItems.map((item) => (
              <button
                key={item.key}
                className={`sp-sb-item${activePanel === item.key ? " active" : ""}`}
                onClick={() => { setActivePanel(item.key); setMenuOpen(false); }}
              >
                <span className="sp-sb-icon">{item.icon}</span>
                {item.label}
                {item.badge && item.key !== activePanel && (
                  <span className="sp-sb-badge">1</span>
                )}
              </button>
            ))}
          </aside>

          {/* MAIN CONTENT */}
          <main className="sp-main">
            {loading && !data ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="sp-skeleton" style={{ height: 60, marginBottom: 8 }} />
                <div className="sp-skeleton" style={{ height: 140 }} />
                <div className="sp-skeleton" style={{ height: 200 }} />
              </div>
            ) : data ? (
              <>
                {/* ─── PROFILE PANEL ─── */}
                <div className={`sp-panel${activePanel === "profile" ? " active" : ""}`}>
                  <div className="sp-panel-header">
                    <h1 className="sp-panel-title">프로필 수정</h1>
                    <p className="sp-panel-sub">서비스에서 표시되는 이름, 직군 등 개인정보를 변경합니다</p>
                  </div>

                  <div className="sp-card">
                    <div className="sp-card-title">👤 프로필 사진</div>
                    <div className="sp-avatar-row">
                      <div className="sp-avatar-lg">{data.profile.avatarInitial}</div>
                      <div className="sp-avatar-btns">
                        <button className="sp-btn-upload">사진 변경</button>
                        <button className="sp-btn-remove">사진 삭제</button>
                      </div>
                    </div>
                    <p className="sp-hint">JPG, PNG 파일 · 최대 5MB · 권장 크기 400×400px</p>
                  </div>

                  <div className="sp-card">
                    <div className="sp-card-title">📝 기본 정보</div>
                    <div className="sp-field-group">
                      <div className="sp-field">
                        <label className="sp-label">이름 <span className="sp-label-req">*</span></label>
                        <input
                          type="text"
                          className="sp-input"
                          value={profileDraft.name ?? ""}
                          onChange={(e) => setProfileDraft("name", e.target.value)}
                          placeholder="이름을 입력하세요"
                        />
                      </div>
                      <div className="sp-field">
                        <label className="sp-label">이메일 주소</label>
                        <input type="email" className="sp-input" value={data.profile.email} readOnly />
                        <p className="sp-hint">이메일 주소는 변경할 수 없습니다. 고객센터로 문의해주세요.</p>
                      </div>
                      <div className="sp-field-row">
                        <div className="sp-field">
                          <label className="sp-label">희망 직군 <span className="sp-label-req">*</span></label>
                          <select
                            className="sp-select"
                            value={profileDraft.jobCategory ?? ""}
                            onChange={(e) => setProfileDraft("jobCategory", e.target.value)}
                          >
                            {["IT/개발","마케팅/광고","금융/회계","의료/간호","교육","영업","디자인","기획/전략","HR/인사","기타"].map((v) => (
                              <option key={v}>{v}</option>
                            ))}
                          </select>
                          <p className="sp-hint">면접 질문 생성에 반영됩니다</p>
                        </div>
                        <div className="sp-field">
                          <label className="sp-label">현재 직업 / 직책</label>
                          <input
                            type="text"
                            className="sp-input"
                            value={profileDraft.jobTitle ?? ""}
                            onChange={(e) => setProfileDraft("jobTitle", e.target.value)}
                            placeholder="직업 또는 직책"
                          />
                          <p className="sp-hint">면접 맥락 설정에 활용됩니다</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="sp-action-row">
                    {saveMessage && activePanel === "profile" && <span className="sp-save-msg">✓ {saveMessage}</span>}
                    {error && activePanel === "profile" && <span className="sp-err-msg">✕ {error}</span>}
                    <button className="sp-btn-cancel" onClick={resetProfileDraft}>취소</button>
                    <button className="sp-btn-save" onClick={saveProfile} disabled={saving}>
                      {saving ? <span className="sp-spinner" /> : <span>저장하기</span>}
                    </button>
                  </div>
                </div>

                {/* ─── PASSWORD PANEL ─── */}
                <div className={`sp-panel${activePanel === "password" ? " active" : ""}`}>
                  <div className="sp-panel-header">
                    <h1 className="sp-panel-title">비밀번호 변경</h1>
                    <p className="sp-panel-sub">주기적으로 비밀번호를 변경하면 계정을 더 안전하게 지킬 수 있어요</p>
                  </div>

                  <div className="sp-card">
                    <div className="sp-card-title">🔑 비밀번호 변경</div>
                    <div className="sp-field-group">
                      <div className="sp-field">
                        <label className="sp-label">현재 비밀번호 <span className="sp-label-req">*</span></label>
                        <input
                          type="password"
                          className="sp-input"
                          value={passwordDraft.currentPassword}
                          onChange={(e) => setPasswordDraft("currentPassword", e.target.value)}
                          placeholder="현재 비밀번호를 입력하세요"
                        />
                      </div>
                      <div className="sp-field">
                        <label className="sp-label">새 비밀번호 <span className="sp-label-req">*</span></label>
                        <input
                          type="password"
                          className="sp-input"
                          value={passwordDraft.newPassword}
                          onChange={(e) => setPasswordDraft("newPassword", e.target.value)}
                          placeholder="새 비밀번호를 입력하세요"
                        />
                        <div className="sp-pwd-meter">
                          <div
                            className="sp-pwd-bar"
                            style={{ width: pwdStrength.width, background: pwdStrength.color }}
                          />
                        </div>
                        <p className="sp-pwd-label" style={{ color: pwdStrength.color }}>{pwdStrength.label}</p>
                      </div>
                      <div className="sp-field">
                        <label className="sp-label">새 비밀번호 확인 <span className="sp-label-req">*</span></label>
                        <input
                          type="password"
                          className="sp-input"
                          value={passwordDraft.confirmPassword}
                          onChange={(e) => setPasswordDraft("confirmPassword", e.target.value)}
                          placeholder="새 비밀번호를 다시 입력하세요"
                        />
                        {passwordDraft.confirmPassword && (
                          <p className="sp-hint" style={{ color: pwdMatch ? "#059669" : "#EF4444" }}>
                            {pwdMatch ? "✓ 비밀번호가 일치합니다" : "✕ 비밀번호가 일치하지 않습니다"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="sp-card" style={{ background: "rgba(9,145,178,.03)", borderColor: "rgba(9,145,178,.12)" }}>
                    <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.7 }}>
                      🔒 비밀번호는 암호화되어 저장됩니다.<br />
                      분실 시 로그인 화면에서 <strong style={{ color: "#0991B2" }}>비밀번호 찾기</strong>를 이용하세요.
                    </p>
                  </div>

                  <div className="sp-action-row">
                    {saveMessage && activePanel === "password" && <span className="sp-save-msg">✓ {saveMessage}</span>}
                    {error && activePanel === "password" && <span className="sp-err-msg">✕ {error}</span>}
                    <button className="sp-btn-cancel" onClick={resetPasswordDraft}>취소</button>
                    <button
                      className="sp-btn-save"
                      onClick={savePassword}
                      disabled={saving || !passwordDraft.currentPassword || !passwordDraft.newPassword || pwdMatch === false}
                    >
                      {saving ? <span className="sp-spinner" /> : <span>변경하기</span>}
                    </button>
                  </div>
                </div>

                {/* ─── NOTIFICATIONS PANEL ─── */}
                <div className={`sp-panel${activePanel === "notifications" ? " active" : ""}`}>
                  <div className="sp-panel-header">
                    <h1 className="sp-panel-title">알림 설정</h1>
                    <p className="sp-panel-sub">원하는 알림만 골라서 받아보세요</p>
                  </div>

                  <div className="sp-card">
                    <div className="sp-card-title">🔥 스트릭 &amp; 면접</div>
                    {([
                      { key: "streakReminder" as const, title: "스트릭 리마인더", desc: "오늘 면접 연습을 아직 하지 않았을 때 저녁 8시에 알림" },
                      { key: "streakExpire" as const, title: "스트릭 만료 경고", desc: "자정 1시간 전, 오늘 스트릭이 만료될 예정일 때 알림" },
                      { key: "streakReward" as const, title: "스트릭 보상 수령", desc: "마일스톤 달성 시 보상이 지급되었을 때 알림" },
                      { key: "reportReady" as const, title: "면접 리포트 완성", desc: "AI 면접 리뷰 리포트 생성이 완료되었을 때 알림" },
                    ] as const).map((item) => (
                      <div key={item.key} className="sp-toggle-row">
                        <div>
                          <div className="sp-tl-title">{item.title}</div>
                          <div className="sp-tl-desc">{item.desc}</div>
                        </div>
                        <button
                          className={`sp-mini-toggle${notificationsDraft[item.key] ? " on" : ""}`}
                          onClick={() => toggleNotification(item.key)}
                          aria-label={item.title}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="sp-card">
                    <div className="sp-card-title">📢 서비스 &amp; 마케팅</div>
                    {([
                      { key: "serviceNotice" as const, title: "서비스 공지 및 업데이트", desc: "새 기능, 점검, 약관 변경 등 중요 서비스 소식" },
                      { key: "marketing" as const, title: "마케팅 정보 수신", desc: "할인, 프로모션, 이벤트 등 혜택 정보 이메일 발송" },
                    ] as const).map((item) => (
                      <div key={item.key} className="sp-toggle-row">
                        <div>
                          <div className="sp-tl-title">{item.title}</div>
                          <div className="sp-tl-desc">{item.desc}</div>
                        </div>
                        <button
                          className={`sp-mini-toggle${notificationsDraft[item.key] ? " on" : ""}`}
                          onClick={() => toggleNotification(item.key)}
                          aria-label={item.title}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="sp-action-row">
                    {saveMessage && activePanel === "notifications" && <span className="sp-save-msg">✓ {saveMessage}</span>}
                    {error && activePanel === "notifications" && <span className="sp-err-msg">✕ {error}</span>}
                    <button className="sp-btn-cancel" onClick={resetNotificationsDraft}>취소</button>
                    <button className="sp-btn-save" onClick={saveNotifications} disabled={saving}>
                      {saving ? <span className="sp-spinner" /> : <span>저장하기</span>}
                    </button>
                  </div>
                </div>

                {/* ─── SUBSCRIPTION PANEL ─── */}
                <div className={`sp-panel${activePanel === "subscription" ? " active" : ""}`}>
                  <div className="sp-panel-header">
                    <h1 className="sp-panel-title">요금제 관리</h1>
                    <p className="sp-panel-sub">현재 이용 중인 요금제를 확인하고 변경하세요</p>
                  </div>

                  <div className="sp-card">
                    <div className="sp-card-title">⭐ 현재 플랜</div>
                    <div className="sp-sub-inline">
                      <div className="sp-sub-inner">
                        <div>
                          <div className="sp-sub-plan">{data.subscription.plan === "free" ? "Free 플랜" : "Pro 플랜"}</div>
                          <div className="sp-sub-meta">
                            {data.subscription.plan === "free"
                              ? "기본 기능 무료 이용 중 · 결제 정보 없음"
                              : `다음 결제일: ${data.subscription.nextBillingDate}`}
                          </div>
                        </div>
                        <a href="#" className="sp-btn-manage">요금제 변경 →</a>
                      </div>
                      <div className="sp-usage-row">
                        <div className="sp-usage-label">
                          <span>이력서 사용량</span>
                          <span>{data.subscription.resumeUsed} / {data.subscription.resumeMax}개</span>
                        </div>
                        <div className="sp-usage-bg">
                          <div
                            className="sp-usage-fill"
                            style={{ width: `${(data.subscription.resumeUsed / data.subscription.resumeMax) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="sp-card">
                    <div className="sp-card-title">💎 Pro 플랜 혜택</div>
                    <div className="sp-pro-grid">
                      {[
                        { icon: "👁️", name: "시선 추적 분석", desc: "면접 중 시선 이탈 횟수 측정" },
                        { icon: "⚡", name: "실전 모드", desc: "랜덤 대기 후 자동 시작" },
                        { icon: "📄", name: "상세 리포트 PDF", desc: "면접 리포트 저장·공유" },
                        { icon: "🗂️", name: "무제한 아카이브", desc: "전체 면접 세션 보관" },
                      ].map((item) => (
                        <div key={item.name} className="sp-pro-item">
                          <div className="sp-pro-icon">{item.icon}</div>
                          <div className="sp-pro-name">{item.name}</div>
                          <div className="sp-pro-desc">{item.desc}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 16 }}>
                      <button
                        className="sp-btn-save"
                        style={{ width: "100%", justifyContent: "center", borderRadius: 8 }}
                      >
                        💎 Pro 업그레이드 — 첫 7일 무료
                      </button>
                    </div>
                  </div>
                </div>

                {/* ─── CONSENT PANEL ─── */}
                <div className={`sp-panel${activePanel === "consent" ? " active" : ""}`}>
                  <div className="sp-panel-header">
                    <h1 className="sp-panel-title">동의 관리</h1>
                    <p className="sp-panel-sub">수집된 데이터의 활용 범위를 직접 관리하세요</p>
                  </div>

                  <div className="sp-card">
                    <div className="sp-card-title">📋 약관 및 개인정보 동의</div>

                    <div className="sp-consent-item">
                      <button className="sp-consent-check checked required" disabled>✓</button>
                      <div style={{ flex: 1 }}>
                        <div className="sp-cb-title-row">
                          <span className="sp-cb-title">이용약관 동의</span>
                          <span className="sp-cb-req">(필수)</span>
                        </div>
                        <p className="sp-cb-desc">서비스 이용에 관한 권리·의무 및 규칙에 동의합니다</p>
                        <div className="sp-cb-version">v2025-01 · {data.consents.termsAgreedAt} 동의</div>
                      </div>
                    </div>

                    <div className="sp-consent-item">
                      <button className="sp-consent-check checked required" disabled>✓</button>
                      <div style={{ flex: 1 }}>
                        <div className="sp-cb-title-row">
                          <span className="sp-cb-title">개인정보처리방침 동의</span>
                          <span className="sp-cb-req">(필수)</span>
                        </div>
                        <p className="sp-cb-desc">수집되는 개인정보의 항목, 목적, 보존 기간에 동의합니다</p>
                        <div className="sp-cb-version">v2025-01 · {data.consents.privacyAgreedAt} 동의</div>
                      </div>
                    </div>

                    <div className="sp-consent-item updatable">
                      <button
                        className={`sp-consent-check${aiDataDraft ? " checked" : " unchecked"}`}
                        onClick={() => setAiDataDraft(!aiDataDraft)}
                      >
                        {aiDataDraft ? "✓" : "+"}
                      </button>
                      <div style={{ flex: 1 }}>
                        <div className="sp-cb-title-row">
                          <span className="sp-cb-title">AI 학습 데이터 활용 동의</span>
                          <span className="sp-cb-optional">(선택)</span>
                        </div>
                        <p className="sp-cb-desc">
                          면접 영상·음성 데이터를 AI 모델 개선에 활용하는 것에 동의합니다. 동의 시 서비스 품질 향상에 기여하며 추가 스트릭 보상을 받을 수 있어요.
                        </p>
                        <div className="sp-cb-version new">⚠ v2025-03 업데이트 · 재동의 필요</div>
                      </div>
                    </div>
                  </div>

                  <div className="sp-card">
                    <div className="sp-card-title" style={{ color: "#EF4444" }}>⚠ 위험 구역</div>
                    <div className="sp-danger-zone">
                      <div className="sp-dz-item">
                        <div>
                          <div className="sp-dz-t">모든 면접 데이터 삭제</div>
                          <div className="sp-dz-d">저장된 면접 세션, 리포트, 답변 내역이 영구 삭제됩니다</div>
                        </div>
                        <button className="sp-btn-danger" onClick={() => setDeleteConfirm("data")}>데이터 삭제</button>
                      </div>
                      <div className="sp-dz-item">
                        <div>
                          <div className="sp-dz-t">계정 탈퇴</div>
                          <div className="sp-dz-d">계정과 모든 데이터가 영구 삭제됩니다. 이 작업은 되돌릴 수 없습니다</div>
                        </div>
                        <button className="sp-btn-danger critical" onClick={() => setDeleteConfirm("account")}>계정 탈퇴</button>
                      </div>
                    </div>
                  </div>

                  <div className="sp-action-row">
                    {saveMessage && activePanel === "consent" && <span className="sp-save-msg">✓ {saveMessage}</span>}
                    {error && activePanel === "consent" && <span className="sp-err-msg">✕ {error}</span>}
                    <button className="sp-btn-cancel" onClick={() => setAiDataDraft(data.consents.aiDataAgreed)}>취소</button>
                    <button className="sp-btn-save" onClick={saveConsents} disabled={saving}>
                      {saving ? <span className="sp-spinner" /> : <span>저장하기</span>}
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
        <div className="sp-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sp-modal-title">
              {deleteConfirm === "data" ? "면접 데이터를 삭제하시겠습니까?" : "정말로 계정을 탈퇴하시겠습니까?"}
            </div>
            <p className="sp-modal-desc">
              {deleteConfirm === "data"
                ? "저장된 모든 면접 세션, 리포트, 답변 내역이 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다."
                : "계정과 연결된 모든 데이터가 즉시 삭제됩니다. 탈퇴 후에는 복구가 불가능합니다."}
            </p>
            <div className="sp-modal-btns">
              <button className="sp-modal-cancel" onClick={() => setDeleteConfirm(null)}>취소</button>
              <button className="sp-modal-confirm" onClick={handleDeleteConfirm} disabled={saving}>
                {saving ? "처리 중..." : deleteConfirm === "data" ? "삭제하기" : "탈퇴하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
