/** 인터뷰 셋업 - 저장된 채용공고 목록.
 *
 * 실제 backend `/api/v1/user-job-descriptions/` 를 호출해 UserJobDescription 목록을
 * 가져오고 setup UI 에서 쓰는 shape 로 매핑한다.
 */

import { userJobDescriptionApi } from "@/features/user-job-description";
import { inferCategoryId } from "@/shared/ui/inferCategoryId";

export interface SetupJdItem {
  /** UserJobDescription.uuid — 인터뷰 세션 생성 시 이 값을 그대로 사용. */
  uuid: string;
  categoryId: number;
  company: string;
  role: string;
  stage: string;
  badgeLabel: string;
  badgeType: "green" | "accent";
  /** 수집이 완료되지 않은 항목은 선택 불가. */
  disabled: boolean;
}

function toBadgeLabel(isReady: boolean, isFailed: boolean): string {
  if (isReady) return "수집 완료";
  if (isFailed) return "수집 실패";
  return "수집 중";
}

function toSetupJdItem(uuid: string, jd: { platform?: string; title?: string; company?: string; location?: string; workType?: string; collectionStatus?: string }): SetupJdItem {
  const isReady = jd.collectionStatus === "done";
  const isFailed = jd.collectionStatus === "error";
  const role = jd.title || "채용공고";
  return {
    uuid,
    categoryId: inferCategoryId(jd.platform || "", role),
    company: jd.company || "수집 중",
    role,
    stage: jd.location || jd.workType || jd.platform || "",
    badgeLabel: toBadgeLabel(isReady, isFailed),
    badgeType: isReady ? "green" : "accent",
    disabled: !isReady,
  };
}

export async function fetchSetupJdListApi(): Promise<SetupJdItem[]> {
  const raw = await userJobDescriptionApi.list();
  return raw.map((item) => toSetupJdItem(item.uuid, item.jobDescription));
}

export async function fetchSetupJdByUuidApi(uuid: string): Promise<SetupJdItem | null> {
  try {
    const item = await userJobDescriptionApi.retrieve(uuid);
    return toSetupJdItem(item.uuid, item.jobDescription);
  } catch {
    return null;
  }
}
