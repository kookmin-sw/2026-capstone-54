import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useNotificationStore } from "../model/store";
import { getNotifiableUrl } from "./getNotifiableUrl";

const ACTION_LABEL: Record<string, string> = {
  jd: "채용공고 결과 보기",
  resume: "이력서 결과 보기",
  interview: "면접 리포트 보기",
};

export function useNotificationToast() {
  const navigate = useNavigate();
  const notifications = useNotificationStore((s) => s.notifications);
  const markRead = useNotificationStore((s) => s.markRead);
  const prevIdsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const prevIds = prevIdsRef.current;

    notifications.forEach((n) => {
      if (prevIds.has(n.id)) return;   // 이미 처리된 알림
      if (n.isRead) return;            // 초기 로드 시 기존 읽음 알림 skip

      const url = getNotifiableUrl(n.notifiableType, n.notifiableId);
      const label = ACTION_LABEL[n.category];

      toast(n.message, {
        duration: 5000,
        action:
          url && label
            ? { label, onClick: () => { markRead(n.id); navigate(url); } }
            : undefined,
      });
    });

    prevIdsRef.current = new Set(notifications.map((n) => n.id));
  }, [notifications, navigate]);
}
