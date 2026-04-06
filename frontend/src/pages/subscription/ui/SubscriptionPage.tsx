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
      {/* NAV */}
      <nav className="sticky top-0 z-[200] bg-[rgba(255,255,255,.92)] backdrop-blur-[20px] border-b border-[#E5E7EB] h-[60px] flex items-center px-4 sm:px-8 gap-3">
        <Link
          to="/home"
          className="text-xl font-black text-[#0A0A0A] no-underline tracking-[-0.4px] mr-auto"
        >
          me<span className="text-[#0991B2]">Fit</span>
        </Link>
        <Link
          to="/home"
          className="text-[13px] font-semibold text-[#6B7280] no-underline px-3 py-1.5 rounded-lg transition-[color,background] hover:text-[#0A0A0A] hover:bg-[#F9FAFB]"
        >
          ← 홈으로
        </Link>
      </nav>

      <div className="bg-white min-h-[calc(100vh-60px)] pb-20">
        <div className="max-w-[900px] mx-auto px-4 sm:px-8">

          {/* PAGE HEADER */}
          <div className="text-center pt-9 sm:pt-[52px] pb-8 sm:pb-11 animate-[subFadeUp_.45s_ease_both]">
            <div className="inline-flex items-center gap-[5px] text-[11px] font-bold tracking-[1.2px] uppercase text-[#0991B2] bg-[#E6F7FA] px-3 py-1 rounded-full mb-4">
              💎 요금제
            </div>
            <h1 className="text-[clamp(32px,5vw,52px)] font-black tracking-[-2px] leading-[1.05] text-[#0A0A0A] mb-[14px]">
              나에게 맞는 플랜을<br />선택하세요
            </h1>
            <p className="text-base text-[#6B7280] leading-[1.65] max-w-content mx-auto mb-8">
              숨겨진 비용 없이, 언제든 취소 가능합니다.<br />
              스트릭 보상으로 Pro 기능을 무료로 체험해보세요.
            </p>

            {/* BILLING TOGGLE */}
            <div className="flex items-center justify-center gap-3">
              <span
                className={`text-sm font-${!isYearly ? "bold text-[#0A0A0A]" : "semibold text-[#9CA3AF]"} transition-colors cursor-pointer`}
                onClick={() => !isYearly || toggleBilling()}
              >
                월간 결제
              </span>
              <button
                className="w-[52px] h-7 rounded-full border-none cursor-pointer relative flex-shrink-0 transition-[background] duration-[250ms]"
                style={{ background: isYearly ? "#0991B2" : "#E5E7EB" }}
                onClick={toggleBilling}
                aria-label="결제 주기 전환"
              >
                <div
                  className="absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,.15)] transition-transform duration-300"
                  style={{
                    transform: isYearly ? "translateX(27px)" : "translateX(3px)",
                    transitionTimingFunction: "cubic-bezier(.34,1.56,.64,1)",
                  }}
                />
              </button>
              <span
                className={`text-sm font-${isYearly ? "bold text-[#0A0A0A]" : "semibold text-[#9CA3AF]"} transition-colors cursor-pointer`}
                onClick={() => isYearly || toggleBilling()}
              >
                연간 결제
                <span className="inline-flex items-center gap-[3px] text-[11px] font-extrabold text-white bg-[#059669] px-2 py-[2px] rounded-full ml-[6px]">
                  20% 절약
                </span>
              </span>
            </div>
          </div>

          {/* CURRENT PLAN BANNER */}
          {!loading && status && (
            <div className="flex items-center gap-[10px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-5 py-3 max-w-[600px] mx-auto mb-11 shadow-[var(--sc)] animate-[subFadeUp_.45s_ease_.08s_both]">
              <div className="w-[9px] h-[9px] rounded-full bg-[#059669] shadow-[0_0_0_3px_rgba(5,150,105,.15)] flex-shrink-0 animate-[subBreathe_2.5s_ease-in-out_infinite]" />
              <span className="text-sm font-semibold text-[#0A0A0A]">
                현재 <span className="text-[#0991B2] font-bold">{status.currentPlan === "pro" ? "Pro" : "Free"} 플랜</span>을 이용 중입니다
              </span>
              {!isPro && (
                <button
                  className="ml-auto text-xs font-bold text-[#0991B2] bg-[#E6F7FA] px-3 py-[5px] rounded-lg border-none cursor-pointer transition-[background] whitespace-nowrap hover:bg-[rgba(9,145,178,.18)]"
                  onClick={scrollToPro}
                >
                  Pro 업그레이드 →
                </button>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col gap-4 mb-12">
              <div className="grid grid-cols-2 gap-5 max-w-container-md mx-auto w-full">
                <div className="h-[500px] rounded-lg skeleton-shimmer" />
                <div className="h-[500px] rounded-lg skeleton-shimmer" />
              </div>
            </div>
          ) : (
            <>
              {/* PLAN CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-container-md mx-auto mb-14 animate-[subFadeUp_.45s_ease_.12s_both]">

                {/* FREE CARD */}
                <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl p-7 sm:p-9 relative overflow-hidden transition-all duration-300 shadow-[var(--sc)] hover:shadow-[var(--sc-hover)] hover:-translate-y-1">
                  <div className="flex items-center gap-2 mb-[18px]">
                    <span className="text-xs font-bold tracking-[.7px] uppercase text-[#6B7280]">Free</span>
                    {!isPro && (
                      <span className="text-[10px] font-extrabold text-[#059669] bg-[rgba(5,150,105,.1)] px-2 py-[2px] rounded-full tracking-[.4px]">
                        현재 플랜
                      </span>
                    )}
                  </div>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-[56px] font-black tracking-[-3px] leading-none text-[#0A0A0A]">₩0</span>
                  </div>
                  <p className="text-xs text-[#9CA3AF] mb-7 min-h-[18px]">영구 무료 · 신용카드 불필요</p>
                  <ul className="list-none flex flex-col gap-[10px] mb-7">
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
                      <li key={i} className={`flex items-start gap-[9px] text-[13px] text-[#374151] leading-[1.4] ${!on ? "opacity-35" : ""}`}>
                        <span className={`w-[18px] h-[18px] rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-extrabold mt-[1px] ${on ? "bg-[#059669] text-white" : "bg-[#E5E7EB] text-[#9CA3AF]"}`}>
                          {on ? "✓" : "✕"}
                        </span>
                        {label as string}
                      </li>
                    ))}
                  </ul>
                  <button
                    className="flex items-center justify-center w-full text-sm font-bold text-[#0991B2] bg-[#E6F7FA] border border-[rgba(9,145,178,.25)] rounded-[10px] py-[14px] cursor-pointer transition-all hover:bg-[rgba(9,145,178,.15)] disabled:opacity-55 disabled:cursor-not-allowed"
                    disabled={!isPro}
                  >
                    {isPro ? "Free로 다운그레이드" : "현재 이용 중"}
                  </button>
                  <p className="text-[11px] text-[#9CA3AF] mt-2 text-center min-h-[16px]">기본 기능 무료 제공</p>
                </div>

                {/* PRO CARD */}
                <div
                  className="bg-[#0A0A0A] text-white rounded-2xl p-7 sm:p-9 relative overflow-hidden transition-all duration-300 -translate-y-1 shadow-[0_8px_32px_rgba(0,0,0,.22),0_24px_56px_rgba(0,0,0,.14)] hover:-translate-y-2 hover:shadow-[0_12px_48px_rgba(0,0,0,.3),0_32px_72px_rgba(0,0,0,.18)]"
                  ref={proCardRef}
                >
                  {/* deco blobs */}
                  <div className="absolute w-[240px] h-[240px] bg-[rgba(9,145,178,.1)] blur-[70px] rounded-full -top-20 -right-14 pointer-events-none" />
                  <div className="absolute w-[140px] h-[140px] bg-[rgba(6,182,212,.08)] blur-[50px] rounded-full -bottom-10 -left-[30px] pointer-events-none" />

                  {/* recommended badge */}
                  <div className="absolute top-0 right-8 bg-[#0991B2] text-white text-[10px] font-extrabold px-[14px] py-[5px] rounded-b-[10px] tracking-[.5px] uppercase">
                    추천
                  </div>

                  <div className="flex items-center gap-2 mb-[18px]">
                    <span className="text-xs font-bold tracking-[.7px] uppercase text-[rgba(255,255,255,.4)]">Pro</span>
                    {isPro && (
                      <span className="text-[10px] font-extrabold text-[#059669] bg-[rgba(5,150,105,.1)] px-2 py-[2px] rounded-full tracking-[.4px]">
                        현재 플랜
                      </span>
                    )}
                  </div>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-[56px] font-black tracking-[-3px] leading-none text-white">{monthlyPrice}</span>
                    <span className="text-[15px] font-bold text-[rgba(255,255,255,.35)] pb-2">/월</span>
                    {isYearly && (
                      <span className="text-[13px] font-semibold text-[#9CA3AF] line-through pb-2 ml-[2px]">{originalPrice}</span>
                    )}
                  </div>
                  <p className="text-xs text-[rgba(255,255,255,.3)] mb-7 min-h-[18px]">{periodText}</p>
                  <ul className="list-none flex flex-col gap-[10px] mb-7">
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
                      <li key={i} className="flex items-start gap-[9px] text-[13px] text-[rgba(255,255,255,.8)] leading-[1.4]">
                        <span className="w-[18px] h-[18px] rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-extrabold mt-[1px] bg-[#0991B2] text-white">
                          ✓
                        </span>
                        {label}
                      </li>
                    ))}
                  </ul>
                  <button
                    className="flex items-center justify-center gap-1.5 w-full text-sm font-bold text-[#0A0A0A] bg-white border-none rounded-[10px] py-[14px] cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,.12)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(0,0,0,.18)] disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
                    onClick={isPro ? cancelSubscription : checkout}
                    disabled={processing}
                  >
                    {processing ? (
                      <span className="w-[14px] h-[14px] border-2 border-[rgba(10,10,10,.25)] border-t-[#0A0A0A] rounded-full animate-[subSpin_.6s_linear_infinite]" />
                    ) : isPro ? (
                      "구독 취소"
                    ) : (
                      <>
                        <span>{proBtnText}</span>
                        <span>→</span>
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-[rgba(255,255,255,.25)] mt-2 text-center min-h-[16px]">
                    {isPro ? "다음 결제일: " + (status?.nextBillingDate ?? "—") : proNote}
                  </p>
                </div>
              </div>

              {/* FEATURE COMPARISON */}
              <div className="max-w-container-md mx-auto mb-[52px]" style={{ transitionDelay: "60ms" }}>
                <h2 className="text-[24px] font-black tracking-[-0.4px] mb-[18px] text-center text-[#0A0A0A]">상세 기능 비교</h2>
                <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl overflow-hidden shadow-[var(--sc)]">
                  <div className="grid grid-cols-[1fr_90px_90px] sm:grid-cols-[1fr_130px_130px] bg-white px-[14px] sm:px-6 py-[14px] border-b border-[#E5E7EB]">
                    <div className="text-[11px] font-bold text-[#9CA3AF] tracking-[.5px] uppercase">기능</div>
                    <div className="text-[13px] font-black text-center text-[#0A0A0A]">Free</div>
                    <div className="text-[13px] font-black text-center text-white bg-[#0991B2] rounded-lg px-[10px] py-1">Pro</div>
                  </div>
                  {COMPARE_ROWS.map((row, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[1fr_90px_90px] sm:grid-cols-[1fr_130px_130px] px-[14px] sm:px-6 py-3 border-b border-[#E5E7EB] last:border-b-0 transition-colors hover:bg-[rgba(9,145,178,.03)]"
                    >
                      <div className="flex items-center gap-2 text-[13px] font-semibold text-[#0A0A0A]">
                        <span className="text-sm w-5">{row.icon}</span>
                        {row.label}
                      </div>
                      <div className="flex items-center justify-center text-xs font-semibold text-[#6B7280]">
                        {row.free === "yes" ? (
                          <span className="w-5 h-5 rounded-full bg-[#059669] text-white inline-flex items-center justify-center text-[9px] font-extrabold">✓</span>
                        ) : row.free === "no" ? (
                          <span className="w-5 h-5 rounded-full bg-[#E5E7EB] text-[#9CA3AF] inline-flex items-center justify-center text-[9px] font-extrabold">✕</span>
                        ) : (
                          row.free
                        )}
                      </div>
                      <div className="flex items-center justify-center text-xs font-bold text-[#0991B2]">
                        {row.pro === "yes" ? (
                          <span className="w-5 h-5 rounded-full bg-[#0991B2] text-white inline-flex items-center justify-center text-[9px] font-extrabold">✓</span>
                        ) : (
                          row.pro
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PAYMENT METHODS */}
              <div className="max-w-container-md mx-auto mb-12 text-center" style={{ transitionDelay: "100ms" }}>
                <h2 className="text-xl font-black tracking-[-0.3px] mb-1.5 text-[#0A0A0A]">결제 수단</h2>
                <p className="text-[13px] text-[#6B7280] mb-5">익숙한 방법으로 간편하게 결제하세요</p>
                <div className="flex gap-2 sm:gap-3 justify-center flex-wrap">
                  {[
                    { emoji: "💚", name: "네이버페이",    share: "51.5%" },
                    { emoji: "💛", name: "카카오페이",    share: "25.1%" },
                    { emoji: "💙", name: "토스페이",      share: "13.2%" },
                    { emoji: "💳", name: "신용·체크카드", share: "기타"  },
                  ].map((pm) => (
                    <div
                      key={pm.name}
                      className="flex flex-col items-center gap-1.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-[14px] sm:px-[22px] py-[14px] sm:py-[18px] shadow-[var(--sc)] transition-all duration-200 cursor-pointer min-w-[100px] sm:min-w-[120px] hover:shadow-[var(--sc-hover)] hover:-translate-y-[3px] hover:border-[rgba(9,145,178,.3)]"
                    >
                      <span className="text-[26px]">{pm.emoji}</span>
                      <span className="text-[13px] font-extrabold text-[#0A0A0A]">{pm.name}</span>
                      <span className="text-[11px] text-[#6B7280] font-semibold">{pm.share}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* TRUST ROW */}
              <div className="flex items-center justify-center gap-[14px] sm:gap-7 flex-wrap max-w-[680px] mx-auto mb-[52px]" style={{ transitionDelay: "130ms" }}>
                {[
                  { icon: "🔒", text: "SSL 암호화 결제" },
                  { icon: "↩️", text: "언제든 취소"     },
                  { icon: "🎁", text: "첫 7일 무료"     },
                  { icon: "🧾", text: "세금계산서 발행" },
                  { icon: "🛡️", text: "개인정보 보호"  },
                ].map((t) => (
                  <div key={t.text} className="flex items-center gap-[7px] text-[13px] font-semibold text-[#6B7280]">
                    <span className="text-base">{t.icon}</span> {t.text}
                  </div>
                ))}
              </div>

              {/* FAQ */}
              <div className="max-w-[640px] mx-auto mb-14" style={{ transitionDelay: "160ms" }}>
                <h2 className="text-[22px] font-black tracking-[-0.3px] mb-5 text-center text-[#0A0A0A]">자주 묻는 질문</h2>
                {FAQ_ITEMS.map((item, i) => {
                  const isOpen = openFaqIndex === i;
                  return (
                    <div
                      key={i}
                      className={`bg-[#F9FAFB] border rounded-xl mb-2 overflow-hidden transition-[box-shadow] duration-200 ${isOpen ? "shadow-[var(--sc-hover)] border-[rgba(9,145,178,.2)]" : "border-[#E5E7EB]"}`}
                    >
                      <button
                        className="flex items-center justify-between w-full px-5 py-4 cursor-pointer text-sm font-bold text-[#0A0A0A] gap-3 bg-none border-none text-left transition-colors hover:bg-[rgba(9,145,178,.03)]"
                        onClick={() => toggleFaq(i)}
                      >
                        {item.q}
                        <span
                          className="text-[11px] text-[#0991B2] transition-transform duration-[250ms] flex-shrink-0"
                          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                        >▼</span>
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-4 text-[13px] text-[#6B7280] leading-[1.7] animate-[subSlideDown_.2s_ease]">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* TOAST */}
      {successMessage && (
        <div className="fixed bottom-7 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-2 bg-[#0A0A0A] text-white rounded-[10px] px-5 py-3 text-[13px] font-semibold shadow-[0_4px_20px_rgba(0,0,0,.2)] animate-[subFadeUp_.3s_ease] whitespace-nowrap">
          ✓ {successMessage}
        </div>
      )}
      {error && (
        <div className="fixed bottom-7 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-2 bg-[#EF4444] text-white rounded-[10px] px-5 py-3 text-[13px] font-semibold shadow-[0_4px_20px_rgba(0,0,0,.2)] animate-[subFadeUp_.3s_ease] whitespace-nowrap">
          ✕ {error}
        </div>
      )}
    </>
  );
}
