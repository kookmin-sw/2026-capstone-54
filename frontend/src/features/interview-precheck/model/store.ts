import { create } from "zustand";
import type { CameraInfo, MicInfo } from "../api/precheckApi";
import { checkCameraApi, checkMicApi, checkNetworkApi } from "../api/precheckApi";

type CheckStatus = "idle" | "checking" | "ok" | "fail";

interface PrecheckState {
  cameraStatus: CheckStatus;
  micStatus: CheckStatus;
  networkStatus: CheckStatus;
  cameraInfo: CameraInfo | null;
  micInfo: MicInfo | null;
  micLevel: number;
  networkProgress: number;
  networkSpeed: string;
  networkLatency: string;
  allPassed: boolean;
  startChecks: () => void;
  stopMicTimer: () => void;
  reset: () => void;
}

let micIntervalRef: ReturnType<typeof setInterval> | null = null;
let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let microphone: MediaStreamAudioSourceNode | null = null;
let mediaStream: MediaStream | null = null;

export const usePrecheckStore = create<PrecheckState>((set) => ({
  cameraStatus: "idle",
  micStatus: "idle",
  networkStatus: "idle",
  cameraInfo: null,
  micInfo: null,
  micLevel: 65,
  networkProgress: 0,
  networkSpeed: "측정 중...",
  networkLatency: "",
  allPassed: false,

  startChecks: () => {
    set({
      cameraStatus: "checking",
      micStatus: "checking",
      networkStatus: "checking",
    });

    checkCameraApi().then((res) => {
      set({ cameraStatus: res.ok ? "ok" : "fail", cameraInfo: res.info });
    });

    checkMicApi().then((res) => {
      set({
        micStatus: res.ok ? "ok" : "fail",
        micInfo: res.info,
      });
    });

    checkNetworkApi((pct) => {
      set({ networkProgress: pct });
    }).then((res) => {
      set({
        networkStatus: res.ok ? "ok" : "fail",
        networkSpeed: `${res.speedMbps} Mbps`,
        networkLatency: `${res.latencyMs}ms`,
        allPassed: true,
      });
    });

    // 실제 마이크 레벨 측정 시작
    if (micIntervalRef) {
      clearInterval(micIntervalRef);
      micIntervalRef = null;
    }

    // Web Audio API로 실제 마이크 레벨 측정
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        mediaStream = stream;
        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        
        analyser.fftSize = 256;
        microphone.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        micIntervalRef = setInterval(() => {
          if (analyser) {
            analyser.getByteFrequencyData(dataArray);
            // 평균 볼륨 계산 (0-100 범위로 정규화)
            const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
            const normalizedLevel = Math.min(100, Math.floor((average / 128) * 100));
            set({ micLevel: normalizedLevel });
          }
        }, 100);
      })
      .catch((error) => {
        console.error("마이크 접근 실패:", error);
        // 폴백: 랜덤 값 사용
        micIntervalRef = setInterval(() => {
          const randomArray = new Uint32Array(1);
          crypto.getRandomValues(randomArray);
          const randomValue = (randomArray[0] / 0xFFFFFFFF) * 35;
          set({ micLevel: Math.floor(55 + randomValue) });
        }, 900);
      });
  },

  stopMicTimer: () => {
    if (micIntervalRef) {
      clearInterval(micIntervalRef);
      micIntervalRef = null;
    }
    // Web Audio API 리소스 정리
    if (microphone) {
      microphone.disconnect();
      microphone = null;
    }
    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      mediaStream = null;
    }
    analyser = null;
  },

  reset: () => {
    if (micIntervalRef) {
      clearInterval(micIntervalRef);
      micIntervalRef = null;
    }
    // Web Audio API 리소스 정리
    if (microphone) {
      microphone.disconnect();
      microphone = null;
    }
    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      mediaStream = null;
    }
    analyser = null;
    
    set({
      cameraStatus: "idle",
      micStatus: "idle",
      networkStatus: "idle",
      cameraInfo: null,
      micInfo: null,
      micLevel: 65,
      networkProgress: 0,
      networkSpeed: "측정 중...",
      networkLatency: "",
      allPassed: false,
    });
  },
}));
