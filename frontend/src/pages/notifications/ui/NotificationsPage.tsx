import { useState } from "react";
import { useNotificationStore } from "@/features/notifications";

const CATEGORY_ICON = { interview: "🎥", resume: "📄", jd: "🏢", system: "🔔" } as const;
const CATEGORY_LABEL = { interview: "면접", resume: "이력서", jd: "채용공고", system: "시스템" } as const;

const TABS = [
  { key: "all",       label: "전체"     },
  { key: "interview", label: "면접"     },
  { key: "resume",    label: "이력서"   },
  { key: "jd",        label: "채용공고" },
  { key: "system",    label: "시스템"   },
] as const;

type TabKey = (typeof TABS)[number]["key"];

type Notification = ReturnType<typeof useNotificationStore>["notifications"][number];

function NotificationItem({
  n,
  onMarkRead,
  onDelete,
}: {
  n: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className={`flex items-start gap-4 px-5 py-4 border-b border-[#F3F4F6] last:border-0 transition-colors ${
        !n.read ? "bg-[#F0F9FF]" : "hover:bg-white"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center text-[18px] shrink-0 ${
          !n.read ? "bg-[#E0F2FE]" : "bg-[#F3F4F6]"
        }`}
      >
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

      <div className="flex items-center gap-1 shrink-0 mt-0.5">
        {!n.read && (
          <button
            onClick={() => onMarkRead(n.id)}
            className="text-[11px] font-semibold text-[#0991B2] bg-[#E6F7FA] px-2.5 py-1 rounded-lg hover:bg-[#cceef6] transition-colors"
          >
            확인
          </button>
        )}
        <button
          onClick={() => onDelete(n.id)}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-[#9CA3AF] hover:bg-[#FEF2F2] hover:text-[#EF4444] transition-colors"
          aria-label="알림 삭제"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function NotificationList({
  notifications,
  onMarkRead,
  onDelete,
}: {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-4xl mb-3">🔔</span>
        <p className="text-[14px] text-[#9CA3AF]">알림이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl overflow-hidden shadow-[var(--sc)]">
      {notifications.map((n) => (
        <NotificationItem key={n.id} n={n} onMarkRead={onMarkRead} onDelete={onDelete} />
      ))}
    </div>
  );
}

export function NotificationsPage() {
  const { notifications, markAllRead, markRead, deleteNotification, deleteAll } = useNotificationStore();
  const unreadCount = notifications.filter((n) => !n.read).length;
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  const filtered =
    activeTab === "all"
      ? notifications
      : notifications.filter((n) => n.category === activeTab);

  return (
    <div className="sp-wrap">
      <div className="grid grid-cols-1 min-h-[calc(100vh-60px)] bg-white">
        <main className="px-10 py-8 min-w-0 bg-white max-[640px]:px-4 max-[640px]:py-5">

          {/* Page header */}
          <div className="mb-7 animate-[spFadeUp_0.3s_ease_both]">
            <h1 className="font-inter text-[26px] font-black tracking-[-0.5px] text-[#0A0A0A] mb-[5px]">
              알림 내역
              {unreadCount > 0 && (
                <span className="ml-2 text-[13px] font-bold text-white bg-[#0991B2] px-2 py-0.5 rounded-full align-middle">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-[14px] text-[#6B7280] leading-[1.55]">서비스에서 발생한 모든 알림을 확인하세요</p>
          </div>

          {/* Tab + 액션 버튼 */}
          <div className="flex items-center justify-between gap-3 mb-5 flex-wrap animate-[spFadeUp_0.3s_ease_.05s_both]">
            <div className="flex gap-1 flex-wrap">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-[7px] rounded-full text-[12px] font-bold cursor-pointer border transition-all ${
                    activeTab === tab.key
                      ? "bg-[#0A0A0A] text-white border-[#0A0A0A]"
                      : "bg-[#F9FAFB] text-[#6B7280] border-[#E5E7EB] hover:border-[#0991B2] hover:text-[#0991B2]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[12px] font-semibold text-[#0991B2] bg-[#E6F7FA] border border-[rgba(9,145,178,.2)] px-3 py-[6px] rounded-lg hover:bg-[#cceef6] transition-colors"
                >
                  전체 확인
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={deleteAll}
                  className="text-[12px] font-semibold text-[#EF4444] bg-[#FEF2F2] border border-[rgba(239,68,68,.2)] px-3 py-[6px] rounded-lg hover:bg-[#fde8e8] transition-colors"
                >
                  전체 삭제
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="animate-[spFadeUp_0.3s_ease_.1s_both]">
            <NotificationList
              notifications={filtered}
              onMarkRead={markRead}
              onDelete={deleteNotification}
            />
          </div>

        </main>
      </div>
    </div>
  );
}
