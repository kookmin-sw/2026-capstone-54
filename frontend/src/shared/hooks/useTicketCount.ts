import { useEffect, useState } from "react";
import { fetchUserTicketApi } from "@/shared/api";
import type { UserTicket } from "@/shared/api";

interface UseTicketCountResult {
  tickets: UserTicket | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTicketCount(): UseTicketCountResult {
  const [tickets, setTickets] = useState<UserTicket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    const res = await fetchUserTicketApi();
    if (res.success && res.data) {
      setTickets(res.data);
    } else {
      setError(res.error ?? "티켓 조회 실패");
    }
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      await fetchTickets();
    })();
  }, []);

  return { tickets, loading, error, refetch: fetchTickets };
}
