import { useNavigate } from "react-router-dom";
import { useNotificationStore } from "@/features/notifications";

const CATEGORY_ICON = { interview: "🎥", resume: "📄", jd: "🏢", system: "🔔" } as const;
const CATEGORY_LABEL = { interview: "면접", resume: "이력서", jd: "채용공고", system: "시스템" } as const;
const TABS = [
  { key: "all", label: "전체" },
  { key: "interview", label: "면접" },
  { key: "resume", label: "이력서" },
  { key: "jd", label: "채용공고" },
  { key: "system", label: "시스템" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

import { useState } from "react";

export function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAllRead, markRead } = useNotificationStore();
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  const filtered = activeTab === "all" ? notifications : notifications.filter((n) => n.category === activeTab);

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6] transition-colors text-[#6B7280]"
            aria-label="뒤로가기"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="font-inter text-[18px] font-black tracking-[-0.3px] text-[#0A0A0A]">
            알림 내역
            {unreadCount() > 0 && (
              <span className="ml-2 text-[12px] font-bold text-white bg-[#0991B2] px-2 py-0.5 rounded-full align-middle">
                {unreadCount()}
              </span>
            )}
          </h1>
        </div>
        {unreadCount() > 0 && (
          <button
            onClick={markAllRead}
            className="text-[13px] font-semibold text-[#0991B2] hover:opacity-70 transition-opacity"
          >
            모두 읽음
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-[#E5E7EB] px-6 flex gap-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`shrink-0 px-4 py-3 text-[13px] font-semibold border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-[#0991B2] text-[#0991B2]"
                : "border-transparent text-[#6B7280] hover:text-[#0A0A0A]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-4xl mb-3">🔔</span>
            <p className="text-[14px] text-[#9CA3AF]">알림이 없습니다.</p>
          </div>
        ) : (
          <ul className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-sm">
            {filtered.map((n) => (
              <li
                key={n.id}
                className={`flex items-start gap-4 px-5 py-4 border-b border-[#F3F4F6] last:border-0 transition-colors ${
                  !n.read ? "bg-[#F0F9FF]" : "hover:bg-[#F9FAFB]"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[18px] shrink-0 ${!n.read ? "bg-[#E0F2FE]" : "bg-[#F3F4F6]"}`}>
                  {CATEGORY_ICON[n.category]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold text-[#0991B2] bg-[#E0F2FE] px-2 py-0.5 rounded-full">
                      {CATEGORY_LABEL[n.category]}
                    </span>
                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-[#0991B2]" />}
                  </div>
                  <p className={`text-[13px] leading-[1.55] ${!n.read ? "font-semibold text-[#0A0A0A]" : "text-[#374151]"}`}>
                    {n.message}
                  </p>
                  <p className="text-[11px] text-[#9CA3AF] mt-1">{n.time}</p>
                </div>
                {!n.read && (
                  <button
                    onClick={() => markRead(n.id)}
                    className="shrink-0 text-[11px] font-semibold text-[#6B7280] hover:text-[#0991B2] transition-colors mt-1"
                  >
                    읽음
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
