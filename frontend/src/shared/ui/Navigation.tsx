import { Link } from "react-router-dom";
import { useSessionStore } from "@/entities/session";

interface NavItem {
  to: string;
  label: string;
  active?: boolean;
}

interface NavigationProps {
  items?: NavItem[];
  className?: string;
}

const defaultItems: NavItem[] = [
  { to: "/home", label: "홈" },
  { to: "/jd", label: "채용공고" },
  { to: "/interview", label: "면접 시작" },
  { to: "/resume", label: "이력서" },
];

export function Navigation({ items = defaultItems, className = "" }: NavigationProps) {
  const { user } = useSessionStore();

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[200] py-[14px] px-8 flex justify-center max-sm:py-3 max-sm:px-4 ${className}`}>
      <div className="flex items-center justify-between w-full max-w-container-lg bg-white/[.92] backdrop-blur-[20px] border border-[#E5E7EB] rounded-lg p-[8px_8px_8px_24px] shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)]">
        <Link to="/home" className="flex items-center">
          <img src="/logo-korean.png" alt="미핏" className="h-[34px] w-auto" />
        </Link>
        <ul className="flex gap-1 list-none">
          {items.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className={`text-[13px] font-${item.active ? "bold" : "medium"} ${
                  item.active
                    ? "text-[#0991B2] bg-[#E6F7FA]"
                    : "text-[#6B7280] hover:text-[#0A0A0A] hover:bg-[rgba(9,145,178,0.06)]"
                } no-underline py-2 px-3.5 rounded-lg transition-all`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#06B6D4] to-[#0891B2] flex items-center justify-center text-[13px] font-bold text-white shadow-[0_1px_3px_rgba(0,0,0,0.1)] cursor-pointer">
          {user?.initial || "U"}
        </div>
      </div>
    </nav>
  );
}
