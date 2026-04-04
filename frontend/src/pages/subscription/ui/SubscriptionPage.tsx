import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useSubscriptionStore } from "@/features/subscription";

/* ── Feature comparison rows ── */
const COMPARE_ROWS: {
  icon: string;
  label: string;
  free: "yes" | "no" | string;
  pro: "yes" | string;
}[] = [
  { icon: "🎥", label: "꼬리질문 방식 면접",     free: "yes",      pro: "yes"       },
  { icon: "🎬", label: "전체 프로세스 방식 면접", free: "no",       pro: "yes"       },
  { icon: "📄", label: "이력서 등록",             free: "최대 3개",  pro: "무제한"    },
  { icon: "🏢", label: "채용공고 등록",           free: "최대 5개",  pro: "무제한"    },
  { icon: "📊", label: "AI 리뷰 리포트",          free: "기본",      pro: "상세 + PDF"},
  { icon: "👁️", label: "시선 추적 분석",         free: "no",        pro: "yes"       },
  { icon: "⚡", label: "실전 모드",               free: "no",        pro: "yes"       },
  { icon: "🤫", label: "침묵 감지 분석",          free: "횟수만",    pro: "상세 분석" },
  { icon: "🗂️", label: "면접 세션 아카이브",     free: "최근 10개", pro: "전체"      },
  { icon: "🔥", label: "스트릭 & 보상",           free: "yes",       pro: "yes"       },
  { icon: "💬", label: "고객 지원",               free: "이메일",    pro: "우선 지원" },
];

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "무료 체험 후 자동으로 결제되나요?",
    a: "7일 무료 체험 기간이 끝나면 선택하신 요금제로 자동 결제됩니다. 체험 기간 중 언제든 마이페이지 → 요금제에서 취소할 수 있으며, 취소 시 과금되지 않습니다.",
  },
  {
    q: "스트릭 보상으로 받은 기능은 Pro 구독 없이도 쓸 수 있나요?",
    a: "네! 스트릭 보상으로 지급된 기능 사용권(시선 추적, 실전 모드 등)은 구독 여부와 관계없이 지급된 횟수만큼 자유롭게 사용할 수 있습니다.",
  },
  {
    q: "중간에 요금제를 취소하면 데이터가 삭제되나요?",
    a: "구독을 취소해도 기존에 저장된 이력서, 면접 리포트, 스트릭 기록은 삭제되지 않습니다. 다만 이력서·채용공고가 Free 한도(각 3개, 5개)를 초과한 경우 초과분은 접근이 제한됩니다.",
  },
  {
    q: "연간 결제 시 환불이 가능한가요?",
    a: "결제일로부터 7일 이내에 고객센터로 문의하시면 전액 환불해드립니다. 7일 이후에는 잔여 기간에 대한 비례 환불이 적용됩니다.",
  },
  {
    q: "법인 세금계산서 발행이 가능한가요?",
    a: "가능합니다. 결제 완료 후 고객센터(support@mefit.kr)로 사업자등록번호와 이메일을 보내주시면 세금계산서를 발행해드립니다.",
  },
];

