import type { IAvatarProvider } from "./IAvatarProvider";
 
export class PressureAvatarProvider implements IAvatarProvider {
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
    this.avatarWrapper = wrapper.querySelector("#pressure-body-wrapper");
    this.mouthElement = wrapper.querySelector("#pressure-mouth");
    this.startBlinking();
  }

  private injectStyles(): void {
    const styleId = "pressure-avatar-style";
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement("style");
      styleEl.id = styleId;
      styleEl.innerHTML = `
        @keyframes pressureFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-4px) rotate(0.3deg); }
        }
        @keyframes pressureLean {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          40% { transform: translateY(-3px) rotate(-1deg) scale(1.01); }
          60% { transform: translateY(-2px) rotate(0.5deg); }
        }
        @keyframes eyebrowTwitch {
          0%, 90%, 100% { transform: rotate(-12deg) translateY(0px); }
          95% { transform: rotate(-14deg) translateY(-1px); }
        }
        @keyframes eyebrowTwitchR {
          0%, 90%, 100% { transform: rotate(12deg) translateY(0px); }
          95% { transform: rotate(14deg) translateY(-1px); }
        }
        .pressure-face {
          background: linear-gradient(160deg, #d4956a 0%, #b87a4a 60%, #9a6035 100%);
          box-shadow: inset -14px -14px 28px rgba(100,40,10,0.4), inset 2px 2px 8px rgba(200,150,100,0.15), 0 20px 60px rgba(0,0,0,0.6);
        }
        .pressure-eye { transition: transform 0.1s cubic-bezier(0.4,0,0.2,1); transform-origin: center; }
        .pressure-container { animation: pressureFloat 8s ease-in-out infinite; }
        .pressure-speaking { animation: pressureLean 2s ease-in-out infinite; }
        .pressure-glow { box-shadow: inset -14px -14px 28px rgba(100,40,10,0.4), inset 2px 2px 8px rgba(200,150,100,0.15), 0 0 60px rgba(239,68,68,0.4) !important; }
        .pressure-eyebrow-l { animation: eyebrowTwitch 4s ease-in-out infinite; }
        .pressure-eyebrow-r { animation: eyebrowTwitchR 4s ease-in-out infinite; }
      `;
      document.head.appendChild(styleEl);
    }
 
  }

  private buildHTML(): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.className = "w-full h-full flex flex-col items-center justify-center relative overflow-hidden";
    wrapper.style.background = "#080f1a";

    const bodyWrapper = document.createElement("div");
    bodyWrapper.id = "pressure-body-wrapper";
    bodyWrapper.className = "pressure-container relative w-56 h-56 shrink-0";
    bodyWrapper.innerHTML = this.buildHairHTML() + this.buildFaceHTML() + this.buildBodyHTML();

    const status = document.createElement("div");
    status.id = "pressure-status";
    status.className = "mt-28 px-5 py-2 rounded-full border text-sm font-medium flex items-center gap-2.5";
    status.setAttribute("style", "background:rgba(239,68,68,0.08); border-color:rgba(239,68,68,0.2); color:#fca5a5;");

    const dot = document.createElement("span");
    dot.className = "w-2 h-2 rounded-full";
    dot.setAttribute("style", "background:#475569;");

    const statusText = document.createElement("span");
    statusText.className = "status-text";
    statusText.textContent = "AI 면접관 대기 중";

    status.append(dot, statusText);
    wrapper.append(bodyWrapper, status);

    return wrapper;
  }

  private buildHairHTML(): string {
    return `
      <div class="absolute -z-10"
        style="width:260px; height:200px; top:-32px; left:-16px; background:linear-gradient(180deg,#2a2a2a 0%,#1a1a1a 100%); border-radius:50%;"></div>
      <div class="absolute -top-6 left-1/2 -z-10"
        style="width:4px; height:40px; background:#0a0a0a; transform:translateX(-50%);"></div>
      <div class="absolute -z-10"
        style="width:18px; height:26px; background:linear-gradient(160deg,#c07a50,#9a6035); border-radius:50%; top:38%; left:-6px; box-shadow:inset 3px 0 6px rgba(100,40,10,0.4);">
        <div style="position:absolute; top:25%; left:20%; width:8px; height:14px; background:rgba(100,40,10,0.2); border-radius:50%;"></div>
      </div>
      <div class="absolute -z-10"
        style="width:18px; height:26px; background:linear-gradient(160deg,#c07a50,#9a6035); border-radius:50%; top:38%; right:-6px; box-shadow:inset -3px 0 6px rgba(100,40,10,0.4);">
        <div style="position:absolute; top:25%; right:20%; width:8px; height:14px; background:rgba(100,40,10,0.2); border-radius:50%;"></div>
      </div>
      <div class="absolute pointer-events-none" style="top:-32px; left:-16px; width:260px; height:120px; z-index:1;">
        <svg width="260" height="120" viewBox="0 0 260 120" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="pr-fg-hair-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#2a2a2a"/>
              <stop offset="100%" stop-color="#1a1a1a"/>
            </linearGradient>
          </defs>
          <path d="M 130 8 C 85 8, 28 22, 12 58 C 4 78, 4 98, 4 108 C 62 102, 98 90, 130 56 C 162 90, 198 102, 256 108 C 256 98, 256 78, 248 58 C 232 22, 175 8, 130 8 Z" fill="url(#pr-fg-hair-grad)"/>
        </svg>
      </div>
    `;
  }

  private buildFaceHTML(): string {
    return `
      <div id="pressure-face" class="pressure-face w-full h-full flex flex-col items-center relative overflow-hidden transition-all duration-300"
        style="border-radius:40% 40% 45% 45%;">
        <div class="absolute top-[25%] w-full flex justify-between px-9">
          <div class="pressure-eyebrow-l w-11 h-3 rounded-sm" style="background:#111; transform:rotate(-12deg); transform-origin:right center;"></div>
          <div class="pressure-eyebrow-r w-11 h-3 rounded-sm" style="background:#111; transform:rotate(12deg); transform-origin:left center;"></div>
        </div>
        <div class="absolute top-[28%] left-1/2 -translate-x-1/2 flex gap-1.5">
          <div class="w-0.5 h-4 rounded-full opacity-40" style="background:#7a4520; transform:rotate(-8deg);"></div>
          <div class="w-0.5 h-4 rounded-full opacity-40" style="background:#7a4520; transform:rotate(8deg);"></div>
        </div>
        <div class="absolute top-[34%] w-full flex justify-between px-10">
          <div class="pressure-eye bg-white relative overflow-hidden shadow-inner"
            style="width:32px; height:28px; border-radius:40% 40% 50% 50%;">
            <div class="absolute bottom-0.5 right-0.5 rounded-full" style="width:20px; height:22px; background:#1a0a00;">
              <div class="absolute top-1 right-1 w-1.5 h-1.5 bg-white rounded-full opacity-80"></div>
            </div>
            <div class="absolute top-0 w-full h-[30%] opacity-30" style="background:#333;"></div>
          </div>
          <div class="pressure-eye bg-white relative overflow-hidden shadow-inner"
            style="width:32px; height:28px; border-radius:40% 40% 50% 50%;">
            <div class="absolute bottom-0.5 left-0.5 rounded-full" style="width:20px; height:22px; background:#1a0a00;">
              <div class="absolute top-1 left-1 w-1.5 h-1.5 bg-white rounded-full opacity-80"></div>
            </div>
            <div class="absolute top-0 w-full h-[30%] opacity-30" style="background:#333;"></div>
          </div>
        </div>
        <div class="absolute top-[30%] w-full flex justify-between px-7 pointer-events-none opacity-80">
          <div class="w-16 h-12 border-2 border-slate-300/70 rounded-sm"></div>
          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-0.5 bg-slate-300/70"></div>
          <div class="w-16 h-12 border-2 border-slate-300/70 rounded-sm"></div>
        </div>
        <div class="absolute top-[53%] left-1/2 -translate-x-1/2"
          style="width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-top:7px solid rgba(120,60,20,0.3);"></div>
        <div class="absolute top-[65%] w-full flex justify-center">
          <div id="pressure-mouth" class="relative overflow-hidden transition-all duration-75"
            style="width:32px; height:6px; border-radius:3px; background:#5a1515;">
            <div class="absolute top-0 w-full h-[30%]" style="background:rgba(255,255,255,0.6);"></div>
            <div class="absolute bottom-0 w-full h-[35%] rounded-full" style="background:#8b3030; transform:translateY(40%);"></div>
          </div>
        </div>
        <svg class="absolute top-0 left-0 w-full h-16" viewBox="0 0 100 35" preserveAspectRatio="none">
          <path d="M 0 0 L 100 0 L 100 10 Q 55 20 50 14 Q 45 20 0 10 Z" fill="#080f1a"/>
        </svg>
      </div>
    `;
  }

  private buildBodyHTML(): string {
    return `
      <div class="absolute pointer-events-none" style="bottom:-100px; left:50%; transform:translateX(-50%); width:280px; height:110px; z-index:-1;">
        <svg width="280" height="110" viewBox="0 0 280 110" xmlns="http://www.w3.org/2000/svg">
          <path d="M 0 45 Q 0 28 22 24 L 90 16 L 140 30 L 190 16 L 258 24 Q 280 28 280 45 L 280 110 L 0 110 Z" fill="#1e293b"/>
          <path d="M 140 30 L 90 16 L 78 36 L 125 52 Z" fill="#263548"/>
          <path d="M 140 30 L 190 16 L 202 36 L 155 52 Z" fill="#263548"/>
          <path d="M 125 52 L 140 38 L 155 52 L 162 110 L 118 110 Z" fill="#334155"/>
          <path d="M 125 52 L 140 68 L 155 52 L 140 38 Z" fill="#f1f5f9"/>
          <path d="M 136 42 L 144 42 L 146 60 L 140 72 L 134 60 Z" fill="#7f1d1d"/>
          <path d="M 137 42 L 143 42 L 140 50 Z" fill="#991b1b"/>
          <rect x="118" y="0" width="44" height="38" rx="6" fill="#b87a4a"/>
          <path d="M 140 36 L 108 22 L 102 34 L 132 46 Z" fill="#f1f5f9"/>
          <path d="M 140 36 L 172 22 L 178 34 L 148 46 Z" fill="#f1f5f9"/>
          <circle cx="140" cy="72" r="3.5" fill="#0f172a"/>
          <circle cx="140" cy="88" r="3.5" fill="#0f172a"/>
          <path d="M 0 45 Q 0 28 22 24 L 90 16 L 78 36 L 30 42 Q 10 44 0 55 Z" fill="#253044"/>
          <path d="M 280 45 Q 280 28 258 24 L 190 16 L 202 36 L 250 42 Q 270 44 280 55 Z" fill="#253044"/>
        </svg>
      </div>
    `;
  }
 
  private startBlinking() {
    const blink = () => {
      if (this.isDestroyed || !this.container) return;
      const eyes = this.container.querySelectorAll(".pressure-eye") as NodeListOf<HTMLElement>;
      eyes.forEach((e) => (e.style.transform = "scaleY(0.05)"));
      setTimeout(() => {
        if (!this.isDestroyed) eyes.forEach((e) => (e.style.transform = "scaleY(1)"));
      }, 100);
      const buf = new Uint32Array(1);
      crypto.getRandomValues(buf);
      const delay = (buf[0] / 0xFFFFFFFF) * 6000 + 3000;
      this.blinkTimeoutId = window.setTimeout(blink, delay);
    };
    blink();
  }
 
  async speak(audioUrlOrBase64: string, text: string): Promise<void> {
    void text;
    this.stopAudio();
    this.setStatus("speaking");
    if (this.avatarWrapper) {
      this.avatarWrapper.className = "pressure-speaking relative w-56 h-56 shrink-0";
    }
    this.container?.querySelector("#pressure-face")?.classList.add("pressure-glow");
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
          const h = Math.min(32, 6 + (avg / 255) * 34);
          const w = Math.max(24, 32 - (avg / 255) * 6);
          const r = Math.min(12, 3 + (avg / 255) * 12);
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
    this.mouthElement.style.height = "6px";
    this.mouthElement.style.width = "32px";
    this.mouthElement.style.borderRadius = "3px";
  }
 
  private setStatus(state: "speaking" | "idle") {
    const dot = this.container?.querySelector("#pressure-status span") as HTMLElement | null;
    const text = this.container?.querySelector(".status-text");
    if (state === "speaking") {
      dot?.setAttribute("style", "width:8px; height:8px; border-radius:50%; background:#ef4444; animation: pulse 0.8s infinite;");
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
      this.avatarWrapper.className = "pressure-container relative w-56 h-56 shrink-0";
    }
    this.container?.querySelector("#pressure-face")?.classList.remove("pressure-glow");
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