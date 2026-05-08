import { Link } from "react-router-dom";
import { SetupSection } from "@/shared/ui/SetupSection";
import { SelectableCard } from "@/shared/ui/SelectableCard";
import { FileText, PencilLine } from "lucide-react";

interface Resume {
  uuid: string;
  title: string;
  type: string;
  createdAt: string;
  isParsed: boolean;
  analysisStatus: string;
}

interface ResumeSectionProps {
  resumes: Resume[];
  selectedResumeUuid: string | null;
  resumesLoading: boolean;
  resumesError: string | null;
  onSelectResume: (uuid: string) => void;
}

function isEligible(r: Resume) {
  return r.isParsed || r.analysisStatus === "completed";
}

export function ResumeSection({
  resumes, selectedResumeUuid, resumesLoading, resumesError,
  onSelectResume,
}: ResumeSectionProps) {
  return (
    <SetupSection eyebrow="이력서" title="사용할 이력서를 선택하세요" description="파싱이 완료된 이력서만 면접에 사용할 수 있어요." className="flex-1 min-h-0">
      {resumesError && (
        <div className="mb-2.5 p-2.5 rounded-lg border border-[#FECACA] bg-[#FEF2F2] text-[12px] text-[#B91C1C]">{resumesError}</div>
      )}

      {resumesLoading ? (
        <div className="p-4 text-center text-[13px] text-[#9CA3AF]">이력서 목록을 불러오는 중...</div>
      ) : resumes.length === 0 ? (
        <div className="py-4 px-6 text-center text-[13px] text-[#6B7280] border border-dashed border-[#E5E7EB] rounded-lg">
          <div>아직 등록된 이력서가 없어요.</div>
          <Link to="/resume/new" className="mt-1.5 inline-block text-[#0991B2] font-semibold underline underline-offset-2 hover:opacity-75">
            이력서 추가하기 →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-[7px] flex-1 overflow-y-auto min-h-0">
          {resumes.map((r) => {
            const eligible = isEligible(r);
            return (
              <SelectableCard key={r.uuid} selected={selectedResumeUuid === r.uuid} disabled={!eligible} onClick={() => onSelectResume(r.uuid)}>
                <div className="w-8 h-8 rounded-lg bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center shrink-0">
                  {r.type === "file"
                    ? <FileText size={16} className="text-[#6B7280]" />
                    : <PencilLine size={16} className="text-[#6B7280]" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-bold truncate">{r.title}</div>
                  <div className="text-[11px] text-[#6B7280] mt-px">
                    {r.type === "file" ? "파일" : "텍스트"} · {new Date(r.createdAt).toLocaleDateString("ko-KR")}
                  </div>
                </div>
                <span className={`inline-flex items-center text-[10px] font-bold py-[3px] px-2.5 rounded-full ${eligible ? "text-[#059669] bg-[#ECFDF5]" : "text-[#B45309] bg-[#FEF3C7]"}`}>
                  {eligible ? "사용 가능" : "파싱 중"}
                </span>
              </SelectableCard>
            );
          })}
        </div>
      )}

    </SetupSection>
  );
}
