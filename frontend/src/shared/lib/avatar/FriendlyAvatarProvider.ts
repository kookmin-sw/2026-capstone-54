import type { IAvatarProvider } from "./IAvatarProvider";

export class FriendlyAvatarProvider implements IAvatarProvider {
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
    this.injectStyles();
    const wrapper = this.buildHTML();
    container.appendChild(wrapper);
    this.avatarWrapper = wrapper.querySelector("#friendly-body-wrapper");
    this.mouthElement = wrapper.querySelector("#friendly-mouth");
    this.startBlinking();
  }

  private injectStyles(): void {
    const styleId = "friendly-avatar-style";
    if (document.getElementById(styleId)) return;
    const styleEl = document.createElement("style");
    styleEl.id = styleId;
    styleEl.innerHTML = `
      @keyframes friendlyFloat {
        0%, 100% { transform: translateY(0px) rotate(-0.5deg); }
        30% { transform: translateY(-12px) rotate(1deg); }
        60% { transform: translateY(-6px) rotate(-0.5deg); }
      }
      @keyframes friendlyNod {
        0%, 100% { transform: rotate(0deg); }
        25% { transform: rotate(3deg); }
        75% { transform: rotate(-2deg); }
      }
      .friendly-face {
        background: linear-gradient(160deg, #e8b89a 0%, #d4956a 60%, #c07a50 100%);
        box-shadow: inset -8px -12px 20px rgba(160,80,30,0.25), inset 4px 4px 12px rgba(255,220,190,0.3), 0 20px 50px rgba(0,0,0,0.35);
      }
      .friendly-eye { transition: transform 0.12s cubic-bezier(0.4,0,0.2,1); transform-origin: center; }
      .friendly-container { animation: friendlyFloat 5s ease-in-out infinite; }
      .friendly-speaking { animation: friendlyFloat 5s ease-in-out infinite, friendlyNod 1.2s ease-in-out infinite; }
      .friendly-glow { box-shadow: inset -8px -12px 20px rgba(160,80,30,0.25), inset 4px 4px 12px rgba(255,220,190,0.3), 0 0 50px rgba(251,191,36,0.35) !important; }
    `;
    document.head.appendChild(styleEl);
  }

  private buildHTML(): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.className = "w-full h-full flex flex-col items-center justify-center relative overflow-hidden";
    wrapper.style.background = "#080f1a";
    wrapper.innerHTML = `
      <div id="friendly-body-wrapper" class="friendly-container relative w-56 h-56 shrink-0">
        <div class="absolute -top-8 -left-4 -z-10"
          style="width:256px; height:144px; background:linear-gradient(180deg,#7B5236 0%,#5a3a20 100%); border-radius:100px 100px 30px 30px;"></div>
        <div class="absolute -z-10"
          style="width:18px; height:26px; background:linear-gradient(160deg,#e8b89a,#c07a50); border-radius:50%; top:38%; left:-6px; box-shadow:inset 3px 0 6px rgba(160,80,30,0.3);">
          <div style="position:absolute; top:25%; left:20%; width:8px; height:14px; background:rgba(160,80,30,0.2); border-radius:50%;"></div>
        </div>
        <div class="absolute -z-10"
          style="width:18px; height:26px; background:linear-gradient(160deg,#e8b89a,#c07a50); border-radius:50%; top:38%; right:-6px; box-shadow:inset -3px 0 6px rgba(160,80,30,0.3);">
          <div style="position:absolute; top:25%; right:20%; width:8px; height:14px; background:rgba(160,80,30,0.2); border-radius:50%;"></div>
        </div>
        <div id="friendly-face" class="friendly-face w-full h-full rounded-[42%] flex flex-col items-center relative overflow-hidden transition-all duration-300">
          <div class="absolute top-[42%] left-[8%] w-12 h-7 rounded-full blur-lg opacity-50" style="background:#e07050;"></div>
          <div class="absolute top-[42%] right-[8%] w-12 h-7 rounded-full blur-lg opacity-50" style="background:#e07050;"></div>
          <div class="absolute top-[24%] w-full flex justify-between px-10">
            <svg width="32" height="12" viewBox="0 0 32 12"><path d="M 2 10 Q 8 1 30 4" stroke="#5a3a20" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>
            <svg width="32" height="12" viewBox="0 0 32 12"><path d="M 30 10 Q 24 1 2 4" stroke="#5a3a20" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>
          </div>
          <div class="absolute top-[33%] w-full flex justify-between px-10">
            <div class="friendly-eye w-9 h-10 bg-white rounded-full relative overflow-hidden shadow-md">
              <div class="absolute bottom-1 right-1 w-6 h-7 rounded-full" style="background:#3d2010;">
                <div class="absolute top-1 right-1 w-2 h-2 bg-white rounded-full opacity-90"></div>
                <div class="absolute bottom-1 left-0.5 w-1 h-1 bg-white rounded-full opacity-50"></div>
              </div>
            </div>
            <div class="friendly-eye w-9 h-10 bg-white rounded-full relative overflow-hidden shadow-md">
              <div class="absolute bottom-1 left-1 w-6 h-7 rounded-full" style="background:#3d2010;">
                <div class="absolute top-1 left-1 w-2 h-2 bg-white rounded-full opacity-90"></div>
                <div class="absolute bottom-1 right-0.5 w-1 h-1 bg-white rounded-full opacity-50"></div>
              </div>
            </div>
          </div>
          <div class="absolute top-[54%] left-1/2 -translate-x-1/2"
            style="width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-top:7px solid rgba(160,80,40,0.25);"></div>
          <div class="absolute top-[65%] w-full flex justify-center">
            <div id="friendly-mouth" class="relative overflow-hidden transition-all duration-75"
              style="width:38px; height:10px; border-radius:0 0 20px 20px; background:#7a2020;">
              <div class="absolute top-0 w-full h-[25%]" style="background:rgba(255,255,255,0.85);"></div>
              <div class="absolute bottom-0 w-full h-[40%] rounded-full" style="background:#c06060; transform:translateY(40%);"></div>
            </div>
          </div>
          <svg class="absolute top-0 left-0 w-full h-20" viewBox="0 0 100 40" preserveAspectRatio="none">
            <path d="M 0 0 L 100 0 L 100 15 Q 75 35 50 20 Q 25 35 0 15 Z" fill="#7B5236"/>
          </svg>
        </div>
        <div class="absolute pointer-events-none" style="top:-32px; left:-16px; width:256px; height:144px; z-index:1;">
          <svg width="256" height="144" viewBox="0 0 256 144" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="f-fg-hair-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#7B5236"/>
                <stop offset="100%" stop-color="#5a3a20"/>
              </linearGradient>
              <clipPath id="f-hair-shape-clip">
                <path d="M 100 0 L 156 0 Q 256 0 256 100 L 256 114 Q 256 144 226 144 L 30 144 Q 0 144 0 114 L 0 100 Q 0 0 100 0 Z"/>
              </clipPath>
            </defs>
            <g clip-path="url(#f-hair-shape-clip)">
              <path d="M 0 0 L 256 0 L 256 108 Q 240 98 224 106 Q 208 114 192 104 Q 176 94 160 103 Q 144 112 128 72 Q 112 112 96 103 Q 80 94 64 104 Q 48 114 32 106 Q 16 98 0 108 Z" fill="url(#f-fg-hair-grad)"/>
            </g>
          </svg>
        </div>
        <div class="absolute pointer-events-none" style="bottom:-100px; left:50%; transform:translateX(-50%); width:280px; height:110px; z-index:-1;">
          <svg width="280" height="110" viewBox="0 0 280 110" xmlns="http://www.w3.org/2000/svg">
            <path d="M 0 50 Q 0 30 24 26 L 95 18 L 140 32 L 185 18 L 256 26 Q 280 30 280 50 L 280 110 L 0 110 Z" fill="#4a5e3a"/>
            <path d="M 0 50 Q 0 30 24 26 L 95 18 L 85 34 L 28 44 Q 10 48 0 58 Z" fill="#3d4f30"/>
            <path d="M 280 50 Q 280 30 256 26 L 185 18 L 195 34 L 252 44 Q 270 48 280 58 Z" fill="#3d4f30"/>
            <path d="M 105 75 Q 140 70 175 75 L 175 110 L 105 110 Z" fill="#3d4f30" opacity="0.5"/>
            <line x1="140" y1="46" x2="140" y2="110" stroke="#3d4f30" stroke-width="2"/>
            <rect x="134" y="46" width="12" height="7" rx="2" fill="#6b7280"/>
            <rect x="116" y="0" width="48" height="40" rx="8" fill="#d4956a"/>
            <path d="M 140 34 L 100 20 L 92 34 L 130 46 Z" fill="#4a5e3a"/>
            <path d="M 140 34 L 180 20 L 188 34 L 150 46 Z" fill="#4a5e3a"/>
            <path d="M 130 46 L 140 56 L 150 46 L 140 34 Z" fill="#c07a50"/>
            <line x1="128" y1="46" x2="120" y2="72" stroke="#3d4f30" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="152" y1="46" x2="160" y2="72" stroke="#3d4f30" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="120" cy="73" r="3" fill="#2d3a22"/>
            <circle cx="160" cy="73" r="3" fill="#2d3a22"/>
          </svg>
        </div>
      </div>
      <div id="friendly-status" class="mt-28 px-5 py-2 rounded-full border text-sm font-medium flex items-center gap-2.5"
        style="background:rgba(59,130,246,0.1); border-color:rgba(59,130,246,0.2); color:#93c5fd;">
        <span class="w-2 h-2 rounded-full" style="background:#475569;"></span>
        <span class="status-text">AI 면접관 대기 중</span>
      </div>
    `;
    return wrapper;
  }

  private startBlinking() {
    const blink = () => {
      if (this.isDestroyed || !this.container) return;
      const eyes = this.container.querySelectorAll(".friendly-eye") as NodeListOf<HTMLElement>;
      eyes.forEach((e) => (e.style.transform = "scaleY(0.08)"));
      setTimeout(() => {
        if (!this.isDestroyed) eyes.forEach((e) => (e.style.transform = "scaleY(1)"));
      }, 120);
      const buf = new Uint32Array(1);
      crypto.getRandomValues(buf);
      const delay = (buf[0] / 0xFFFFFFFF) * 3000 + 1500;
      this.blinkTimeoutId = window.setTimeout(blink, delay);
    };
    blink();
  }

  async speak(audioUrlOrBase64: string, text: string): Promise<void> {
    void text;
    this.stopAudio();
    this.setStatus("speaking");
    if (this.avatarWrapper) {
      this.avatarWrapper.className = "friendly-speaking relative w-56 h-56 shrink-0";
    }
    this.container?.querySelector("#friendly-face")?.classList.add("friendly-glow");
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
          const h = Math.min(44, 10 + (avg / 255) * 46);
          const w = Math.max(28, 38 - (avg / 255) * 8);
          const r = Math.min(20, 12 + (avg / 255) * 16);
          this.mouthElement.style.height = `${h}px`;
          this.mouthElement.style.width = `${w}px`;
          this.mouthElement.style.borderRadius = `${r}px`;
        } else { this.resetMouth(); }
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
    this.mouthElement.style.height = "10px";
    this.mouthElement.style.width = "38px";
    this.mouthElement.style.borderRadius = "0 0 20px 20px";
  }

  private setStatus(state: "speaking" | "idle") {
    const dot = this.container?.querySelector("#friendly-status span") as HTMLElement | null;
    const text = this.container?.querySelector(".status-text");
    if (state === "speaking") {
      dot?.setAttribute("style", "width:8px; height:8px; border-radius:50%; background:#4ade80; animation: pulse 1s infinite;");
      if (text) text.textContent = "질문 중...";
    } else {
      dot?.setAttribute("style", "width:8px; height:8px; border-radius:50%; background:#475569;");
      if (text) text.textContent = "AI 면접관 대기 중";
    }
  }

  private stopAudio() {
    if (this.animationFrameId) { cancelAnimationFrame(this.animationFrameId); this.animationFrameId = null; }
    if (this.audio) { this.audio.pause(); this.audio.currentTime = 0; this.audio = null; }
    this.resetMouth();
    if (this.avatarWrapper) {
      this.avatarWrapper.className = "friendly-container relative w-56 h-56 shrink-0";
    }
    this.container?.querySelector("#friendly-face")?.classList.remove("friendly-glow");
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