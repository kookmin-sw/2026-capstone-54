import { useEffect } from "react";
import { useTicketStore } from "@/shared/store/ticketStore";

export function useTicketCount() {
  const { tickets, loading, error, refetch } = useTicketStore();
  
  useEffect(() => {
    if (!tickets) {
      refetch();
    }
  }, []);
  
  return { tickets, loading, error, refetch };
}
