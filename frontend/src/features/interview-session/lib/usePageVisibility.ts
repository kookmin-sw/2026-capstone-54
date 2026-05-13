import { useEffect, useState } from "react";

function computeVisible(): boolean {
  if (typeof document === "undefined") return true;
  if (document.visibilityState === "hidden") return false;
  if (typeof document.hasFocus === "function" && !document.hasFocus()) return false;
  return true;
}

export function usePageVisibility(): boolean {
  const [visible, setVisible] = useState(computeVisible);

  useEffect(() => {
    const handleVisibility = () => setVisible(computeVisible());
    const handleHide = () => setVisible(false);
    const handleShow = () => setVisible(computeVisible());
    const handleBlur = () => setVisible(false);
    const handleFocus = () => setVisible(computeVisible());

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", handleHide);
    window.addEventListener("pageshow", handleShow);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handleHide);
      window.removeEventListener("pageshow", handleShow);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  return visible;
}
