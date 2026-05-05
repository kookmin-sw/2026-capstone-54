import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import { useReducedMotion } from "@/shared/lib/animation";

interface LottiePlayerProps {
  src: string;
  loop?: boolean;
  autoplay?: boolean;
  speed?: number;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
}

export function LottiePlayer({
  src,
  loop = true,
  autoplay = true,
  speed = 1,
  className = "",
  style,
  ariaLabel,
}: LottiePlayerProps) {
  const [data, setData] = useState<unknown>(null);
  const [failed, setFailed] = useState(false);
  const lottieRef = useRef<LottieRefCurrentProps | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    let aborted = false;
    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`Lottie fetch failed: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (!aborted) setData(json);
      })
      .catch(() => {
        if (!aborted) setFailed(true);
      });
    return () => {
      aborted = true;
    };
  }, [src]);

  useEffect(() => {
    const player = lottieRef.current;
    if (!player) return;
    if (reduced) {
      player.goToAndStop(0, true);
    } else {
      player.setSpeed(speed);
      if (autoplay) player.play();
    }
  }, [reduced, autoplay, speed]);

  if (failed || !data) {
    return (
      <div
        aria-hidden="true"
        className={className}
        style={style}
      />
    );
  }

  return (
    <Lottie
      lottieRef={lottieRef}
      animationData={data}
      loop={loop && !reduced}
      autoplay={autoplay && !reduced}
      className={className}
      style={style}
      role="img"
      aria-label={ariaLabel}
    />
  );
}
