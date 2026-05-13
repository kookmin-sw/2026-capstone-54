import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export function InterviewCompletePage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle className="w-16 h-16 text-[#0991B2]" />
        </div>

        <h1 className="text-2xl font-black text-[#0A0A0A] mb-3">
          면접이 종료되었습니다
        </h1>

        <p className="text-[15px] text-[#4B5563] leading-relaxed mb-8">
          수고하셨습니다!<br />
          면접 결과는 <span className="font-bold text-[#0A0A0A]">분석 &gt; 면접 결과</span>에서<br />
          리포트 생성 기능을 통해 확인할 수 있습니다.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            to="/interview/results"
            className="w-full py-3.5 rounded-xl font-bold text-base text-white bg-[#0A0A0A] flex items-center justify-center no-underline hover:opacity-85 transition-opacity"
          >
            면접 결과 보기 →
          </Link>
          <Link
            to="/"
            className="w-full py-3.5 rounded-xl font-bold text-base text-[#374151] bg-white border border-[#E5E7EB] flex items-center justify-center no-underline hover:bg-[#F9FAFB] transition-colors"
          >
            홈으로 이동
          </Link>
        </div>
      </div>
    </div>
  );
}
