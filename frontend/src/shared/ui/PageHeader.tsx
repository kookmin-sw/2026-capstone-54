/** 페이지 상단에 뱃지, 제목, 부제목, 액션 버튼을 배치하는 헤더. */
import type { ReactNode } from "react";

interface PageHeaderProps {
  badge?: string;
  title: string | ReactNode;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({ badge, title, description, action, className = "" }: PageHeaderProps) {
  return (
    <div className={`flex items-start justify-between mb-8 gap-4 ${className}`}>
      <div>
        {badge && (
          <div className="inline-flex items-center gap-1.5 text-2xs font-bold tracking-[1.4px] uppercase text-mefit-primary bg-mefit-primary-light py-1 px-3 rounded-full mb-2.5">
            {badge}
          </div>
        )}
        <h1 className="text-[clamp(24px,3vw,36px)] font-black tracking-[-0.8px] text-mefit-black leading-[1.1]">
          {title}
        </h1>
        {description && <p className="text-base text-mefit-gray-500 mt-1.5">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
