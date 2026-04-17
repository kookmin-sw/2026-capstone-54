/** 채용공고 상세 store.
 *
 * 실제 backend 는 `/api/v1/user-job-descriptions/{uuid}/` 만 제공한다.
 * UI 는 기존 `JdDetail` 형태를 그대로 쓰고 있으므로, backend 응답을 해당 shape 로
 * 매핑한다. 상태(planned / applied / saved) / interviewCount / interviewActive 처럼
 * backend 에 아직 없는 필드는 프론트 로컬 상태로 유지한다.
 */

import { create } from "zustand";
import {
  userJobDescriptionApi,
  type UserJobDescription,
  type JobDescriptionCollectionStatus,
} from "@/features/user-job-description";
import {
  getCompanyColor,
  getCompanyInitial,
  getRelativeTime,
} from "../api/jdListHelpers";
import type { JdStatus } from "./listStore";

export interface JdRequirement {
  level: "required" | "preferred";
  text: string;
}

export interface JdDetail {
  id: string; // UserJobDescription.uuid
  company: string;
  companyInitial: string;
  companyColor: string;
  title: string;
  source: string;
  location: string;
  experience: string;
  period: string;
  status: JdStatus;
  originalUrl: string;
  summary: string;
  requirements: JdRequirement[];
  preferences: string[];
  registeredAt: string;
  analyzed: boolean;
  collectionStatus: JobDescriptionCollectionStatus;
  interviewCount: number;
}

interface JdDetailState {
  jd: JdDetail | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;

  fetchJd: (uuid: string) => Promise<void>;
  updateStatus: (next: JdStatus) => Promise<boolean>;
  deleteJd: () => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

function splitLines(text: string): string[] {
  return (text || "")
    .split(/\n|·|•|●|-/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function toDetail(item: UserJobDescription): JdDetail {
  const jd = item.jobDescription;
  const company = jd.company || "수집 중";
  const title = item.title || jd.title || "채용공고";
  return {
    id: item.uuid,
    company,
    companyInitial: getCompanyInitial(company),
    companyColor: getCompanyColor(company),
    title,
    source: jd.platform || "",
    location: jd.location || "",
    experience: jd.experience || "",
    period: jd.workType || "",
    status: (item.applicationStatus || "planned") as JdStatus,
    originalUrl: jd.url || "",
    summary: jd.duties || "",
    requirements: splitLines(jd.requirements).map((text) => ({ level: "required" as const, text })),
    preferences: splitLines(jd.preferred),
    registeredAt: getRelativeTime(item.createdAt),
    analyzed: jd.collectionStatus === "done",
    collectionStatus: jd.collectionStatus,
    interviewCount: 0,
  };
}

export const useJdDetailStore = create<JdDetailState>()((set, get) => ({
  jd: null,
  isLoading: false,
  isUpdating: false,
  error: null,

  fetchJd: async (uuid) => {
    set({ isLoading: true, error: null });
    try {
      const raw = await userJobDescriptionApi.retrieve(uuid);
      set({ isLoading: false, jd: toDetail(raw) });
    } catch (e) {
      set({
        isLoading: false,
        error: e instanceof Error ? e.message : "채용공고를 찾을 수 없습니다.",
      });
    }
  },

  updateStatus: async (next) => {
    const { jd } = get();
    if (!jd) return false;
    set({ isUpdating: true });
    try {
      await userJobDescriptionApi.update(jd.id, { applicationStatus: next });
      set({ jd: { ...jd, status: next }, isUpdating: false });
      return true;
    } catch (e) {
      set({
        isUpdating: false,
        error: e instanceof Error ? e.message : "상태 변경에 실패했습니다.",
      });
      return false;
    }
  },

  deleteJd: async () => {
    const { jd } = get();
    if (!jd) return false;
    try {
      await userJobDescriptionApi.remove(jd.id);
      return true;
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "삭제에 실패했습니다." });
      return false;
    }
  },

  clearError: () => set({ error: null }),
  reset: () => set({ jd: null, isLoading: false, isUpdating: false, error: null }),
}));
