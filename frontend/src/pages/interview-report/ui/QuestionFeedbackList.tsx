import type { InterviewQuestionFeedback } from "@/features/interview-session";

interface QuestionFeedbackListProps {
  feedbacks: InterviewQuestionFeedback[];
  turnAnswerMap: Record<number, string>;
}

export function QuestionFeedbackList({ feedbacks, turnAnswerMap }: QuestionFeedbackListProps) {
  if (feedbacks.length === 0) return null;

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm mb-6">
      <h2 className="text-[13px] font-bold mb-4">질문별 피드백</h2>
      <div className="flex flex-col gap-6">
        {feedbacks.map((qf, i) => (
          <div key={qf.turnId ?? i} className="border-b border-[#F3F4F6] pb-6 last:border-b-0 last:pb-0">
            <p className="text-[13px] font-bold text-[#0A0A0A] mb-2">
              <span className="text-[#0991B2] mr-1">Q{i + 1}.</span>{qf.question}
            </p>

            {turnAnswerMap[qf.turnId] && (
              <div className="bg-[#F0F9FF] border border-[#BAE6FD] rounded-xl p-3 mb-3">
                <p className="text-[10px] font-bold text-[#0369A1] uppercase tracking-wide mb-1">내 답변</p>
                <p className="text-[12px] text-[#374151] leading-relaxed">{turnAnswerMap[qf.turnId]}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-3 max-sm:grid-cols-1">
              <div className="bg-[#F0FDF4] rounded-xl p-3">
                <p className="text-[10px] font-bold text-[#059669] uppercase tracking-wide mb-1.5">잘한 점</p>
                <ul className="flex flex-col gap-1">
                  {qf.strengths.map((s, j) => (
                    <li key={j} className="text-[11px] text-[#374151] flex items-start gap-1.5">
                      <span className="text-[#059669] shrink-0">✓</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-[#FFF7ED] rounded-xl p-3">
                <p className="text-[10px] font-bold text-[#D97706] uppercase tracking-wide mb-1.5">개선할 점</p>
                <ul className="flex flex-col gap-1">
                  {qf.improvements.map((s, j) => (
                    <li key={j} className="text-[11px] text-[#374151] flex items-start gap-1.5">
                      <span className="text-[#D97706] shrink-0">→</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {qf.modelAnswer && (
              <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-3">
                <p className="text-[10px] font-bold text-[#0991B2] uppercase tracking-wide mb-1">모범 답변</p>
                <p className="text-[12px] text-[#374151] leading-relaxed">{qf.modelAnswer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
