import { Link } from "react-router-dom";

export function NotFoundPage() {
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
        <p className="text-[13px] font-bold text-[#0991B2] tracking-widest uppercase mb-4">
          404 Not Found
        </p>

        <h1 className="font-plex-sans-kr text-[32px] font-extrabold text-[#0A0A0A] mb-3 tracking-tight text-center leading-tight">
          페이지를 찾을 수 없어요
        </h1>
        <p className="text-[15px] text-[#6B7280] leading-[1.7] mb-10 text-center">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </p>

        {/* 버튼 그룹 */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center text-[14px] font-bold text-white bg-[#0A0A0A] rounded-[8px] px-6 py-[11px] no-underline transition-all duration-150 hover:opacity-80 active:scale-[0.97]"
          >
            홈으로 돌아가기
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center text-[14px] font-semibold text-[#374151] bg-white border border-[#E5E7EB] rounded-[8px] px-6 py-[11px] cursor-pointer transition-all duration-150 hover:bg-[#F9FAFB]"
          >
            이전 페이지로
          </button>
        </div>
      </div>
    </div>
  );
}
