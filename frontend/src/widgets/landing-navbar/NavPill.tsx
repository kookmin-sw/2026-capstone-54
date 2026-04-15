import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/features/auth";

const NAV_LINKS = [
  { label: "서비스 소개", href: "#hero" },
  { label: "기능", href: "#features" },
  { label: "요금제", href: "#pricing" },
  { label: "면접 후기", href: "#reviews" },
];

export function NavPill() {
  const [scrolled, setScrolled] = useState(false);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = user !== null;
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 200,
        padding: scrolled ? "4px 40px" : "14px 40px",
        display: "flex",
        justifyContent: "center",
        background: scrolled ? "rgba(255,255,255,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid #E5E7EB" : "1px solid transparent",
        transition: "padding 0.3s, background 0.3s, border-bottom 0.3s, backdrop-filter 0.3s",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          maxWidth: 1080,
          background: scrolled ? "transparent" : "rgba(255,255,255,0.92)",
          backdropFilter: scrolled ? "none" : "blur(12px)",
          WebkitBackdropFilter: scrolled ? "none" : "blur(12px)",
          borderRadius: scrolled ? 0 : 8,
          border: scrolled ? "1px solid transparent" : "1px solid #E5E7EB",
          padding: scrolled ? "8px 0" : "10px 10px 10px 24px",
          boxShadow: scrolled ? "none" : "0 1px 3px rgba(0,0,0,0.08)",
          transition: "all 0.3s",
        }}
      >
        {/* 로고 */}
        <Link
          to="/"
          className="flex items-center no-underline"
        >
          <img 
            src="/logo-korean.png" 
            alt="미핏" 
            className="h-[46px] w-auto"
          />
        </Link>

        {/* 메뉴 링크 */}
        <ul
          style={{
            display: "flex",
            gap: 32,
            listStyle: "none",
            margin: 0,
            padding: 0,
          }}
        >
          {NAV_LINKS.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#6B7280",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) =>
                  ((e.target as HTMLElement).style.color = "#0A0A0A")
                }
                onMouseLeave={(e) =>
                  ((e.target as HTMLElement).style.color = "#6B7280")
                }
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        {/* 우측 버튼 영역 */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {isAuthenticated ? (
            <button
              onClick={() => navigate("/")}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 14,
                fontWeight: 700,
                color: "#fff",
                background: "#0A0A0A",
                border: "none",
                cursor: "pointer",
                padding: "10px 20px",
                borderRadius: 6,
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.opacity = "0.85";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.opacity = "1";
              }}
            >
              대시보드 바로가기
            </button>
          ) : (
            <>
              <Link
                to="/login"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#6B7280",
                  background: "none",
                  textDecoration: "none",
                  padding: "10px 16px",
                  borderRadius: 6,
                  transition: "color 0.2s, background 0.2s",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.color = "#0A0A0A";
                  el.style.background = "#F9FAFB";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.color = "#6B7280";
                  el.style.background = "none";
                }}
              >
                로그인
              </Link>
              <Link
                to="/sign-up"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#fff",
                  background: "#0A0A0A",
                  textDecoration: "none",
                  padding: "10px 20px",
                  borderRadius: 6,
                  transition: "opacity 0.2s",
                  display: "inline-block",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.opacity = "0.85";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.opacity = "1";
                }}
              >
                무료 시작하기
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
