/** STT 가 답변의 source 가 아니라 보조 역할이라는 안내 (사용자가 한 번만 보고 닫을 수 있음). */
import { useState } from "react";

const STORAGE_KEY = "stt_aid_notice_dismissed";

export function SttAidNotice() {
  const [visible, setVisible] = useState(() => localStorage.getItem(STORAGE_KEY) !== "1");

  if (!visible) return null;

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  return (
    <div role="status" style={containerStyle}>
      <div style={textColStyle}>
        <p style={titleStyle}>실시간 자막은 보조 역할입니다</p>
        <p style={bodyStyle}>
          화면에 표시되는 실시간 인식 결과는 발화 중 참고용입니다. 면접 종료 후 비디오 / 오디오가 서버로 제출되어 별도 분석 (자체 STT + LLM) 됩니다.
        </p>
      </div>
      <button type="button" onClick={handleDismiss} style={buttonStyle}>
        확인
      </button>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  position: "fixed",
  left: 16,
  bottom: 16,
  zIndex: 30,
  maxWidth: 360,
  display: "flex",
  gap: 12,
  padding: "12px 14px",
  borderRadius: 10,
  background: "rgba(15, 23, 42, 0.92)",
  color: "#f1f5f9",
  border: "1px solid rgba(148, 163, 184, 0.4)",
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
};

const textColStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  flex: 1,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 13,
  fontWeight: 700,
};

const bodyStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  lineHeight: 1.45,
  color: "#cbd5e1",
};

const buttonStyle: React.CSSProperties = {
  alignSelf: "flex-start",
  padding: "6px 12px",
  borderRadius: 6,
  border: "1px solid rgba(148, 163, 184, 0.5)",
  background: "transparent",
  color: "#f1f5f9",
  fontSize: 12,
  cursor: "pointer",
};
