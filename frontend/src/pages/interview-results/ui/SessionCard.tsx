import { Loader2, FileText, Plus, ChevronRight, Play } from "lucide-react";
import { SESSION_TYPE_LABEL, DIFFICULTY_LABEL, REPORT_STATUS_BADGE } from "@/features/interview-session";
import type { InterviewSessionListItem } from "@/features/interview-session";
import { formatDateTime } from "@/shared/lib/format/date";

interface SessionCardProps {
  session: InterviewSessionListItem;
  isGenerating: boolean;
  onContinue: (uuid: string) => void;
  onViewReport: (uuid: string) => void;
  onGenerateReport: (uuid: string) => void;
}

export function SessionCard({ session: s, isGenerating, onContinue, onViewReport, onGenerateReport }: SessionCardProps) {
  const badge = s.reportStatus ? REPORT_STATUS_BADGE[s.reportStatus] : null;
  const isInProgress = s.interviewSessionStatus === "in_progress";
  const hasReport = s.reportStatus === "completed";
  const isBusy = s.reportStatus === "generating" || s.reportStatus === "pending";

  return (
    <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col gap-0">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center text-lg shrink-0">
          {isInProgress ? "🎙️" : hasReport ? "📊" : "🗒️"}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className="text-[13px] font-bold text-[#0A0A0A]">{SESSION_TYPE_LABEL[s.interviewSessionType] ?? s.interviewSessionType}</span>
            <span className="text-[10px] font-semibold py-px px-2 rounded-full border border-[#E5E7EB] bg-white text-[#6B7280]">
              {DIFFICULTY_LABEL[s.interviewDifficultyLevel] ?? s.interviewDifficultyLevel}
            </span>
            {isInProgress && (
              <span className="text-[10px] font-bold py-px px-2 rounded-full border border-[#FED7AA] bg-[#FFF7ED] text-[#D97706]">
                진행 중
              </span>
            )}
            {badge && !isInProgress && (
              <span className={`text-[10px] font-bold border rounded-full px-2 py-px ${badge.cls}`}>
                {isBusy ? (
                  <span className="flex items-center gap-1"><Loader2 size={10} className="animate-spin" />{badge.label}</span>
                ) : badge.label}
              </span>
            )}
          </div>
          <div className="text-[12px] text-[#6B7280] truncate">
            {formatDateTime(s.createdAt)}
            {" · "}
            <span className="truncate">{s.resumeTitle}</span>
            {" · "}
            <span className="truncate">{s.jobDescriptionLabel}</span>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {isInProgress ? (
            <button onClick={() => onContinue(s.uuid)} className="flex items-center gap-1 text-[12px] font-bold text-white bg-[#0991B2] rounded-lg px-3 py-1.5 hover:opacity-85 transition-opacity">
              <Play size={12} /> 이어서 진행
            </button>
          ) : hasReport ? (
            <button onClick={() => onViewReport(s.uuid)} className="flex items-center gap-1 text-[12px] font-bold text-[#0991B2] border border-[#BAE6FD] bg-[#E6F7FA] rounded-lg px-3 py-1.5 hover:bg-[#BAE6FD] transition-colors">
              <FileText size={12} /> 리포트 보기
            </button>
          ) : (
            <button
              onClick={() => !isBusy && !isGenerating && onGenerateReport(s.uuid)}
              disabled={isGenerating || isBusy}
              className="flex items-center gap-1 text-[12px] font-bold text-white bg-[#0A0A0A] rounded-lg px-3 py-1.5 hover:opacity-85 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isGenerating || isBusy ? <><Loader2 size={12} className="animate-spin" /> 처리 중...</> : <><Plus size={12} /> 리포트 생성</>}
            </button>
          )}
        </div>
      </div>

      {s.anchorQuestions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[#F3F4F6]">
          <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wide mb-1.5">핵심 질문</p>
          <ul className="flex flex-col gap-1">
            {s.anchorQuestions.map((q, i) => (
              <li key={q.id} className="flex items-start gap-1.5 text-[12px] text-[#374151]">
                <ChevronRight size={13} className="shrink-0 mt-px text-[#0991B2]" />
                <span><span className="font-bold text-[#0991B2] mr-1">Q{i + 1}.</span>{q.question}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
