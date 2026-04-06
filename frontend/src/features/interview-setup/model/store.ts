import { create } from "zustand";
import { fetchSetupJdListApi } from "../api/setupApi";
import type { SetupJdItem } from "../api/setupApi";

export type JdTab = "saved" | "direct" | "skip";
export type InterviewMode = "tail" | "full";
export type PracticeMode = "practice" | "real";

interface InterviewSetupState {
  jdList: SetupJdItem[];
  jdListLoading: boolean;

  jdTab: JdTab;
  selectedJdId: string;

  directCompany: string;
  directRole: string;
  directStage: string;
  directUrl: string;

  interviewMode: InterviewMode;
  practiceMode: PracticeMode;

  loadJdList: () => Promise<void>;
  setJdTab: (tab: JdTab) => void;
  selectJd: (id: string) => void;
  setDirectField: (field: "directCompany" | "directRole" | "directStage" | "directUrl", value: string) => void;
  setInterviewMode: (mode: InterviewMode) => void;
  setPracticeMode: (mode: PracticeMode) => void;

  getSummary: () => {
    company: string;
    role: string;
    stage: string;
    interviewModeLabel: string;
    practiceModeLabel: string;
  };
}

export const useInterviewSetupStore = create<InterviewSetupState>()((set, get) => ({
  jdList: [],
  jdListLoading: false,

  jdTab: "saved",
  selectedJdId: "j1",

  directCompany: "",
  directRole: "",
  directStage: "1차 면접",
  directUrl: "",

  interviewMode: "tail",
  practiceMode: "practice",

  loadJdList: async () => {
    set({ jdListLoading: true });
    const list = await fetchSetupJdListApi();
    set({ jdList: list, jdListLoading: false });
  },

  setJdTab: (tab) => set({ jdTab: tab }),
  selectJd: (id) => set({ selectedJdId: id }),
  setDirectField: (field, value) => set({ [field]: value } as Partial<InterviewSetupState>),
  setInterviewMode: (mode) => set({ interviewMode: mode }),
  setPracticeMode: (mode) => set({ practiceMode: mode }),

  getSummary: () => {
    const s = get();
    let company = "—";
    let role = "—";
    let stage = "—";

    if (s.jdTab === "saved") {
      const jd = s.jdList.find((j) => j.id === s.selectedJdId);
      if (jd) { company = jd.company; role = jd.role; stage = jd.stage; }
    } else if (s.jdTab === "direct") {
      company = s.directCompany || "—";
      role = s.directRole || "—";
      stage = s.directStage;
    } else {
      company = "프로필 기반";
      role = "프로필 기반";
      stage = "—";
    }

    return {
      company,
      role,
      stage,
      interviewModeLabel: s.interviewMode === "tail" ? "꼬리질문 방식" : "전체 프로세스",
      practiceModeLabel: s.practiceMode === "practice" ? "연습 모드" : "실전 모드",
    };
  },
}));