const SUB_STYLES = `
        /* ── RESET ── */
        .sub-wrap *, .sub-wrap *::before, .sub-wrap *::after { box-sizing: border-box; }
        :root {
          --sc: 0 1px 3px rgba(0,0,0,.08), 0 4px 16px rgba(0,0,0,.06);
          --sc-hover: 0 2px 8px rgba(0,0,0,.1), 0 8px 24px rgba(0,0,0,.08);
        }

        /* ── NAV ── */
        .sub-nav {
          position: sticky; top: 0; z-index: 200;
          background: rgba(255,255,255,.92);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid #E5E7EB;
          height: 60px; display: flex; align-items: center; padding: 0 32px; gap: 12px;
        }
        .sub-nav-logo {
          font-family: 'Inter', sans-serif; font-size: 20px; font-weight: 900;
          color: #0A0A0A; text-decoration: none; letter-spacing: -.4px; margin-right: auto;
        }
        .sub-nav-logo .hi { color: #0991B2; }
        .sub-nav-back {
          font-size: 13px; font-weight: 600; color: #6B7280;
          text-decoration: none; padding: 6px 12px; border-radius: 8px;
          transition: color .15s, background .15s;
        }
        .sub-nav-back:hover { color: #0A0A0A; background: #F9FAFB; }

        /* ── PAGE ── */
        .sub-page { background: #FFFFFF; min-height: calc(100vh - 60px); padding-bottom: 80px; }
        .sub-inner { max-width: 900px; margin: 0 auto; padding: 0 32px; }

        /* ── ANIMATIONS ── */
        @keyframes subFadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes subSlideDown { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes subBreathe { 0%,100% { transform:scale(1); } 50% { transform:scale(1.06); } }
        @keyframes subShimmer { 0% { background-position:200% 0; } 100% { background-position:-200% 0; } }
        .sub-rv { opacity:0; transform:translateY(16px); transition:opacity .45s ease, transform .45s ease; }
        .sub-rv-in { opacity:1; transform:translateY(0); }

        /* ── SKELETON ── */
        .sub-skeleton {
          background: linear-gradient(90deg, #F3F4F6 25%, #E9EAEC 50%, #F3F4F6 75%);
          background-size: 200% 100%; animation: subShimmer 1.4s infinite; border-radius: 8px;
        }

        /* ── PAGE HEADER ── */
        .sub-header {
          text-align: center; padding: 52px 0 44px;
          animation: subFadeUp .45s ease both;
        }
        .sub-eyebrow {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase;
          color: #0991B2; background: #E6F7FA; padding: 4px 12px; border-radius: 100px;
          margin-bottom: 16px; font-family: 'Inter', sans-serif;
        }
        .sub-title {
          font-family: 'Inter', sans-serif;
          font-size: clamp(32px, 5vw, 52px); font-weight: 900;
          letter-spacing: -2px; line-height: 1.05; color: #0A0A0A;
          margin-bottom: 14px;
        }
        .sub-subtitle {
          font-size: 16px; color: #6B7280; line-height: 1.65;
          max-width: 480px; margin: 0 auto 32px; font-family: 'Inter', sans-serif;
        }

        /* ── BILLING TOGGLE ── */
        .sub-billing-wrap {
          display: flex; align-items: center; justify-content: center; gap: 12px;
        }
        .sub-bill-label {
          font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600;
          color: #9CA3AF; transition: color .2s; cursor: pointer;
        }
        .sub-bill-label.active { color: #0A0A0A; font-weight: 700; }
        .sub-toggle-track {
          width: 52px; height: 28px; border-radius: 100px;
          background: #E5E7EB; cursor: pointer; position: relative;
          transition: background .25s; flex-shrink: 0; border: none;
        }
        .sub-toggle-track.on { background: #0991B2; }
        .sub-toggle-knob {
          position: absolute; top: 3px; left: 3px;
          width: 22px; height: 22px; border-radius: 50%; background: #fff;
          box-shadow: 0 1px 4px rgba(0,0,0,.15);
          transition: transform .3s cubic-bezier(.34,1.56,.64,1);
        }
        .sub-toggle-track.on .sub-toggle-knob { transform: translateX(24px); }
        .sub-save-chip {
          display: inline-flex; align-items: center; gap: 3px;
          font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 800;
          color: #fff; background: #059669; padding: 2px 8px; border-radius: 100px; margin-left: 2px;
        }

        /* ── CURRENT PLAN BANNER ── */
        .sub-current-banner {
          display: flex; align-items: center; gap: 10px;
          background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px;
          padding: 12px 20px; max-width: 600px; margin: 0 auto 44px;
          box-shadow: var(--sc); animation: subFadeUp .45s ease .08s both;
        }
        .sub-cb-dot {
          width: 9px; height: 9px; border-radius: 50%;
          background: #059669; box-shadow: 0 0 0 3px rgba(5,150,105,.15);
          flex-shrink: 0; animation: subBreathe 2.5s ease-in-out infinite;
        }
        .sub-cb-text {
          font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600; color: #0A0A0A;
        }
        .sub-cb-text span { color: #0991B2; font-weight: 700; }
        .sub-cb-upgrade {
          margin-left: auto; font-family: 'Inter', sans-serif;
          font-size: 12px; font-weight: 700; color: #0991B2;
          background: #E6F7FA; padding: 5px 12px; border-radius: 8px;
          text-decoration: none; transition: background .15s; white-space: nowrap;
          border: none; cursor: pointer;
        }
        .sub-cb-upgrade:hover { background: rgba(9,145,178,.18); }

        /* ── PLAN CARDS ── */
        .sub-plans-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 20px;
          max-width: 820px; margin: 0 auto 56px;
          animation: subFadeUp .45s ease .12s both;
        }
        .sub-pcard {
          border-radius: 16px; padding: 40px 36px;
          position: relative; overflow: hidden; transition: all .3s;
        }
        /* FREE */
        .sub-pcard-free {
          background: #F9FAFB; border: 1px solid #E5E7EB; box-shadow: var(--sc);
        }
        .sub-pcard-free:hover { box-shadow: var(--sc-hover); transform: translateY(-4px); }
        /* PRO */
        .sub-pcard-pro {
          background: #0A0A0A; color: #fff;
          box-shadow: 0 8px 32px rgba(0,0,0,.22), 0 24px 56px rgba(0,0,0,.14);
          transform: translateY(-4px);
        }
        .sub-pcard-pro:hover { transform: translateY(-8px); box-shadow: 0 12px 48px rgba(0,0,0,.3), 0 32px 72px rgba(0,0,0,.18); }

        .sub-pcard-deco1 {
          position: absolute; width: 240px; height: 240px;
          background: rgba(9,145,178,.1); filter: blur(70px); border-radius: 50%;
          top: -80px; right: -60px; pointer-events: none;
        }
        .sub-pcard-deco2 {
          position: absolute; width: 140px; height: 140px;
          background: rgba(6,182,212,.08); filter: blur(50px); border-radius: 50%;
          bottom: -40px; left: -30px; pointer-events: none;
        }

        .sub-rec {
          position: absolute; top: 0; right: 32px;
          background: #0991B2; color: #fff;
          font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 800;
          padding: 5px 14px; border-radius: 0 0 10px 10px;
          letter-spacing: .5px; text-transform: uppercase;
        }

        .sub-p-type-row { display: flex; align-items: center; gap: 8px; margin-bottom: 18px; }
        .sub-p-type {
          font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 700;
          letter-spacing: .7px; text-transform: uppercase; color: #6B7280;
        }
        .sub-pcard-pro .sub-p-type { color: rgba(255,255,255,.4); }
        .sub-p-current-chip {
          font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 800;
          color: #059669; background: rgba(5,150,105,.1); padding: 2px 8px;
          border-radius: 100px; letter-spacing: .4px;
        }

        .sub-p-price-row { display: flex; align-items: flex-end; gap: 3px; margin-bottom: 4px; }
        .sub-p-price {
          font-family: 'Inter', sans-serif; font-size: 56px; font-weight: 900;
          letter-spacing: -3px; line-height: 1; color: #0A0A0A;
        }
        .sub-pcard-pro .sub-p-price { color: #fff; }
        .sub-p-unit {
          font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 700;
          color: #9CA3AF; padding-bottom: 8px;
        }
        .sub-pcard-pro .sub-p-unit { color: rgba(255,255,255,.35); }
        .sub-p-original {
          font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600;
          color: #9CA3AF; text-decoration: line-through; padding-bottom: 8px; margin-left: 2px;
        }
        .sub-p-period {
          font-family: 'Inter', sans-serif; font-size: 12px; color: #9CA3AF; margin-bottom: 28px; min-height: 18px;
        }
        .sub-pcard-pro .sub-p-period { color: rgba(255,255,255,.3); }

        .sub-p-feats { list-style: none; display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px; }
        .sub-p-feats li {
          display: flex; align-items: flex-start; gap: 9px;
          font-family: 'Inter', sans-serif; font-size: 13px; color: #374151; line-height: 1.4;
        }
        .sub-pcard-pro .sub-p-feats li { color: rgba(255,255,255,.8); }
        .sub-p-feats li.off { opacity: .35; }
        .sub-ck {
          width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 8px; font-weight: 800; margin-top: 1px;
        }
        .sub-ck-on { background: #059669; color: #fff; }
        .sub-ck-pro { background: #0991B2; color: #fff; }
        .sub-ck-off { background: #E5E7EB; color: #9CA3AF; }

        /* Plan Buttons */
        .sub-btn-free {
          display: flex; align-items: center; justify-content: center; width: 100%;
          font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 700;
          color: #0991B2; background: #E6F7FA;
          border: 1.5px solid rgba(9,145,178,.25); border-radius: 10px;
          padding: 14px; cursor: pointer; transition: all .15s;
        }
        .sub-btn-free:hover { background: rgba(9,145,178,.15); }
        .sub-btn-free:disabled { opacity: .55; cursor: not-allowed; }
        .sub-btn-pro {
          display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%;
          font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 700;
          color: #0A0A0A; background: #fff; border: none; border-radius: 10px;
          padding: 14px; cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,.12);
          transition: all .15s;
        }
        .sub-btn-pro:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,.18); }
        .sub-btn-pro:disabled { opacity: .6; cursor: not-allowed; transform: none; }
        .sub-btn-spinner {
          width: 14px; height: 14px; border: 2px solid rgba(10,10,10,.25);
          border-top-color: #0A0A0A; border-radius: 50%; animation: subSpin .6s linear infinite;
        }
        .sub-pcard-pro .sub-btn-spinner { border-color: rgba(255,255,255,.25); border-top-color: #fff; }
        @keyframes subSpin { to { transform: rotate(360deg); } }
        .sub-p-note {
          font-family: 'Inter', sans-serif; font-size: 11px; color: #9CA3AF;
          margin-top: 8px; text-align: center; min-height: 16px;
        }
        .sub-pcard-pro .sub-p-note { color: rgba(255,255,255,.25); }

        /* ── TOAST ── */
        .sub-toast {
          position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
          z-index: 300; display: flex; align-items: center; gap: 8px;
          background: #0A0A0A; color: #fff; border-radius: 10px; padding: 12px 20px;
          font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600;
          box-shadow: 0 4px 20px rgba(0,0,0,.2); animation: subFadeUp .3s ease;
          white-space: nowrap;
        }
        .sub-toast-err { background: #EF4444; }

        /* ── COMPARE TABLE ── */
        .sub-compare { max-width: 820px; margin: 0 auto 52px; }
        .sub-compare-title {
          font-family: 'Inter', sans-serif; font-size: 24px; font-weight: 900;
          letter-spacing: -.4px; margin-bottom: 18px; text-align: center; color: #0A0A0A;
        }
        .sub-table {
          background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px;
          overflow: hidden; box-shadow: var(--sc);
        }
        .sub-tbl-head {
          display: grid; grid-template-columns: 1fr 130px 130px;
          background: #FFFFFF; padding: 14px 24px;
          border-bottom: 1px solid #E5E7EB;
        }
        .sub-tbl-hlabel {
          font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 700;
          color: #9CA3AF; letter-spacing: .5px; text-transform: uppercase;
        }
        .sub-tbl-hplan {
          font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 900;
          text-align: center; color: #0A0A0A;
        }
        .sub-tbl-hplan-pro {
          color: #fff; background: #0991B2; border-radius: 8px; padding: 4px 10px;
        }
        .sub-tbl-row {
          display: grid; grid-template-columns: 1fr 130px 130px;
          padding: 12px 24px; border-bottom: 1px solid #E5E7EB;
          transition: background .15s;
        }
        .sub-tbl-row:last-child { border-bottom: none; }
        .sub-tbl-row:hover { background: rgba(9,145,178,.03); }
        .sub-tbl-feat {
          display: flex; align-items: center; gap: 8px;
          font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600; color: #0A0A0A;
        }
        .sub-tbl-icon { font-size: 14px; width: 20px; }
        .sub-tbl-val {
          text-align: center; font-family: 'Inter', sans-serif;
          font-size: 12px; font-weight: 600; color: #6B7280;
          display: flex; align-items: center; justify-content: center;
        }
        .sub-tbl-val-pro { color: #0991B2; font-weight: 700; }
        .sub-tbl-ck {
          width: 20px; height: 20px; border-radius: 50%;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 9px; font-weight: 800;
        }
        .sub-tbl-ck-yes { background: #059669; color: #fff; }
        .sub-tbl-ck-pro { background: #0991B2; color: #fff; }
        .sub-tbl-ck-no { background: #E5E7EB; color: #9CA3AF; }

        /* ── PAYMENT METHODS ── */
        .sub-pay { max-width: 820px; margin: 0 auto 48px; text-align: center; }
        .sub-pay-title {
          font-family: 'Inter', sans-serif; font-size: 20px; font-weight: 900;
          letter-spacing: -.3px; margin-bottom: 6px; color: #0A0A0A;
        }
        .sub-pay-sub { font-family: 'Inter', sans-serif; font-size: 13px; color: #6B7280; margin-bottom: 20px; }
        .sub-pay-methods { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .sub-pay-card {
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px;
          padding: 18px 22px; box-shadow: var(--sc);
          transition: all .2s; cursor: pointer; min-width: 120px;
        }
        .sub-pay-card:hover { box-shadow: var(--sc-hover); transform: translateY(-3px); border-color: rgba(9,145,178,.3); }
        .sub-pay-emoji { font-size: 26px; }
        .sub-pay-name { font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 800; color: #0A0A0A; }
        .sub-pay-share { font-family: 'Inter', sans-serif; font-size: 11px; color: #6B7280; font-weight: 600; }

        /* ── TRUST ROW ── */
        .sub-trust {
          display: flex; align-items: center; justify-content: center;
          gap: 28px; flex-wrap: wrap; max-width: 680px; margin: 0 auto 52px;
        }
        .sub-trust-item {
          display: flex; align-items: center; gap: 7px;
          font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600; color: #6B7280;
        }
        .sub-trust-item span { font-size: 16px; }

        /* ── FAQ ── */
        .sub-faq { max-width: 640px; margin: 0 auto 56px; }
        .sub-faq-title {
          font-family: 'Inter', sans-serif; font-size: 22px; font-weight: 900;
          letter-spacing: -.3px; margin-bottom: 20px; text-align: center; color: #0A0A0A;
        }
        .sub-faq-item {
          background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px;
          margin-bottom: 8px; overflow: hidden; transition: box-shadow .2s;
        }
        .sub-faq-item.open { box-shadow: var(--sc-hover); border-color: rgba(9,145,178,.2); }
        .sub-faq-q {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px; cursor: pointer;
          font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 700; color: #0A0A0A;
          gap: 12px; background: none; border: none; width: 100%; text-align: left;
        }
        .sub-faq-q:hover { background: rgba(9,145,178,.03); }
        .sub-faq-chevron {
          font-size: 11px; color: #0991B2; transition: transform .25s; flex-shrink: 0;
        }
        .sub-faq-item.open .sub-faq-chevron { transform: rotate(180deg); }
        .sub-faq-a {
          padding: 0 20px 16px;
          font-family: 'Inter', sans-serif; font-size: 13px; color: #6B7280;
          line-height: 1.7; animation: subSlideDown .2s ease;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 700px) {
          .sub-nav { padding: 0 16px; }
          .sub-inner { padding: 0 16px; }
          .sub-plans-grid { grid-template-columns: 1fr; max-width: 420px; margin-left: auto; margin-right: auto; }
          .sub-pcard-pro { transform: none; }
          .sub-pcard { padding: 28px 22px; }
          .sub-tbl-head, .sub-tbl-row { grid-template-columns: 1fr 90px 90px; padding: 10px 14px; }
          .sub-pay-methods { gap: 8px; }
          .sub-pay-card { min-width: 100px; padding: 14px 14px; }
          .sub-trust { gap: 14px; }
          .sub-header { padding: 36px 0 32px; }
        }
      `;

