import type { IAvatarProvider } from "./IAvatarProvider";

export class PrettyAvatarProvider implements IAvatarProvider {
  private container: HTMLElement | null = null;
  private audio: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private animationFrameId: number | null = null;
  private mouthElement: HTMLElement | null = null;
  private avatarWrapper: HTMLElement | null = null;
  private isDestroyed = false;
  private blinkTimeoutId: number | null = null;

  async initialize(container: HTMLElement): Promise<void> {
    this.container = container;

    const styleId = "pretty-avatar-style";
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement("style");
      styleEl.id = styleId;
      styleEl.innerHTML = `
        @keyframes floatHead {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50% { transform: translateY(-10px) rotate(1deg); }
        }
        .pretty-face {
          background: linear-gradient(135deg, #ffe0d2 0%, #ffcba4 100%);
          box-shadow: inset -10px -10px 20px rgba(200,100,50,0.2), 0 20px 40px rgba(0,0,0,0.4);
        }
        .pretty-eye { transition: transform 0.15s cubic-bezier(0.4,0,0.2,1); transform-origin: center; }
        .pretty-hair { background: linear-gradient(180deg, #2d3748 0%, #1a202c 100%); }
        .avatar-container { animation: floatHead 6s ease-in-out infinite; }
        .speaking-glow { box-shadow: inset -10px -10px 20px rgba(200,100,50,0.2), 0 0 60px rgba(96,165,250,0.3) !important; }
      `;
      document.head.appendChild(styleEl);
    }

    const wrapper = document.createElement("div");
    wrapper.className = "w-full h-full flex flex-col items-center justify-center relative overflow-hidden text-center";
    wrapper.style.background = "radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)";
    wrapper.innerHTML = `
      <div id="avatar-body-wrapper" class="avatar-container relative w-56 h-56 shrink-0">
        <div class="pretty-hair absolute -top-8 -left-4 w-64 h-36 rounded-t-[100px] rounded-b-3xl -z-10"></div>
        <div id="pretty-face" class="pretty-face w-full h-full rounded-[45%] flex flex-col items-center relative overflow-hidden border-4 border-white/5 transition-all duration-300">
          <div class="absolute top-[35%] left-[15%] w-10 h-6 bg-rose-400/30 rounded-full blur-md"></div>
          <div class="absolute top-[35%] right-[15%] w-10 h-6 bg-rose-400/30 rounded-full blur-md"></div>
          <div class="absolute top-[32%] w-full flex justify-between px-12">
            <div class="pretty-eye w-7 h-9 bg-white rounded-[50%] relative overflow-hidden shadow-inner">
              <div class="absolute bottom-1 right-1 w-4 h-5 bg-slate-800 rounded-full">
                <div class="absolute top-1 left-1 w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
            </div>
            <div class="pretty-eye w-7 h-9 bg-white rounded-[50%] relative overflow-hidden shadow-inner">
              <div class="absolute bottom-1 left-1 w-4 h-5 bg-slate-800 rounded-full">
                <div class="absolute top-1 left-1 w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
          <div class="absolute top-[29%] w-full flex justify-between px-8 pointer-events-none opacity-70">
            <div class="w-14 h-14 border-[3px] border-amber-600/60 rounded-[40%]"></div>
            <div class="absolute w-5 h-1 bg-amber-600/60 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
            <div class="w-14 h-14 border-[3px] border-amber-600/60 rounded-[40%]"></div>
          </div>
          <div class="absolute top-[62%] w-full flex justify-center">
            <div id="pretty-mouth" class="w-8 h-2 bg-[#881337] rounded-full transition-all duration-75 relative overflow-hidden">
              <div class="absolute top-0 w-full h-[30%] bg-white/90"></div>
              <div class="absolute bottom-0 w-full h-[40%] bg-rose-400/80 rounded-full transform translate-y-1/2"></div>
            </div>
          </div>
          <svg class="absolute top-0 left-0 w-full h-20" viewBox="0 0 100 40" preserveAspectRatio="none">
            <path d="M 0 0 L 100 0 L 100 15 Q 75 35 50 20 Q 25 35 0 15 Z" fill="#1e293b"/>
          </svg>
        </div>
        <div class="absolute -bottom-14 left-1/2 -translate-x-1/2 w-14 h-16 bg-[#e6bca0] -z-10 rounded-b-xl"></div>
        <div class="absolute -bottom-20 left-1/2 -translate-x-1/2 w-40 h-20 bg-indigo-600 -z-20 rounded-t-[40px]"></div>
      </div>
      <div id="avatar-status" class="mt-20 px-5 py-2 rounded-full bg-slate-800/80 border border-white/5 text-sm text-slate-300 font-medium flex items-center gap-2.5">
        <span class="w-2 h-2 rounded-full bg-slate-500"></span>
        <span class="status-text">AI 면접관 대기 중</span>
      </div>
    `;

