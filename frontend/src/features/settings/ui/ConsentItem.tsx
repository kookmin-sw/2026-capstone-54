import { TriangleAlert, ShieldCheck, FileText, Megaphone } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/shared/ui/Modal";
import { getTermsDocumentApi } from "@/features/auth/api/termsApi";

interface ConsentItemProps {
  termsDocumentId: number;
  title: string;
  termsType: string;
  version: number;
  isRequired: boolean;
  effectiveAt?: string | null;
  isAgreed?: boolean;
  onToggle?: (termsDocumentId: number, agreed: boolean) => void;
  isProPlan?: boolean;
}

export function ConsentItem({ termsDocumentId, title, termsType, version, isRequired, isAgreed, onToggle, isProPlan }: ConsentItemProps) {
  const versionStr = `v${version}`;
  const [modalOpen, setModalOpen] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isAiTerms = termsType === "ai_training_data";

  const getRequiredLabel = () => {
    if (isAiTerms && isProPlan) return "Pro에서 선택적 동의";
    if (isAiTerms && !isProPlan) return "Pro 요금제 사용시, 선택적 동의 가능";
    return isRequired ? "필수" : "선택";
  };

  const getIcon = () => {
    if (termsType === "terms_of_service") return <ShieldCheck size={14} className="text-[#0991B2]" />;
    if (termsType === "privacy_policy") return <FileText size={14} className="text-[#059669]" />;
    if (termsType === "marketing") return <Megaphone size={14} className="text-[#F97316]" />;
    return <TriangleAlert size={14} className="text-[#6B7280]" />;
  };

  const getBorderClass = () => {
    if (termsType === "ai_training_data") return "border-[rgba(9,145,178,0.3)] bg-[rgba(9,145,178,0.02)]";
    if (termsType === "marketing") return "border-[rgba(249,115,22,0.3)] bg-[rgba(249,115,22,0.02)]";
    return "border-[#E5E7EB]";
  };

  const handleTitleClick = async () => {
    setModalOpen(true);
    setLoading(true);
    const doc = await getTermsDocumentApi(termsDocumentId);
    setContent(doc?.content ?? null);
    setLoading(false);
  };

  return (
    <>
      <div className={`flex items-center justify-between px-4 py-[13px] bg-white border rounded-[10px] mb-2 last:mb-0 transition-all duration-150 hover:shadow-[0_2px_8px_rgba(0,0,0,0.1),0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-px ${getBorderClass()}`}>
        <div style={{ flex: 1 }}>
          <div className="flex items-center gap-[6px] mb-[3px] flex-wrap">
            {getIcon()}
            <span
              className="font-plex-sans-kr text-[13px] font-bold text-[#0A0A0A] cursor-pointer hover:underline"
              onClick={handleTitleClick}
            >
              {title}
            </span>
            <span className={`text-[10px] font-bold ${isAiTerms ? "text-[#0991B2]" : (isRequired ? "text-[#EF4444]" : "text-[#0991B2]")}`}>
              ({getRequiredLabel()})
            </span>
          </div>
          {isAgreed ? (
            <div className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0991B2] bg-[#E6F7FA] px-2 py-0.5 rounded-full mt-[5px]">
              {versionStr} · 동의 완료
            </div>
          ) : (
            <div className="inline-flex items-center gap-1 text-[10px] font-bold text-[#9CA3AF] bg-[#F3F4F6] px-2 py-0.5 rounded-full mt-[5px]">
              {(termsType === "ai_training_data" || termsType === "marketing") && <TriangleAlert size={10} />}
              {" "}동의 필요
            </div>
          )}
        </div>
        {(isAiTerms || termsType === "marketing") && (
          <button
            type="button"
            className={`w-10 h-[22px] rounded-full cursor-pointer relative transition-[background] duration-[250ms] shrink-0 border-none after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:w-4 after:h-4 after:rounded-full after:bg-white after:shadow-[0_1px_4px_rgba(0,0,0,0.15)] after:transition-transform after:duration-[250ms] after:[cubic-bezier(0.34,1.56,0.64,1)] ${isAgreed ? "bg-[#0991B2] after:translate-x-[18px]" : "bg-[#E5E7EB]"} ${isAiTerms && !isProPlan ? "cursor-not-allowed" : ""}`}
            onClick={() => (isAiTerms && !isProPlan) ? undefined : onToggle?.(termsDocumentId, !isAgreed)}
            aria-label={title}
            disabled={isAiTerms && !isProPlan}
          />
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={title}
        size="lg"
      >
        {loading ? (
          <div className="text-[14px] text-[#6B7280] py-8 text-center">약관을 불러오는 중...</div>
        ) : content ? (
          <div
            className="prose prose-sm max-w-none text-[14px] text-[#0A0A0A] leading-[1.7]"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <div className="text-[14px] text-[#6B7280] py-8 text-center">약관 내용을 불러올 수 없습니다.</div>
        )}
      </Modal>
    </>
  );
}
