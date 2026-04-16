import { useEffect, useState } from "react";
import { fetchTicketPolicyApi } from "@/shared/api";
import type { TicketPolicy } from "@/shared/api";

const TICKET_POLICY_KEY = "mefit_ticket_policy";
const CACHE_DURATION = 60 * 60 * 1000; // 1시간

interface CachedPolicy {
  data: TicketPolicy;
  timestamp: number;
}

function getCachedPolicy(): TicketPolicy | null {
  try {
    const cached = localStorage.getItem(TICKET_POLICY_KEY);
    if (!cached) return null;
    const parsed: CachedPolicy = JSON.parse(cached);
    if (Date.now() - parsed.timestamp > CACHE_DURATION) {
      localStorage.removeItem(TICKET_POLICY_KEY);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function setCachedPolicy(data: TicketPolicy): void {
  try {
    const cached: CachedPolicy = { data, timestamp: Date.now() };
    localStorage.setItem(TICKET_POLICY_KEY, JSON.stringify(cached));
  } catch {
    // localStorage 사용 불가 시 무시
  }
}

interface UseTicketPolicyResult {
  policy: TicketPolicy | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTicketPolicy(): UseTicketPolicyResult {
  const [policy, setPolicy] = useState<TicketPolicy | null>(() => getCachedPolicy());
  const [loading, setLoading] = useState(!getCachedPolicy());
  const [error, setError] = useState<string | null>(null);

  const fetchPolicy = async () => {
    const cached = getCachedPolicy();
    if (cached) {
      setPolicy(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const res = await fetchTicketPolicyApi();
    if (res.success && res.data) {
      setPolicy(res.data);
      setCachedPolicy(res.data);
    } else {
      setError(res.error ?? "정책 조회 실패");
    }
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      await fetchPolicy();
    })();
  }, []);

  return { policy, loading, error, refetch: fetchPolicy };
}
