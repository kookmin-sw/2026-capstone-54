import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Loader2 } from "lucide-react";
import { useInfiniteList } from "@/shared/hooks/useInfiniteList";
import { openSseStream } from "@/shared/api/sse";
import {
  resumeApi,
  resumeStatsApi,
  type ResumeCountStats,
  type ResumeListItem,
  type ResumeTypeStats,
} from "@/features/resume";
import { ResumeCard } from "./ResumeCard";
import { ResumeListHeader } from "./ResumeListHeader";
import { ResumeStatsStrip } from "./ResumeStatsStrip";

export function ResumeListPage() {
  const navigate = useNavigate();
  const { items, totalCount, isLoading, hasNext, sentinelRef, setItems, reset } = useInfiniteList<ResumeListItem>({
    fetchPage: (page) => resumeApi.list(page),
  });

  const [countStats, setCountStats] = useState<ResumeCountStats | null>(null);
  const [typeStats, setTypeStats] = useState<ResumeTypeStats | null>(null);

  useEffect(() => {
    resumeStatsApi.count().then(setCountStats).catch(() => {});
    resumeStatsApi.type().then(setTypeStats).catch(() => {});
  }, []);

  // 진행 중(pending/processing) 이력서에 대해 SSE 스트림을 구독해 상태 변화를 즉시 반영한다.
  // 완료/실패 이벤트가 도착하면 해당 아이템만 재조회해 list 와 통계를 갱신한다.
  const sseCancelsRef = useRef<Map<string, () => void>>(new Map());
  useEffect(() => {
    const active = sseCancelsRef.current;
    const currentlyPending = new Set(
      items
        .filter((r) => r.analysisStatus === "pending" || r.analysisStatus === "processing")
        .map((r) => r.uuid),
    );

    // 구독이 더 이상 필요 없는 uuid 는 정리
    for (const [uuid, cancel] of active.entries()) {
      if (!currentlyPending.has(uuid)) {
        cancel();
        active.delete(uuid);
      }
    }

    // 새로 필요한 uuid 는 구독 시작
    for (const uuid of currentlyPending) {
      if (active.has(uuid)) continue;

      const cancel = openSseStream(
        `/sse/resumes/${uuid}/analysis-status/`,
        (event, data) => {
          if (event !== "status" || !data || typeof data !== "object") return;
          const payload = data as { analysis_status: ResumeListItem["analysisStatus"]; analysis_step: ResumeListItem["analysisStep"] };

          setItems((prev) =>
            prev.map((r) =>
              r.uuid === uuid
                ? { ...r, analysisStatus: payload.analysis_status, analysisStep: payload.analysis_step }
                : r,
            ),
          );

          if (payload.analysis_status === "completed" || payload.analysis_status === "failed") {
            // 분석 완료 시 해당 항목을 다시 fetch 해서 parsed 관련 필드까지 최신화
            resumeApi
              .retrieve(uuid)
              .then((fresh) =>
                setItems((prev) => prev.map((r) => (r.uuid === uuid ? fresh : r))),
              )
              .catch(() => {});
            // 통계 갱신
            resumeStatsApi.count().then(setCountStats).catch(() => {});
            resumeStatsApi.type().then(setTypeStats).catch(() => {});
          }
        },
      );
      active.set(uuid, cancel);
    }

    return undefined;
  }, [items, setItems]);

  // 언마운트 시 모든 SSE 구독 종료
  useEffect(() => {
    const active = sseCancelsRef.current;
    return () => {
      for (const cancel of active.values()) cancel();
      active.clear();
    };
  }, []);

  const refreshAll = () => {
    reset();
    resumeStatsApi.count().then(setCountStats).catch(() => {});
    resumeStatsApi.type().then(setTypeStats).catch(() => {});
  };

  const handleDelete = async (uuid: string) => {
    if (!confirm("이력서를 삭제하시겠습니까?")) return;
    await resumeApi.remove(uuid);
    setItems((prev) => prev.filter((r) => r.uuid !== uuid));
    refreshAll();
  };

  const handleToggleActive = async (item: ResumeListItem) => {
    const updated = item.isActive
      ? await resumeApi.deactivate(item.uuid)
      : await resumeApi.activate(item.uuid);
    setItems((prev) => prev.map((r) => (r.uuid === item.uuid ? updated : r)));
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-container-lg mx-auto px-8 pt-[28px] pb-[60px] max-sm:px-4 max-sm:pt-5">
        {/* 페이지 타이틀 */}
        <div className="mb-6">
          <h1 className="text-[clamp(24px,3vw,36px)] font-black tracking-[-0.8px] text-[#0A0A0A] leading-[1.1]">내 이력서</h1>
          <p className="text-sm text-[#6B7280] mt-1.5">면접 연습에 사용할 이력서를 관리하세요.</p>
        </div>

        {/* 통계 스트립 */}
        {countStats && typeStats && <ResumeStatsStrip count={countStats} type={typeStats} />}

        {/* 리스트 헤더: "전체 이력서 X개" + 추가 버튼 */}
        <ResumeListHeader
          totalCount={totalCount}
          onAdd={() => navigate("/resume/new")}
        />

        {/* 리스트 */}
        <div className="flex flex-col gap-3 mt-4">
          {items.map((item) => (
            <ResumeCard
              key={item.uuid}
              resume={item}
              onDetail={() => navigate(`/resume/${item.uuid}`)}
              onEdit={() => navigate(`/resume/edit/${item.uuid}`)}
              onDelete={() => handleDelete(item.uuid)}
              onToggleActive={() => handleToggleActive(item)}
            />
          ))}
          {items.length === 0 && !isLoading && (
            <div className="bg-[#F9FAFB] border border-dashed border-[#E5E7EB] rounded-xl p-12 text-center">
              <p className="text-[#6B7280] mb-4">아직 등록된 이력서가 없어요.</p>
              <button
                onClick={() => navigate("/resume/new")}
                className="inline-flex items-center gap-2 text-sm font-bold text-white bg-[#0A0A0A] rounded-lg py-3 px-6 hover:opacity-85"
              >
                <Plus size={14} /> 이력서 추가하기
              </button>
            </div>
          )}
          {isLoading && (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-[#0991B2]" />
            </div>
          )}
          {/* IntersectionObserver sentinel */}
          {hasNext && <div ref={sentinelRef} className="h-4" />}
        </div>
      </div>
    </div>
  );
}