export function SubscriptionPage() {
  const {
    status, loading, processing, error, successMessage,
    billingCycle, openFaqIndex, redirectUrl,
    fetchStatus, toggleBilling, checkout, cancelSubscription,
    toggleFaq, clearMessages, clearRedirectUrl,
  } = useSubscriptionStore();

  const proCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (successMessage || error) {
      const t = setTimeout(clearMessages, 4000);
      return () => clearTimeout(t);
    }
  }, [successMessage, error, clearMessages]);

  useEffect(() => {
    if (redirectUrl) {
      clearRedirectUrl();
      window.location.href = redirectUrl;
    }
  }, [redirectUrl, clearRedirectUrl]);

  const isYearly = billingCycle === "yearly";
  const monthlyPrice = isYearly ? "₩7,900" : "₩9,900";
  const originalPrice = "₩9,900";
  const periodText = isYearly
    ? "연간 결제 (₩94,800/년) · 언제든 취소"
    : "월간 결제 · 언제든 취소 가능";
  const proNote = isYearly
    ? "첫 7일 무료 체험 · 20% 절약"
    : "첫 7일 무료 체험 · 이후 자동 결제";
  const proBtnText = isYearly ? "Pro 연간 결제 시작" : "Pro 시작하기";

  const isPro = status?.currentPlan === "pro";

  const scrollToPro = (e: React.MouseEvent) => {
    e.preventDefault();
    proCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <>
      <style>{SUB_STYLES}</style>

      <div className="sub-wrap">
        {/* NAV */}
        <nav className="sub-nav">
          <Link to="/home" className="sub-nav-logo">me<span className="hi">Fit</span></Link>
          <Link to="/home" className="sub-nav-back">← 홈으로</Link>
        </nav>

        <div className="sub-page">
          <div className="sub-inner">

            {/* PAGE HEADER */}
            <div className="sub-header">
              <div className="sub-eyebrow">💎 요금제</div>
              <h1 className="sub-title">
                나에게 맞는 플랜을<br />선택하세요
              </h1>
              <p className="sub-subtitle">
                숨겨진 비용 없이, 언제든 취소 가능합니다.<br />
                스트릭 보상으로 Pro 기능을 무료로 체험해보세요.
              </p>

              {/* BILLING TOGGLE */}
              <div className="sub-billing-wrap">
                <span
                  className={`sub-bill-label${!isYearly ? " active" : ""}`}
                  onClick={() => !isYearly || toggleBilling()}
                  style={{ cursor: "pointer" }}
                >
                  월간 결제
                </span>
                <button
                  className={`sub-toggle-track${isYearly ? " on" : ""}`}
                  onClick={toggleBilling}
                  aria-label="결제 주기 전환"
                >
                  <div className="sub-toggle-knob" />
                </button>
                <span
                  className={`sub-bill-label${isYearly ? " active" : ""}`}
                  onClick={() => isYearly || toggleBilling()}
                  style={{ cursor: "pointer" }}
                >
                  연간 결제
                  <span className="sub-save-chip">20% 절약</span>
                </span>
              </div>
            </div>

            {/* CURRENT PLAN BANNER */}
            {!loading && status && (
              <div className="sub-current-banner">
                <div className="sub-cb-dot" />
                <span className="sub-cb-text">
                  현재 <span>{status.currentPlan === "pro" ? "Pro" : "Free"} 플랜</span>을 이용 중입니다
                </span>
                {!isPro && (
                  <button className="sub-cb-upgrade" onClick={scrollToPro}>
                    Pro 업그레이드 →
                  </button>
                )}
              </div>
            )}

            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 48 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 820, margin: "0 auto", width: "100%" }}>
                  <div className="sub-skeleton" style={{ height: 500 }} />
                  <div className="sub-skeleton" style={{ height: 500 }} />
                </div>
              </div>
            ) : (
              <>
                {/* PLAN CARDS */}
                <div className="sub-plans-grid">
                  {/* FREE CARD */}
                  <div className="sub-pcard sub-pcard-free">
                    <div className="sub-p-type-row">
                      <span className="sub-p-type">Free</span>
                      {!isPro && <span className="sub-p-current-chip">현재 플랜</span>}
                    </div>
                    <div className="sub-p-price-row">
                      <span className="sub-p-price">₩0</span>
                    </div>
                    <p className="sub-p-period">영구 무료 · 신용카드 불필요</p>
                    <ul className="sub-p-feats">
                      {[
                        [true,  "꼬리질문 방식 면접"],
                        [true,  "기본 AI 리뷰 리포트"],
                        [true,  "이력서 최대 3개"],
                        [true,  "채용공고 최대 5개"],
                        [true,  "스트릭 적립 & 보상 수령"],
                        [false, "전체 프로세스 방식 면접"],
                        [false, "시선 추적 분석"],
                        [false, "실전 모드"],
                        [false, "상세 리포트 PDF 저장"],
                      ].map(([on, label], i) => (
                        <li key={i} className={on ? "" : "off"}>
                          <span className={`sub-ck ${on ? "sub-ck-on" : "sub-ck-off"}`}>
                            {on ? "✓" : "✕"}
                          </span>
                          {label as string}
                        </li>
                      ))}
                    </ul>
                    <button className="sub-btn-free" disabled={!isPro}>
                      {isPro ? "Free로 다운그레이드" : "현재 이용 중"}
                    </button>
                    <p className="sub-p-note">기본 기능 무료 제공</p>
                  </div>

                  {/* PRO CARD */}
                  <div className="sub-pcard sub-pcard-pro" ref={proCardRef}>
                    <div className="sub-pcard-deco1" />
                    <div className="sub-pcard-deco2" />
                    <div className="sub-rec">추천</div>
                    <div className="sub-p-type-row">
                      <span className="sub-p-type">Pro</span>
                      {isPro && <span className="sub-p-current-chip">현재 플랜</span>}
                    </div>
                    <div className="sub-p-price-row">
                      <span className="sub-p-price">{monthlyPrice}</span>
                      <span className="sub-p-unit">/월</span>
                      {isYearly && (
                        <span className="sub-p-original">{originalPrice}</span>
                      )}
                    </div>
                    <p className="sub-p-period">{periodText}</p>
                    <ul className="sub-p-feats">
                      {[
                        "Free의 모든 기능 포함",
                        "이력서·채용공고 무제한",
                        "전체 프로세스 방식 면접",
                        "시선 추적 분석 (분당 이탈 횟수)",
                        "실전 모드 (긴장감 업)",
                        "상세 리포트 PDF 저장",
                        "침묵 감지 상세 분석",
                        "면접 세션 전체 아카이브",
                        "우선 고객 지원",
                      ].map((label, i) => (
                        <li key={i}>
                          <span className="sub-ck sub-ck-pro">✓</span>
                          {label}
                        </li>
                      ))}
                    </ul>
                    <button
                      className="sub-btn-pro"
                      onClick={isPro ? cancelSubscription : checkout}
                      disabled={processing}
                    >
                      {processing ? (
                        <span className="sub-btn-spinner" />
                      ) : isPro ? (
                        "구독 취소"
                      ) : (
                        <>
                          <span>{proBtnText}</span>
                          <span>→</span>
                        </>
                      )}
                    </button>
                    <p className="sub-p-note">{isPro ? "다음 결제일: " + (status?.nextBillingDate ?? "—") : proNote}</p>
                  </div>
                </div>

                {/* FEATURE COMPARISON */}
                <div className={`sub-compare sub-rv sub-rv-in`} style={{ transitionDelay: "60ms" }}>
                  <h2 className="sub-compare-title">상세 기능 비교</h2>
                  <div className="sub-table">
                    <div className="sub-tbl-head">
                      <div className="sub-tbl-hlabel">기능</div>
                      <div className="sub-tbl-hplan">Free</div>
                      <div className="sub-tbl-hplan sub-tbl-hplan-pro">Pro</div>
                    </div>
                    {COMPARE_ROWS.map((row, i) => (
                      <div key={i} className="sub-tbl-row">
                        <div className="sub-tbl-feat">
                          <span className="sub-tbl-icon">{row.icon}</span>
                          {row.label}
                        </div>
                        <div className="sub-tbl-val">
                          {row.free === "yes" ? (
                            <span className="sub-tbl-ck sub-tbl-ck-yes">✓</span>
                          ) : row.free === "no" ? (
                            <span className="sub-tbl-ck sub-tbl-ck-no">✕</span>
                          ) : (
                            row.free
                          )}
                        </div>
                        <div className="sub-tbl-val sub-tbl-val-pro">
                          {row.pro === "yes" ? (
                            <span className="sub-tbl-ck sub-tbl-ck-pro">✓</span>
                          ) : (
                            row.pro
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PAYMENT METHODS */}
                <div className={`sub-pay sub-rv sub-rv-in`} style={{ transitionDelay: "100ms" }}>
                  <h2 className="sub-pay-title">결제 수단</h2>
                  <p className="sub-pay-sub">익숙한 방법으로 간편하게 결제하세요</p>
                  <div className="sub-pay-methods">
                    {[
                      { emoji: "💚", name: "네이버페이",    share: "51.5%" },
                      { emoji: "💛", name: "카카오페이",    share: "25.1%" },
                      { emoji: "💙", name: "토스페이",      share: "13.2%" },
                      { emoji: "💳", name: "신용·체크카드", share: "기타"  },
                    ].map((pm) => (
                      <div key={pm.name} className="sub-pay-card">
                        <span className="sub-pay-emoji">{pm.emoji}</span>
                        <span className="sub-pay-name">{pm.name}</span>
                        <span className="sub-pay-share">{pm.share}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* TRUST ROW */}
                <div className={`sub-trust sub-rv sub-rv-in`} style={{ transitionDelay: "130ms" }}>
                  {[
                    { icon: "🔒", text: "SSL 암호화 결제" },
                    { icon: "↩️", text: "언제든 취소"     },
                    { icon: "🎁", text: "첫 7일 무료"     },
                    { icon: "🧾", text: "세금계산서 발행" },
                    { icon: "🛡️", text: "개인정보 보호"  },
                  ].map((t) => (
                    <div key={t.text} className="sub-trust-item">
                      <span>{t.icon}</span> {t.text}
                    </div>
                  ))}
                </div>

                {/* FAQ */}
                <div className={`sub-faq sub-rv sub-rv-in`} style={{ transitionDelay: "160ms" }}>
                  <h2 className="sub-faq-title">자주 묻는 질문</h2>
                  {FAQ_ITEMS.map((item, i) => (
                    <div
                      key={i}
                      className={`sub-faq-item${openFaqIndex === i ? " open" : ""}`}
                    >
                      <button
                        className="sub-faq-q"
                        onClick={() => toggleFaq(i)}
                      >
                        {item.q}
                        <span className="sub-faq-chevron">▼</span>
                      </button>
                      {openFaqIndex === i && (
                        <div className="sub-faq-a">{item.a}</div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* TOAST */}
      {successMessage && (
        <div className="sub-toast">✓ {successMessage}</div>
      )}
      {error && (
        <div className="sub-toast sub-toast-err">✕ {error}</div>
      )}
    </>
  );
}
