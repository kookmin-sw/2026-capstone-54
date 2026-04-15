import { create } from "zustand";
import { fetchSetupJdListApi } from "../api/setupApi";
import type { SetupJdItem } from "../api/setupApi";
import { interviewSetupApi } from "../api/interviewSetupApi";
import type { ResumeOption, CreatedInterviewSession } from "../api/interviewSetupApi";
import type { InterviewDifficultyLevel, InterviewSessionType } from "@/features/interview-session";
import { isApiError } from "@/shared/api/client";
import type { JdTab, InterviewMode, PracticeMode } from "./types";
import { buildSummary } from "../lib/buildSummary";

interface InterviewSetupState {
  jdList: SetupJdItem[];
  jdListLoading: boolean;

  jdTab: JdTab;
  /** 선택된 UserJobDescription.uuid. 없으면 null. */
  selectedJdId: string | null;

  directCompany: string;
  directRole: string;
  directStage: string;
  directUrl: string;

  interviewMode: InterviewMode;
  practiceMode: PracticeMode;
  interviewDifficultyLevel: InterviewDifficultyLevel;

  // 면접 세션 생성에 필요한 실제 UUID (setup 완료 후 채워짐)
  pendingResumeUuid: string | null;
  pendingUserJobDescriptionUuid: string | null;

  // ── Real resume selection (backed by /api/v1/resumes/) ──
  resumes: ResumeOption[];
  selectedResumeUuid: string | null;
  resumesLoading: boolean;
  resumesError: string | null;

  // ── Session creation ──
  creatingSession: boolean;
  createError: string | null;
  createdSessionUuid: string | null;

  loadJdList: () => Promise<void>;
  setJdTab: (tab: JdTab) => void;
  selectJd: (uuid: string | null) => void;
  setDirectField: (field: "directCompany" | "directRole" | "directStage" | "directUrl", value: string) => void;
  setInterviewMode: (mode: InterviewMode) => void;
  setPracticeMode: (mode: PracticeMode) => void;
  setInterviewDifficultyLevel: (level: InterviewDifficultyLevel) => void;
  setPendingUuids: (resumeUuid: string, userJobDescriptionUuid: string) => void;

  fetchResumes: () => Promise<void>;
  selectResume: (uuid: string) => void;
  createSession: () => Promise<CreatedInterviewSession | null>;
  resetSetup: () => void;

  getInterviewSessionType: () => InterviewSessionType;

  getSummary: () => {
    company: string;
    role: string;
    stage: string;
    interviewModeLabel: string;
    practiceModeLabel: string;
    difficultyLabel: string;
  };
}

export const useInterviewSetupStore = create<InterviewSetupState>()((set, get) => ({
  jdList: [],
  jdListLoading: false,

  jdTab: "saved",
  selectedJdId: null,

  directCompany: "",
  directRole: "",
  directStage: "1차 면접",
  directUrl: "",

  interviewMode: "tail",
  practiceMode: "practice",
  interviewDifficultyLevel: "normal",

  pendingResumeUuid: null,
  pendingUserJobDescriptionUuid: null,

  resumes: [],
  selectedResumeUuid: null,
  resumesLoading: false,
  resumesError: null,

  creatingSession: false,
  createError: null,
  createdSessionUuid: null,

  loadJdList: async () => {
    set({ jdListLoading: true });
    try {
      const list = await fetchSetupJdListApi();
      set((s) => {
        // 기존 선택값이 여전히 선택 가능한 상태면 유지, 아니면 수집 완료된 첫 항목으로 변경.
        const stillValid = list.some(
          (jd) => jd.uuid === s.selectedJdId && !jd.disabled,
        );
        const firstEnabled = list.find((jd) => !jd.disabled)?.uuid ?? null;
        return {
          jdList: list,
          jdListLoading: false,
          selectedJdId: stillValid ? s.selectedJdId : firstEnabled,
        };
      });
    } catch {
      set({ jdListLoading: false });
    }
  },

  setJdTab: (tab) => set({ jdTab: tab }),
  selectJd: (id) => set({ selectedJdId: id }),
  setDirectField: (field, value) => set({ [field]: value } as Partial<InterviewSetupState>),
  setInterviewMode: (mode) => set({ interviewMode: mode }),
  setPracticeMode: (mode) => set({ practiceMode: mode }),
  setInterviewDifficultyLevel: (level) => set({ interviewDifficultyLevel: level }),
  setPendingUuids: (resumeUuid, userJobDescriptionUuid) =>
    set({ pendingResumeUuid: resumeUuid, pendingUserJobDescriptionUuid: userJobDescriptionUuid }),

  fetchResumes: async () => {
    set({ resumesLoading: true, resumesError: null });
    try {
      const resumes = await interviewSetupApi.fetchResumes();
      // Auto-select the first parsed/completed resume if nothing is selected yet
      const eligible = resumes.find(
        (r) => r.isParsed || r.analysisStatus === "completed"
      );
      set((s) => ({
        resumes,
        resumesLoading: false,
        selectedResumeUuid: s.selectedResumeUuid ?? eligible?.uuid ?? null,
      }));
    } catch (e) {
      const message = isApiError(e) && e.message ? e.message : "이력서를 불러오지 못했습니다.";
      set({ resumesLoading: false, resumesError: message });
    }
  },

  selectResume: (uuid) => set({ selectedResumeUuid: uuid }),

  createSession: async () => {
    const s = get();
    if (!s.selectedResumeUuid) {
      set({ createError: "이력서를 선택해 주세요." });
      return null;
    }
    if (!s.selectedJdId) {
      set({ createError: "채용공고를 선택해 주세요." });
      return null;
    }
    set({ creatingSession: true, createError: null });
    try {
      const session = await interviewSetupApi.createSession({
        resume_uuid: s.selectedResumeUuid,
        user_job_description_uuid: s.selectedJdId,
        interview_session_type: s.interviewMode === "tail" ? "followup" : "full_process",
        interview_difficulty_level: s.interviewDifficultyLevel,
        interview_practice_mode: s.practiceMode,
      });
      set({
        creatingSession: false,
        createdSessionUuid: session.uuid,
        pendingResumeUuid: s.selectedResumeUuid,
        pendingUserJobDescriptionUuid: s.selectedJdId,
      });
      return session;
    } catch (e) {
      const message = isApiError(e) && e.message ? e.message : "면접 세션 생성에 실패했습니다.";
      set({ creatingSession: false, createError: message });
      return null;
    }
  },

  resetSetup: () =>
    set({
      creatingSession: false,
      createError: null,
      createdSessionUuid: null,
    }),

  getInterviewSessionType: (): InterviewSessionType => {
    return get().interviewMode === "tail" ? "followup" : "full_process";
  },

  getSummary: () => buildSummary(get()),
}));
