import { Link, useNavigate } from "react-router-dom";
import { useSessionStore } from "@/entities/session";

const NAV_LINKS = [
  { label: "서비스 소개", href: "#hero", emoji: "✨" },
  { label: "기능", href: "#features", emoji: "⚡" },
  { label: "요금제", href: "#pricing", emoji: "💎" },
  { label: "면접 후기", href: "#reviews", emoji: "💬" },
];

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);
  const navigate = useNavigate();

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 190,
          background: "rgba(0,0,0,0.35)",
          backdropFilter: "blur(4px)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.3s",
        }}
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="내비게이션 메뉴"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "75vw",
          maxWidth: 300,
          zIndex: 210,
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          padding: "80px 24px 32px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: "-20px 0 60px rgba(0,0,0,0.08)",
        }}
      >
        {/* 메뉴 링크 목록 */}
        {NAV_LINKS.map((item) => (
          <a
            key={item.href}
            href={item.href}
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 16px",
              borderRadius: 16,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 15,
              fontWeight: 600,
              color: "#1C1828",
              textDecoration: "none",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "rgba(0,0,0,0.04)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "none";
            }}
          >
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                background: "rgba(0,0,0,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                flexShrink: 0,
              }}
            >
              {item.emoji}
            </span>
            {item.label}
          </a>
        ))}

        {/* 구분선 */}
        <div
          style={{
            height: 1,
            background: "rgba(0,0,0,0.06)",
            margin: "8px 0",
          }}
        />

        {/* CTA 버튼 영역 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {isAuthenticated ? (
            <button
              onClick={() => {
                navigate("/dashboard");
                onClose();
              }}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 15,
                fontWeight: 700,
                color: "#fff",
                background: "#0A0A0A",
                border: "none",
                cursor: "pointer",
                padding: "15px 0",
                borderRadius: 8,
                width: "100%",
                boxShadow: "none",
              }}
            >
              대시보드 바로가기
            </button>
          ) : (
            <>
              <Link
                to="/login"
                onClick={onClose}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#1C1828",
                  background: "rgba(255,255,255,0.85)",
                  textDecoration: "none",
                  padding: "15px 0",
                  borderRadius: 8,
                  textAlign: "center",
                  boxShadow: "none",
                  display: "block",
                }}
              >
                로그인
              </Link>
              <Link
                to="/sign-up"
                onClick={onClose}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#fff",
                  background: "#0A0A0A",
                  textDecoration: "none",
                  padding: "15px 0",
                  borderRadius: 8,
                  textAlign: "center",
                  boxShadow: "none",
                  display: "block",
                }}
              >
                무료 시작하기 →
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
