import { useEffect, useState } from "react";

export function usePermissionMonitor(active: boolean) {
  const [permissionError, setPermissionError] = useState(false);

  useEffect(() => {
    if (!active) return;
    const check = async () => {
      try {
        const [cam, mic] = await Promise.all([
          navigator.permissions.query({ name: "camera" as PermissionName }),
          navigator.permissions.query({ name: "microphone" as PermissionName }),
        ]);
        if (cam.state === "denied" || mic.state === "denied") setPermissionError(true);
      } catch { /* not available */ }
    };
    const id = setInterval(check, 8000);
    return () => clearInterval(id);
  }, [active]);

  return permissionError;
}
