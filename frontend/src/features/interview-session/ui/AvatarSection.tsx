import { useEffect, useRef } from "react";
import { PrettyAvatarProvider } from "@/shared/lib/avatar/PrettyAvatarProvider";
import { FriendlyAvatarProvider } from "@/shared/lib/avatar/FriendlyAvatarProvider";
import { PressureAvatarProvider } from "@/shared/lib/avatar/PressureAvatarProvider";
import type { IAvatarProvider } from "@/shared/lib/avatar/IAvatarProvider";
import type { InterviewDifficultyLevel } from "@/features/interview-session/api/types";

interface AvatarSectionProps {
  difficulty?: InterviewDifficultyLevel;
  onReady?: (avatar: IAvatarProvider) => void;
  className?: string;
}

function createProvider(difficulty: InterviewDifficultyLevel): IAvatarProvider {
  switch (difficulty) {
    case "friendly": return new FriendlyAvatarProvider();
    case "pressure": return new PressureAvatarProvider();
    case "normal":
    default:         return new PrettyAvatarProvider();
  }
}

export function AvatarSection({ difficulty, onReady, className = "" }: AvatarSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const providerRef = useRef<IAvatarProvider | null>(null);
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  });

  useEffect(() => {
    if (!containerRef.current || difficulty === undefined) return;
    const provider = createProvider(difficulty);
    providerRef.current = provider;
    provider.initialize(containerRef.current).then(() => {
      onReadyRef.current?.(provider);
    });
    return () => {
      provider.destroy();
      providerRef.current = null;
    };
  }, [difficulty]);  

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
    />
  );
}
