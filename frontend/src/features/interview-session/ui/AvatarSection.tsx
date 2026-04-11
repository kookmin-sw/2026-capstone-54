import { useEffect, useRef } from "react";
import { PrettyAvatarProvider } from "@/shared/lib/avatar/PrettyAvatarProvider";
import type { IAvatarProvider } from "@/shared/lib/avatar/IAvatarProvider";

interface AvatarSectionProps {
  onReady?: (avatar: IAvatarProvider) => void;
  className?: string;
}

export function AvatarSection({ onReady, className = "" }: AvatarSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const providerRef = useRef<IAvatarProvider | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const provider = new PrettyAvatarProvider();
    providerRef.current = provider;
    provider.initialize(containerRef.current).then(() => {
      onReady?.(provider);
    });
    return () => {
      provider.destroy();
      providerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
    />
  );
}
