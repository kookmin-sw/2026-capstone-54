import { useState } from "react";
import type { JobDescriptionCollectionStatus } from "../api/types";
import { useUserJobDescriptionScrapingSse } from "../hooks/useUserJobDescriptionScrapingSse";

interface UserJobDescriptionScrapingStatusProps {
  uuid: string;
  initialStatus: JobDescriptionCollectionStatus;
}

const TERMINAL_STATUSES: JobDescriptionCollectionStatus[] = ["done", "error"];

export function UserJobDescriptionScrapingStatus({
  uuid,
  initialStatus,
}: UserJobDescriptionScrapingStatusProps) {
  const [status, setStatus] =
    useState<JobDescriptionCollectionStatus>(initialStatus);

  const isTerminal = TERMINAL_STATUSES.includes(status);

  useUserJobDescriptionScrapingSse({
    uuid,
    enabled: !isTerminal,
    onStatus: (evt) => {
      setStatus(evt.collection_status);
    },
    onTerminal: (evt) => {
      setStatus(evt.collection_status);
    },
  });

  if (status === "pending") {
    return <span className="text-sm text-gray-500">분석 대기 중...</span>;
  }

  if (status === "in_progress") {
    return (
      <span className="flex items-center gap-1.5 text-sm text-blue-600">
        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        채용공고 분석 중...
      </span>
    );
  }

  if (status === "done") {
    return <span className="text-sm text-green-600">분석 완료</span>;
  }

  if (status === "error") {
    return <span className="text-sm text-red-500">분석 실패</span>;
  }

  return null;
}
