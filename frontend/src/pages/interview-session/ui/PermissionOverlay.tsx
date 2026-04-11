import { ShieldAlert } from "lucide-react";

interface PermissionOverlayProps {
  onReload: () => void;
  onGoResults: () => void;
}

export function PermissionOverlay({ onReload, onGoResults }: PermissionOverlayProps) {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#111827] flex flex-col">
      <div className="h-[60px] flex items-center justify-between px-8 bg-[#1C1917] shrink-0">
        <img src="/logo-korean.png" alt="미핏" className="h-8 w-auto" />
        <div className="flex items-center gap-1.5 bg-[#EF444420] rounded-full px-3 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
          <span className="text-[12px] font-semibold text-[#EF4444]">면접 중단됨</span>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-[#1F2937] rounded-2xl p-12 flex flex-col gap-8 w-full max-w-[560px]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-[72px] h-[72px] rounded-full bg-[#EF444420] flex items-center justify-center">
              <ShieldAlert size={32} className="text-[#EF4444]" />
            </div>
            <h2 className="text-2xl font-bold text-white text-center">권한이 차단되었습니다</h2>
            <p className="text-[14px] text-[#9CA3AF] leading-relaxed text-center max-w-[464px]">
              면접 진행 중 카메라 또는 마이크 권한이 차단되었습니다. 면접을 계속하려면 브라우저 권한을 다시 허용해야 합니다.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { icon: "🔒", text: "브라우저 주소창 왼쪽 자물쇠 아이콘을 클릭하세요" },
              { icon: "⚙️", text: "사이트 설정 → 카메라 / 마이크를 찾으세요" },
              { icon: "✅", text: "'허용'으로 변경 후 페이지를 새로고침하세요" },
            ].map((s, i) => (
              <div key={i} className="bg-[#374151] rounded-[10px] h-[52px] px-4 flex items-center gap-3">
                <span className="text-base shrink-0">{s.icon}</span>
                <span className="text-[13px] text-white font-medium">{s.text}</span>
              </div>
            ))}
          </div>
          <div className="bg-[#111827] rounded-[10px] p-4 flex flex-col gap-2">
            <p className="text-[12px] font-semibold text-[#6B7280]">해결 방법</p>
            <p className="text-[13px] text-[#9CA3AF] leading-relaxed">
              브라우저 주소창 왼쪽 자물쇠 아이콘 → 사이트 설정 → 카메라/마이크를 '허용'으로 변경 후 페이지를 새로고침하세요.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button onClick={onReload} className="w-full h-12 rounded-[10px] bg-[#0991B2] text-white font-bold text-[14px] hover:opacity-90 transition-opacity">
              권한 허용 후 새로고침
            </button>
            <button onClick={onGoResults} className="w-full h-12 rounded-[10px] bg-[#374151] text-white font-semibold text-[14px] hover:bg-[#4B5563] transition-colors">
              면접 결과로 이동
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
