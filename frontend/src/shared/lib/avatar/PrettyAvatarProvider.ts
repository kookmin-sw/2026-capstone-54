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
    this.injectStyles();
    const wrapper = this.buildHTML();
    container.appendChild(wrapper);
    this.avatarWrapper = wrapper.querySelector("#avatar-body-wrapper");
    this.mouthElement = wrapper.querySelector("#pretty-mouth");
    this.startBlinking();
  }

  private injectStyles(): void {
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
        .avatar-container { animation: floatHead 6s ease-in-out infinite; }
        .speaking-glow { box-shadow: inset -10px -10px 20px rgba(200,100,50,0.2), 0 0 60px rgba(96,165,250,0.3) !important; }
      `;
      document.head.appendChild(styleEl);
    }
  }

  private buildHTML(): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.className = "w-full h-full flex flex-col items-center justify-center relative overflow-hidden text-center";
    wrapper.style.background = "#080f1a";

    const bodyWrapper = document.createElement("div");
    bodyWrapper.id = "avatar-body-wrapper";
    bodyWrapper.className = "avatar-container relative w-56 h-56 shrink-0";
    bodyWrapper.appendChild(this.parseStaticHTML(this.buildHairHTML() + this.buildFaceHTML() + this.buildBodyHTML()));

    const status = document.createElement("div");
    status.id = "avatar-status";
    status.className = "mt-28 px-5 py-2 rounded-full bg-slate-800/80 border border-white/5 text-sm text-slate-300 font-medium flex items-center gap-2.5";

    const dot = document.createElement("span");
    dot.className = "w-2 h-2 rounded-full bg-slate-500";

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
        style="width:260px; height:200px; top:-36px; left:-18px; background:linear-gradient(180deg,#2d3748 0%,#1a202c 100%); border-radius:50%;"></div>
      <div class="absolute -z-10"
        style="width:18px; height:26px; background:linear-gradient(160deg,#ffcba4,#e8a87c); border-radius:50%; top:38%; left:-6px; box-shadow:inset 3px 0 6px rgba(200,100,50,0.3);">
        <div style="position:absolute; top:25%; left:20%; width:8px; height:14px; background:rgba(200,100,50,0.2); border-radius:50%;"></div>
      </div>
      <div class="absolute -z-10"
        style="width:18px; height:26px; background:linear-gradient(160deg,#ffcba4,#e8a87c); border-radius:50%; top:38%; right:-6px; box-shadow:inset -3px 0 6px rgba(200,100,50,0.3);">
        <div style="position:absolute; top:25%; right:20%; width:8px; height:14px; background:rgba(200,100,50,0.2); border-radius:50%;"></div>
      </div>
      <div class="absolute pointer-events-none" style="top:-36px; left:-18px; width:260px; height:200px; z-index:1;">
        <svg width="260" height="200" viewBox="0 0 260 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="fg-hair-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#2d3748"/>
              <stop offset="100%" stop-color="#1e2a3a"/>
            </linearGradient>
            <clipPath id="hair-oval-clip">
              <ellipse cx="130" cy="100" rx="130" ry="100"/>
            </clipPath>
          </defs>
          <g clip-path="url(#hair-oval-clip)">
            <path d="M 0 0 L 260 0 L 260 115 C 230 108 210 96 182 65 C 155 95 120 112 80 118 C 50 122 25 118 0 115 Z" fill="url(#fg-hair-grad)"/>
          </g>
        </svg>
      </div>
    `;
  }

  private buildFaceHTML(): string {
    return `
      <div id="pretty-face" class="pretty-face w-full h-full rounded-[45%] flex flex-col items-center relative overflow-hidden transition-all duration-300">
        <div class="absolute top-[35%] left-[15%] w-10 h-6 bg-rose-400/30 rounded-full blur-md"></div>
        <div class="absolute top-[35%] right-[15%] w-10 h-6 bg-rose-400/30 rounded-full blur-md"></div>
        <div class="absolute top-[26%] w-full flex justify-between px-11">
          <svg width="28" height="10" viewBox="0 0 28 10"><path d="M 2 8 Q 8 1 26 4" stroke="#2d3748" stroke-width="3" fill="none" stroke-linecap="round"/></svg>
          <svg width="28" height="10" viewBox="0 0 28 10"><path d="M 26 8 Q 20 1 2 4" stroke="#2d3748" stroke-width="3" fill="none" stroke-linecap="round"/></svg>
        </div>
        <div class="absolute top-[33%] w-full flex justify-between px-12">
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
        <div class="absolute top-[30%] w-full flex justify-between px-8 pointer-events-none opacity-70">
          <div class="w-14 h-14 border-[3px] border-amber-600/60 rounded-[40%]"></div>
          <div class="absolute w-5 h-1 bg-amber-600/60 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
          <div class="w-14 h-14 border-[3px] border-amber-600/60 rounded-[40%]"></div>
        </div>
        <div class="absolute top-[50%] left-1/2 -translate-x-1/2"
          style="width:14px; height:10px; border-radius:50%; background:rgba(200,120,70,0.2); box-shadow:inset 0 2px 4px rgba(180,90,40,0.3);">
          <div class="absolute" style="width:4px; height:4px; border-radius:50%; background:rgba(160,80,30,0.35); bottom:1px; left:1px;"></div>
          <div class="absolute" style="width:4px; height:4px; border-radius:50%; background:rgba(160,80,30,0.35); bottom:1px; right:1px;"></div>
        </div>
        <div class="absolute top-[62%] w-full flex justify-center">
          <div id="pretty-mouth" class="w-8 h-2 bg-[#881337] rounded-full transition-all duration-75 relative overflow-hidden">
            <div class="absolute top-0 w-full h-[30%] bg-white/90"></div>
            <div class="absolute bottom-0 w-full h-[40%] bg-rose-400/80 rounded-full transform translate-y-1/2"></div>
          </div>
        </div>
        <svg class="absolute top-0 left-0 w-full h-20" viewBox="0 0 100 40" preserveAspectRatio="none">
          <path d="M 0 0 L 100 0 L 100 12 C 85 10 75 6 70 14 C 60 4 30 10 0 12 Z" fill="#1a202c"/>
        </svg>
      </div>
    `;
  }

  private buildBodyHTML(): string {
    return `
      <div class="absolute pointer-events-none" style="bottom:-90px; left:50%; transform:translateX(-50%); width:240px; height:100px; z-index:-1;">
        <svg width="240" height="100" viewBox="0 0 240 100" xmlns="http://www.w3.org/2000/svg">
          <path d="M 0 40 Q 0 25 20 22 L 80 18 L 120 28 L 160 18 L 220 22 Q 240 25 240 40 L 240 100 L 0 100 Z" fill="#f1f5f9"/>
          <path d="M 0 40 Q 0 25 20 22 L 80 18 L 120 28 L 160 18 L 220 22 Q 240 25 240 40 L 240 50 Q 200 42 120 44 Q 40 42 0 50 Z" fill="#e2e8f0"/>
          <rect x="100" y="0" width="40" height="35" rx="6" fill="#e6bca0"/>
          <path d="M 120 28 L 80 18 L 72 32 L 112 38 Z" fill="#f8fafc"/>
          <path d="M 120 28 L 80 18 L 72 32 L 112 38 Z" fill="none" stroke="#e2e8f0" stroke-width="1"/>
          <path d="M 120 28 L 160 18 L 168 32 L 128 38 Z" fill="#f8fafc"/>
          <path d="M 120 28 L 160 18 L 168 32 L 128 38 Z" fill="none" stroke="#e2e8f0" stroke-width="1"/>
          <path d="M 112 38 L 120 50 L 128 38 Z" fill="#8f8f8fff"/>
          <circle cx="120" cy="56" r="3" fill="#cbd5e1"/>
          <circle cx="120" cy="70" r="3" fill="#cbd5e1"/>
          <circle cx="120" cy="84" r="3" fill="#cbd5e1"/>
          <line x1="120" y1="50" x2="120" y2="100" stroke="#e2e8f0" stroke-width="1"/>
        </svg>
      </div>
    `;
  }

  private parseStaticHTML(html: string): DocumentFragment {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const fragment = document.createDocumentFragment();
    Array.from(doc.body.childNodes).forEach((node) =>
      fragment.appendChild(document.adoptNode(node))
    );
    return fragment;
  }

  private startBlinking() {
    const blink = () => {
      if (this.isDestroyed || !this.container) return;
      const eyes = this.container.querySelectorAll(".pretty-eye") as NodeListOf<HTMLElement>;
      eyes.forEach((e) => (e.style.transform = "scaleY(0.1)"));
      setTimeout(() => {
        if (!this.isDestroyed) eyes.forEach((e) => (e.style.transform = "scaleY(1)"));
      }, 150);
      const buf = new Uint32Array(1);
      crypto.getRandomValues(buf);
      const delay = (buf[0] / 0xFFFFFFFF) * 4000 + 2000;
      this.blinkTimeoutId = window.setTimeout(blink, delay);
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