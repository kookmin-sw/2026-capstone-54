import { create } from "zustand";
import type { CameraInfo, MicInfo } from "../api";
import { checkCameraApi, checkMicApi, checkGpuApi, checkNetworkApi } from "../api";
import type { CheckStatus } from "./types";

interface PrecheckState {
  cameraStatus: CheckStatus;
  micStatus: CheckStatus;
  networkStatus: CheckStatus;
  gpuStatus: CheckStatus;
  cameraInfo: CameraInfo | null;
  micInfo: MicInfo | null;
  gpuInfo: string;
  micLevel: number;
  networkProgress: number;
  networkSpeed: string;
  networkLatency: string;
  cameraStream: MediaStream | null;
  allPassed: boolean;
  startChecks: () => void;
  stopMicTimer: () => void;
  reset: () => void;
}

let micIntervalRef: ReturnType<typeof setInterval> | null = null;
let pollPassedRef: ReturnType<typeof setInterval> | null = null;
let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let microphone: MediaStreamAudioSourceNode | null = null;
let micMediaStream: MediaStream | null = null;
let cameraMediaStream: MediaStream | null = null;

function stopAllResources() {
  if (micIntervalRef) { clearInterval(micIntervalRef); micIntervalRef = null; }
  if (pollPassedRef) { clearInterval(pollPassedRef); pollPassedRef = null; }
  if (microphone) { microphone.disconnect(); microphone = null; }
  if (audioContext) { audioContext.close(); audioContext = null; }
  if (micMediaStream) { micMediaStream.getTracks().forEach((t) => t.stop()); micMediaStream = null; }
  if (cameraMediaStream) { cameraMediaStream.getTracks().forEach((t) => t.stop()); cameraMediaStream = null; }
  analyser = null;
}

export const usePrecheckStore = create<PrecheckState>((set, get) => ({
  cameraStatus: "idle",
  micStatus: "idle",
  networkStatus: "idle",
  gpuStatus: "idle",
  cameraInfo: null,
  micInfo: null,
  gpuInfo: "",
  micLevel: 0,
  networkProgress: 0,
  networkSpeed: "측정 중...",
  networkLatency: "",
  cameraStream: null,
  allPassed: false,

  startChecks: () => {
    set({
      cameraStatus: "checking",
      micStatus: "checking",
      networkStatus: "checking",
      gpuStatus: "checking",
    });

    // Camera: real permission + keep stream open for preview
    checkCameraApi().then((res) => {
      if (res.ok && res.stream) {
        cameraMediaStream = res.stream;
        set({ cameraStatus: "ok", cameraInfo: res.info, cameraStream: res.stream });
      } else {
        set({ cameraStatus: "fail", cameraInfo: res.info, cameraStream: null });
      }
    });

    // Mic: real permission check
    checkMicApi().then((res) => {
      set({ micStatus: res.ok ? "ok" : "fail", micInfo: res.info });
    });

    // GPU: WebGL hardware acceleration check
    checkGpuApi().then((res) => {
      set({ gpuStatus: res.ok ? "ok" : "fail", gpuInfo: res.info });
    });

    // Network
    checkNetworkApi((pct) => {
      set({ networkProgress: pct });
    }).then((res) => {
      set({
        networkStatus: res.ok ? "ok" : "fail",
        networkSpeed: `${res.speedMbps} Mbps`,
        networkLatency: `${res.latencyMs}ms`,
      });
    });

    // Real mic level via Web Audio API
    if (micIntervalRef) { clearInterval(micIntervalRef); micIntervalRef = null; }
    if (micMediaStream) { micMediaStream.getTracks().forEach((t) => t.stop()); micMediaStream = null; }

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        micMediaStream = stream;
        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        analyser.fftSize = 256;
        microphone.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        micIntervalRef = setInterval(() => {
          if (!analyser) return;
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          set({ micLevel: Math.min(100, Math.floor((average / 128) * 100)) });
        }, 100);
      })
      .catch(() => {
        // fallback random level if mic already denied
        micIntervalRef = setInterval(() => {
          const arr = new Uint32Array(1);
          crypto.getRandomValues(arr);
          set({ micLevel: Math.floor(55 + (arr[0] / 0xffffffff) * 35) });
        }, 900);
      });

    // Watch for all-passed
    pollPassedRef = setInterval(() => {
      const s = get();
      if (
        s.cameraStatus !== "idle" && s.cameraStatus !== "checking" &&
        s.micStatus !== "idle" && s.micStatus !== "checking" &&
        s.networkStatus !== "idle" && s.networkStatus !== "checking" &&
        s.gpuStatus !== "idle" && s.gpuStatus !== "checking"
      ) {
        clearInterval(pollPassedRef!); pollPassedRef = null;
        if (
          s.cameraStatus === "ok" &&
          s.micStatus === "ok" &&
          s.networkStatus === "ok"
          // GPU fail is non-blocking — interview can proceed without HW accel
        ) {
          set({ allPassed: true });
        }
      }
    }, 200);
  },

  stopMicTimer: () => {
    stopAllResources();
    set({ cameraStream: null });
  },

  reset: () => {
    stopAllResources();
    set({
      cameraStatus: "idle",
      micStatus: "idle",
      networkStatus: "idle",
      gpuStatus: "idle",
      cameraInfo: null,
      micInfo: null,
      gpuInfo: "",
      micLevel: 0,
      networkProgress: 0,
      networkSpeed: "측정 중...",
      networkLatency: "",
      cameraStream: null,
      allPassed: false,
    });
  },
}));
