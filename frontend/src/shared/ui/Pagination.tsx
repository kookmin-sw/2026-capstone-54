/** 이전/다음 버튼과 페이지 번호를 표시하는 페이지네이션. */
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className = "" }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="px-3 py-1.5 text-sm font-semibold text-mefit-gray-500 border border-mefit-gray-200 rounded-lg hover:bg-mefit-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        ← 이전
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`w-8 h-8 text-sm font-bold rounded-lg border transition-colors ${
            p === currentPage
              ? "bg-mefit-black text-white border-mefit-black"
              : "text-mefit-gray-500 border-mefit-gray-200 hover:bg-mefit-gray-50"
          }`}
        >
          {p}
        </button>
      ))}

      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="px-3 py-1.5 text-sm font-semibold text-mefit-gray-500 border border-mefit-gray-200 rounded-lg hover:bg-mefit-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        다음 →
      </button>
    </div>
  );
}
