/** 이력서 생성 페이지 — 파일 / 텍스트 / 구조화 3가지 모드 탭. */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FilePlus, FileUp, FileText, Sparkles } from "lucide-react";
import { FileUploadTab } from "./mode-tabs/FileUploadTab";
import { TextUploadTab } from "./mode-tabs/TextUploadTab";
import { StructuredFormTab } from "./mode-tabs/StructuredFormTab";

type Mode = "file" | "text" | "structured";

const TABS: { key: Mode; label: string; icon: React.ComponentType<{ size?: number }>; description: string }[] = [
  { key: "file", label: "파일 업로드", icon: FileUp, description: "PDF 이력서를 올려 자동 분석" },
  { key: "text", label: "텍스트 입력", icon: FileText, description: "자유 텍스트로 입력 후 자동 분석" },
  { key: "structured", label: "새로운 이력서 작성", icon: Sparkles, description: "이력서의 구조에 맞게 작성할 수 있습니다." },
];

export function ResumeNewPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("file");

  return (
    <div>
      <div className="w-full px-8 pt-[28px] pb-[60px] max-sm:px-4 max-sm:pt-5">
        {/* PAGE HEADER */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[1.4px] uppercase text-[#0991B2] bg-[#E6F7FA] py-1 px-3 rounded-full mb-2.5"><FilePlus size={12} /> 이력서 추가</div>
            <h1 className="text-[clamp(24px,3vw,36px)] font-black tracking-[-0.8px] text-[#0A0A0A] leading-[1.1]">새 이력서</h1>
            <p className="text-sm text-[#6B7280] mt-1.5">작성 방식을 선택하고 이력서를 작성해보세요.</p>
          </div>
          <button
            onClick={() => navigate("/resume")}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#6B7280] bg-transparent border-none cursor-pointer py-[10px] px-4 rounded-lg transition-all hover:text-[#0A0A0A] hover:bg-[#F3F4F6]"
          >
            <ArrowLeft size={16} />
            목록으로
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6 max-sm:grid-cols-1">
          {TABS.map(({ key, label, icon: Icon, description }) => {
            const isActive = mode === key;
            return (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`text-left rounded-lg p-4 border transition-colors ${
                  isActive
                    ? "border-[#0991B2] bg-[#E6F7FA]"
                    : "border-[#E5E7EB] hover:border-[#9CA3AF]"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={16} />
                  <span className="text-[13px] font-extrabold text-[#0A0A0A]">{label}</span>
                </div>
                <p className="text-[11px] text-[#6B7280] leading-[1.5]">{description}</p>
              </button>
            );
          })}
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-lg p-6">
          {mode === "file" && <FileUploadTab />}
          {mode === "text" && <TextUploadTab />}
          {mode === "structured" && <StructuredFormTab />}
        </div>
      </div>
    </div>
  );
}
