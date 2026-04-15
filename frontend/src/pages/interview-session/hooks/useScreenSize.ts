import { useEffect, useState } from "react";

export function useScreenSize(minWidth = 1024, minHeight = 768) {
  const [screenSize, setScreenSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const onResize = () => setScreenSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isTooSmall = screenSize.w < minWidth || screenSize.h < minHeight;
  return { screenSize, isTooSmall };
}
