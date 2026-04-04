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

    if (micIntervalRef) {
      clearInterval(micIntervalRef);
      micIntervalRef = null;
    }
    // Use crypto.getRandomValues for secure random number generation
    micIntervalRef = setInterval(() => {
      const randomArray = new Uint32Array(1);
      crypto.getRandomValues(randomArray);
      const randomValue = (randomArray[0] / 0xFFFFFFFF) * 35;
      set({ micLevel: Math.floor(55 + randomValue) });
    }, 900);
  },

  stopMicTimer: () => {
    if (micIntervalRef) {
      clearInterval(micIntervalRef);
      micIntervalRef = null;
    }
  },

  reset: () => {
    if (micIntervalRef) {
      clearInterval(micIntervalRef);
      micIntervalRef = null;
    }
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
