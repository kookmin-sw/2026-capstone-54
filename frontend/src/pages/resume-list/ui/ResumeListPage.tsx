import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Loader2 } from "lucide-react";
import { useInfiniteList } from "@/shared/hooks/useInfiniteList";
import { openSseStream } from "@/shared/api/sse";
import {
  resumeApi,
  resumeStatsApi,
  type ResumeCountStats,
  type ResumeListItem,
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
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    resumeStatsApi.count().then(setCountStats).catch(() => {});
  }, []);

  // 진행 중(pending/processing) 이력서에 대해 SSE 스트림을 구독해 상태 변화를 즉시 반영한다.
  // 완료/실패 이벤트가 도착하면 해당 아이템만 재조회해 list 와 통계를 갱신한다.
  // 이미 completed/failed 상태인 항목은 구독 자체를 만들지 않는다.
  const sseCancelsRef = useRef<Map<string, () => void>>(new Map());
  const terminalFlagsRef = useRef<Map<string, { done: boolean }>>(new Map());

  useEffect(() => {
    const active = sseCancelsRef.current;
    const terminals = terminalFlagsRef.current;
    const currentlyPending = new Set(
      items
        .filter((r) => r.analysisStatus === "pending" || r.analysisStatus === "processing")
        .map((r) => r.uuid),
    );

    // 목록에서 사라졌거나 더 이상 pending 이 아닌 uuid 는 구독 해제
    for (const [uuid, cancel] of active.entries()) {
      if (!currentlyPending.has(uuid)) {
        cancel();
        active.delete(uuid);
        terminals.delete(uuid);
      }
    }

    // 새로 필요한 uuid 는 구독 시작
    for (const uuid of currentlyPending) {
      if (active.has(uuid)) continue;

      const terminalFlag = { done: false };
      terminals.set(uuid, terminalFlag);

      const retryRetrieveItem = async (attempts = 3): Promise<ResumeListItem | null> => {
        for (let i = 0; i < attempts; i += 1) {
          try {
            return await resumeApi.retrieve(uuid);
          } catch {
            if (i < attempts - 1) await new Promise((r) => setTimeout(r, 400 * (i + 1)));
          }
        }
        return null;
      };

      const cancel = openSseStream(
        `/sse/resumes/${uuid}/analysis-status/`,
        (event, data) => {
          if (!data || typeof data !== "object") return;

          if (event === "status") {
            const payload = data as {
              analysis_status: ResumeListItem["analysisStatus"];
              analysis_step: ResumeListItem["analysisStep"];
            };

            setItems((prev) =>
              prev.map((r) =>
                r.uuid === uuid
                  ? { ...r, analysisStatus: payload.analysis_status, analysisStep: payload.analysis_step }
                  : r,
              ),
            );

            if (payload.analysis_status === "completed" || payload.analysis_status === "failed") {
              terminalFlag.done = true;
              // 분석 완료 시 해당 항목을 retry 루프로 재조회해 parsed 필드까지 최신화
              void retryRetrieveItem().then((fresh) => {
                if (fresh) {
                  setItems((prev) => prev.map((r) => (r.uuid === uuid ? fresh : r)));
                }
              });
              resumeStatsApi.count().then(setCountStats).catch(() => {});
            }
            return;
          }

          if (event === "error") {
            // 백엔드가 권한/not-found 등으로 에러를 보낸 경우: 더 이상 재연결하지 않는다.
            terminalFlag.done = true;
          }
        },
        {
          shouldReconnect: () => !terminalFlag.done,
          onError: () => {
            terminalFlag.done = true;
          },
        },
      );
      active.set(uuid, cancel);
    }

    return undefined;
  }, [items, setItems]);

  // 언마운트 시 모든 SSE 구독 종료
  useEffect(() => {
    const active = sseCancelsRef.current;
    const terminals = terminalFlagsRef.current;
    return () => {
      for (const cancel of active.values()) cancel();
      active.clear();
      terminals.clear();
    };
  }, []);

  const refreshAll = () => {
    reset();
    resumeStatsApi.count().then(setCountStats).catch(() => {});
  };

  const handleDelete = async (uuid: string) => {
    if (!confirm("이력서를 삭제하시겠습니까?")) return;
    await resumeApi.remove(uuid);
    setItems((prev) => prev.filter((r) => r.uuid !== uuid));
    refreshAll();
  };

  return (
    <div>
      <div className="w-full px-8 pt-[28px] pb-[60px] max-sm:px-4 max-sm:pt-5">
        {/* 페이지 타이틀 */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[1.4px] uppercase text-[#0991B2] bg-[#E6F7FA] py-1 px-3 rounded-full mb-2.5"><FileText size={12} />이력서</div>
            <h1 className="text-[clamp(24px,3vw,36px)] font-black tracking-[-0.8px] text-[#0A0A0A] leading-[1.1]">내 이력서</h1>
            <p className="text-sm text-[#6B7280] mt-1.5">면접 연습에 사용할 이력서를 관리하세요.</p>
          </div>
          <button
            onClick={() => navigate("/resume/new")}
            className="inline-flex items-center gap-2 text-sm font-bold text-white bg-[#0A0A0A] border-none cursor-pointer py-3.5 px-6 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-opacity hover:opacity-85 whitespace-nowrap"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            이력서 추가
          </button>
        </div>

        {/* 통계 스트립 */}
        {countStats && <ResumeStatsStrip count={countStats} />}

        {/* 리스트 헤더: "전체 이력서 X개" + 검색 */}
        <ResumeListHeader
          totalCount={totalCount}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* 리스트 */}
        <div className="flex flex-col gap-3 mt-4">
          {items
            .filter((item) =>
              searchQuery.trim() === "" ||
              item.title.toLowerCase().includes(searchQuery.toLowerCase()),
            )
            .map((item) => (
              <ResumeCard
                key={item.uuid}
                resume={item}
                onDetail={() => navigate(`/resume/${item.uuid}`)}
                onEdit={() => navigate(`/resume/${item.uuid}`)}
                onDelete={() => handleDelete(item.uuid)}
              />
            ))}
          {items.filter((item) =>
            searchQuery.trim() === "" ||
            item.title.toLowerCase().includes(searchQuery.toLowerCase()),
          ).length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              {searchQuery ? (
                <>
                  <span className="text-5xl mb-5">🔍</span>
                  <p className="text-[15px] font-extrabold text-[#0A0A0A] mb-2">검색 결과가 없어요</p>
                  <p className="text-sm text-[#9CA3AF]">다른 검색어를 입력해 보세요</p>
                </>
              ) : (
                <>
                  <span className="text-5xl mb-5">📄</span>
                  <p className="text-[15px] font-extrabold text-[#0A0A0A] mb-2">아직 등록된 이력서가 없어요</p>
                  <p className="text-sm text-[#9CA3AF] mb-6">이력서를 추가해 AI 면접을 시작해 보세요</p>
                  <button
                    onClick={() => navigate("/resume/new")}
                    className="inline-flex items-center gap-2 text-sm font-bold text-white bg-[#0A0A0A] rounded-lg py-3 px-6 hover:opacity-85 transition-opacity"
                  >
                    이력서 추가하기
                  </button>
                </>
              )}
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
