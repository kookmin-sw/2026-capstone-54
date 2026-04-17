/** 채용공고 수집 시작 store.
 *
 * backend 는 `POST /api/v1/user-job-descriptions/` 로 URL 하나만 받는다.
 * UI 에서는 customTitle / 사용자 상태(planned/applied/saved) / interviewActive 같은
 * 추가 필드를 이미 쓰고 있으므로 프론트 로컬 상태로 유지한다 (backend 에 추후 저장 예정).
 *
 * URL 분석(urlValidState / urlAnalysis) 은 순수 프론트 힌트용이다. 현재는 간단한
 * 정규식 검사만 수행하고 추후 backend 에서 미리보기 API 가 생기면 교체한다.
 */

import { create } from "zustand";
import { userJobDescriptionApi } from "@/features/user-job-description";
import type { JdStatus } from "./listStore";

type UrlValidState = "idle" | "checking" | "ok" | "error";

export interface JdUrlAnalysis {
  company: string;
  title: string;
  domain: string;
}

interface JdAddState {
  url: string;
  customTitle: string;
  status: JdStatus;

  urlValidState: UrlValidState;
  urlAnalysis: JdUrlAnalysis | null;

  isSubmitting: boolean;
  isSaving: boolean;
  error: string | null;

  setUrl: (url: string) => void;
  setCustomTitle: (title: string) => void;
  setStatus: (status: JdStatus) => void;
  clearError: () => void;
  /** 성공 시 생성된 UserJobDescription.uuid 반환. 실패 시 null. */
  submit: () => Promise<string | null>;
  /** 임시저장 — 아직 backend 엔드포인트가 없어 no-op 성공으로 둔다. */
  saveDraft: () => Promise<boolean>;
  reset: () => void;
}

const INITIAL: Pick<
  JdAddState,
  | "url"
  | "customTitle"
  | "status"
  | "urlValidState"
  | "urlAnalysis"
  | "isSubmitting"
  | "isSaving"
  | "error"
> = {
  url: "",
  customTitle: "",
  status: "planned",
  urlValidState: "idle",
  urlAnalysis: null,
  isSubmitting: false,
  isSaving: false,
  error: null,
};

function localAnalyze(url: string): JdUrlAnalysis | null {
  try {
    const host = new URL(url).hostname;
    return { company: "채용공고", title: "URL 검사 완료", domain: host };
  } catch {
    return null;
  }
}

export const useJdAddStore = create<JdAddState>()((set, get) => ({
  ...INITIAL,

  setUrl: (url) => {
    const trimmed = url.trim();
    if (!trimmed) {
      set({ url, urlValidState: "idle", urlAnalysis: null, error: null });
      return;
    }
    if (!/^https?:\/\//.test(trimmed)) {
      set({ url, urlValidState: "error", urlAnalysis: null, error: null });
      return;
    }
    const analysis = localAnalyze(trimmed);
    set({
      url,
      urlValidState: analysis ? "ok" : "error",
      urlAnalysis: analysis,
      error: null,
    });
  },

  setCustomTitle: (customTitle) => set({ customTitle }),
  setStatus: (status) => set({ status }),
  clearError: () => set({ error: null }),

  submit: async () => {
    const { url, customTitle, status } = get();
    const trimmed = url.trim();
    if (!trimmed) {
      set({ error: "URL을 입력해 주세요." });
      return null;
    }
    if (!/^https?:\/\//.test(trimmed)) {
      set({ error: "http 또는 https 로 시작하는 URL 이어야 합니다." });
      return null;
    }
    set({ isSubmitting: true, error: null });
    try {
      const created = await userJobDescriptionApi.create({
        url: trimmed,
        title: customTitle || undefined,
        applicationStatus: status,
      });
      set({ isSubmitting: false });
      return created.uuid;
    } catch (e) {
      set({
        isSubmitting: false,
        error: e instanceof Error ? e.message : "등록에 실패했습니다.",
      });
      return null;
    }
  },

  // 임시저장 기능은 backend 에 아직 없음. 로컬 성공으로만 처리.
  saveDraft: async () => {
    set({ isSaving: true, error: null });
    await new Promise((r) => setTimeout(r, 120));
    set({ isSaving: false });
    return true;
  },

  reset: () => set(INITIAL),
}));