    container.appendChild(wrapper);
    this.avatarWrapper = wrapper.querySelector("#avatar-body-wrapper");
    this.mouthElement = wrapper.querySelector("#pretty-mouth");
    this.startBlinking();
  }

  private startBlinking() {
    const blink = () => {
      if (this.isDestroyed || !this.container) return;
      const eyes = this.container.querySelectorAll(".pretty-eye") as NodeListOf<HTMLElement>;
      eyes.forEach((e) => (e.style.transform = "scaleY(0.1)"));
      setTimeout(() => {
        if (!this.isDestroyed) eyes.forEach((e) => (e.style.transform = "scaleY(1)"));
      }, 150);
      this.blinkTimeoutId = window.setTimeout(blink, Math.random() * 4000 + 2000);
    };
    blink();
  }

  async speak(audioUrlOrBase64: string, text: string): Promise<void> {
    this.stopAudio();
    this.setStatus("speaking");

    if (this.avatarWrapper) {
      this.avatarWrapper.style.transform = text.includes("?") ? "rotate(-3deg) scale(1.02)" : "";
    }
    const face = this.container?.querySelector("#pretty-face");
    face?.classList.add("speaking-glow");

    return new Promise((resolve) => {
      this.audio = new Audio(audioUrlOrBase64);
      this.audio.crossOrigin = "anonymous";

      const AudioCtxClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!;
      if (!this.audioCtx) {
        this.audioCtx = new AudioCtxClass();
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 256;
      }
      if (this.audioCtx.state === "suspended") this.audioCtx.resume();
      if (this.source) this.source.disconnect();
      this.source = this.audioCtx.createMediaElementSource(this.audio);
      this.source.connect(this.analyser!);
      this.analyser!.connect(this.audioCtx.destination);

      const dataArray = new Uint8Array(this.analyser!.frequencyBinCount);
      const renderFrame = () => {
        if (!this.analyser || !this.mouthElement || !this.audio || this.audio.paused) return;
        this.analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        if (avg > 5) {
          const h = Math.min(48, 8 + (avg / 255) * 50);
          const w = Math.max(24, 32 - (avg / 255) * 10);
          const r = Math.min(24, 10 + (avg / 255) * 20);
          this.mouthElement.style.height = `${h}px`;
          this.mouthElement.style.width = `${w}px`;
          this.mouthElement.style.borderRadius = `${r}px`;
        } else {
          this.resetMouth();
        }
        this.animationFrameId = requestAnimationFrame(renderFrame);
      };

      this.audio.onplay = renderFrame;
      this.audio.onended = () => { this.stopAudio(); resolve(); };
      this.audio.onerror = () => { this.stopAudio(); resolve(); };
      this.audio.play().catch(() => { this.stopAudio(); resolve(); });
    });
  }

  private resetMouth() {
    if (!this.mouthElement) return;
    this.mouthElement.style.height = "8px";
    this.mouthElement.style.width = "32px";
    this.mouthElement.style.borderRadius = "10px";
  }

  private setStatus(state: "speaking" | "idle") {
    const dot = this.container?.querySelector("#avatar-status span") as HTMLElement | null;
    const text = this.container?.querySelector(".status-text");
    if (state === "speaking") {
      dot?.setAttribute("class", "w-2 h-2 rounded-full bg-green-400 animate-pulse");
      if (text) text.textContent = "질문 중...";
    } else {
      dot?.setAttribute("class", "w-2 h-2 rounded-full bg-slate-500");
      if (text) text.textContent = "AI 면접관 대기 중";
    }
  }

  private stopAudio() {
    if (this.animationFrameId) { cancelAnimationFrame(this.animationFrameId); this.animationFrameId = null; }
    if (this.audio) { this.audio.pause(); this.audio.currentTime = 0; this.audio = null; }
    this.resetMouth();
    if (this.avatarWrapper) this.avatarWrapper.style.transform = "";
    this.container?.querySelector("#pretty-face")?.classList.remove("speaking-glow");
    this.setStatus("idle");
  }

  stop(): void { this.stopAudio(); }

  destroy(): void {
    this.isDestroyed = true;
    this.stopAudio();
    if (this.blinkTimeoutId) clearTimeout(this.blinkTimeoutId);
    if (this.source) this.source.disconnect();
    if (this.audioCtx && this.audioCtx.state !== "closed") this.audioCtx.close();
    if (this.container) this.container.innerHTML = "";
    this.mouthElement = null;
    this.avatarWrapper = null;
  }
}
