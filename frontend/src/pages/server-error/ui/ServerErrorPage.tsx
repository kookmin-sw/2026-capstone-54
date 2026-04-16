import { Link } from "react-router-dom";

interface ServerErrorPageProps {
  code?: number;
  onRetry?: () => void;
}

export function ServerErrorPage({ code = 500, onRetry }: ServerErrorPageProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 헤더 */}
      <header className="h-[60px] flex items-center px-8 border-b border-[#E5E7EB]">
        <Link to="/" className="no-underline">
          <img src="/logo-korean.png" alt="미핏" className="h-[38px] w-auto" />
        </Link>
      </header>

      {/* 본문 */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-16">
        {/* 에러 코드 */}
        <p className="text-[13px] font-bold text-[#DC2626] tracking-widest uppercase mb-4">
          {code} Server Error
        </p>

        <h1 className="font-plex-sans-kr text-[32px] font-extrabold text-[#0A0A0A] mb-3 tracking-tight text-center leading-tight">
          서버에 문제가 발생했어요
        </h1>
        <p className="text-[15px] text-[#6B7280] leading-[1.7] mb-10 text-center">
          일시적인 오류입니다. 잠시 후 다시 시도해 주세요.
        </p>

        {/* 버튼 그룹 */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleRetry}
            className="inline-flex items-center justify-center text-[14px] font-bold text-white bg-[#0A0A0A] rounded-[8px] px-6 py-[11px] cursor-pointer border-none transition-all duration-150 hover:opacity-80 active:scale-[0.97]"
          >
            다시 시도하기
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center text-[14px] font-semibold text-[#374151] bg-white border border-[#E5E7EB] rounded-[8px] px-6 py-[11px] no-underline transition-all duration-150 hover:bg-[#F9FAFB]"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
