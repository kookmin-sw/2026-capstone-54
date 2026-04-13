interface ResumeTextContentSectionProps {
  content: string;
}

/** 텍스트 이력서 본문(읽기 전용) 섹션. */
export function ResumeTextContentSection({ content }: ResumeTextContentSectionProps) {
  return (
    <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-6">
      <h2 className="text-[13px] font-extrabold text-[#0A0A0A] mb-3">이력서 본문</h2>
      <pre className="text-[13px] text-[#374151] leading-[1.7] whitespace-pre-wrap font-sans">
        {content}
      </pre>
    </div>
  );
}
