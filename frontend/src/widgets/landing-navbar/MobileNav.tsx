import { Link } from "react-router-dom";
import { useAuthStore } from "@/features/auth";

export function MobileNav() {
  const isAuthenticated = useAuthStore((s) => s.user !== null);

  return (
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
        className="flex items-center no-underline"
      >
        <img
          src="/logo-korean.png"
          alt="미핏"
          className="h-[40px] w-auto"
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
      </div>
    </nav>
  );
}
