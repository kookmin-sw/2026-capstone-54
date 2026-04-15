/** 검색용 입력 필드 — 좌측 검색 아이콘 + 우측 지우기(X) 버튼 포함.
 *
 * `Input` 이 이모지 아이콘만 지원하고 clear 버튼도 없기 때문에,
 * 검색 UX 에 특화된 별도 컴포넌트로 분리되어 있다.
 * 모달 sticky 영역, 목록 필터 등 어디서든 공용으로 쓴다.
 */

import { Search, X } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** 접근성용 라벨. 기본값 "검색". */
  ariaLabel?: string;
  autoFocus?: boolean;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "검색...",
  ariaLabel = "검색",
  autoFocus = false,
  className = "",
}: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoFocus={autoFocus}
        className="w-full pl-9 pr-9 py-2 border border-[#E5E7EB] rounded-lg text-[13px] outline-none transition-colors focus:border-[#0991B2]"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="검색어 지우기"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded flex items-center justify-center text-[#9CA3AF] hover:text-[#0A0A0A] hover:bg-[#F3F4F6]"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
