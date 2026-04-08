import { Link } from "react-router-dom";
import { useNavbarStore } from "./store";
import { MobileDrawer } from "./MobileDrawer";
import { useSessionStore } from "@/entities/session";

export function MobileNav() {
  const { isMobileDrawerOpen, toggleDrawer, closeDrawer } = useNavbarStore();
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);

  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 200,
          height: 56,
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid #E5E7EB",
        }}
      >
        {/* 로고 */}
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
          }}
        >
          <img 
            src="/logo-korean.png" 
            alt="미핏" 
            style={{
              height: 40,
              width: "auto",
            }}
          />
        </Link>

        {/* 우측 */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!isAuthenticated && (
            <Link
              to="/login"
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#6B7280",
                background: "none",
                textDecoration: "none",
                padding: "8px 12px",
                borderRadius: 6,
              }}
            >
              로그인
            </Link>
          )}

          {/* 햄버거 버튼 */}
          <button
            onClick={toggleDrawer}
            aria-label="메뉴 열기"
            aria-expanded={isMobileDrawerOpen}
            style={{
              width: 36,
              height: 36,
              borderRadius: 6,
              background: "#F9FAFB",
              border: "1px solid #E5E7EB",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            <span
              style={{
                display: "block",
                width: 16,
                height: 1.5,
                background: "#0A0A0A",
                borderRadius: 2,
                transition: "transform 0.25s, opacity 0.25s",
                transform: isMobileDrawerOpen
                  ? "translateY(5.5px) rotate(45deg)"
                  : "none",
              }}
            />
            <span
              style={{
                display: "block",
                width: 16,
                height: 1.5,
                background: "#0A0A0A",
                borderRadius: 2,
                opacity: isMobileDrawerOpen ? 0 : 1,
                transition: "opacity 0.25s",
              }}
            />
            <span
              style={{
                display: "block",
                width: 16,
                height: 1.5,
                background: "#0A0A0A",
                borderRadius: 2,
                transition: "transform 0.25s, opacity 0.25s",
                transform: isMobileDrawerOpen
                  ? "translateY(-5.5px) rotate(-45deg)"
                  : "none",
              }}
            />
          </button>
        </div>
      </nav>

      <MobileDrawer isOpen={isMobileDrawerOpen} onClose={closeDrawer} />
    </>
  );
}
