import { useTicketStore } from "@/shared/store/ticketStore";

/**
 * @deprecated Use useTicketStore() instead for global state management
 * This hook is kept for backward compatibility
 */
export function useTicketCount() {
  const { tickets, loading, error, refetch } = useTicketStore();
  return { tickets, loading, error, refetch };
}
