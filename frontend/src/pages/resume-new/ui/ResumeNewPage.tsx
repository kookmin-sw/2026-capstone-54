/** 이력서 생성 페이지 — 파일 / 텍스트 / 구조화 3가지 모드 탭. */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileUp, FileText, Sparkles } from "lucide-react";
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
        <button
          onClick={() => navigate("/resume")}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#6B7280] hover:text-[#0A0A0A] mb-5 transition-colors"
        >
          <ArrowLeft size={14} /> 목록으로
        </button>

        <h1 className="text-[clamp(20px,2.2vw,28px)] font-black tracking-[-0.8px] text-[#0A0A0A] leading-[1.1] mb-2">
          새 이력서
        </h1>
        <p className="text-[13px] text-[#6B7280] mb-6">
          작성 방식을 선택하세요. 어떤 방식이든 결과는 동일한 정규화 형식으로 저장됩니다.
        </p>

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
