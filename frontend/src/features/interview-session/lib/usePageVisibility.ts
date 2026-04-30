/** document.visibilitychange + pagehide/pageshow 통합 훅 (탭 전환 / 창 최소화 / mobile 백그라운드 공통). */
import { useEffect, useState } from "react";

export function usePageVisibility(): boolean {
  const [visible, setVisible] = useState(() => {
    if (typeof document === "undefined") return true;
    return document.visibilityState !== "hidden";
  });

  useEffect(() => {
    const handleVisibility = () => setVisible(document.visibilityState !== "hidden");
    const handleHide = () => setVisible(false);
    const handleShow = () => setVisible(document.visibilityState !== "hidden");

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", handleHide);
    window.addEventListener("pageshow", handleShow);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handleHide);
      window.removeEventListener("pageshow", handleShow);
    };
  }, []);

  return visible;
}
