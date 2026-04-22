/** 인터뷰 셋업 - 저장된 채용공고 목록.
 *
 * 실제 backend `/api/v1/user-job-descriptions/` 를 호출해 UserJobDescription 목록을
 * 가져오고 setup UI 에서 쓰는 shape 로 매핑한다.
 */

import { userJobDescriptionApi } from "@/features/user-job-description";

export interface SetupJdItem {
  /** UserJobDescription.uuid — 인터뷰 세션 생성 시 이 값을 그대로 사용. */
  uuid: string;
  /** lucide-react 아이콘 선택을 위한 platform 문자열 */
  platform: string;
  company: string;
  role: string;
  stage: string;
  badgeLabel: string;
  badgeType: "green" | "accent";
  /** 수집이 완료되지 않은 항목은 선택 불가. */
  disabled: boolean;
}

export async function fetchSetupJdListApi(): Promise<SetupJdItem[]> {
  const raw = await userJobDescriptionApi.list();
  return raw.map((item) => {
    const jd = item.jobDescription;
    const isReady = jd.collectionStatus === "done";
    const isFailed = jd.collectionStatus === "error";
    return {
      uuid: item.uuid,
      platform: jd.platform || "",
      company: jd.company || "수집 중",
      role: jd.title || "채용공고",
      stage: jd.location || jd.workType || jd.platform || "",
      badgeLabel: isReady ? "수집 완료" : isFailed ? "수집 실패" : "수집 중",
      badgeType: isReady ? "green" : "accent",
      // 수집이 완료된 공고만 면접 선택 가능.
      disabled: !isReady,
    };
  });
}

export async function fetchSetupJdByUuidApi(uuid: string): Promise<SetupJdItem | null> {
  try {
    const item = await userJobDescriptionApi.retrieve(uuid);
    const jd = item.jobDescription;
    const isReady = jd.collectionStatus === "done";
    const isFailed = jd.collectionStatus === "error";

    return {
      uuid: item.uuid,
      platform: jd.platform || "",
      company: jd.company || "수집 중",
      role: jd.title || "채용공고",
      stage: jd.location || jd.workType || jd.platform || "",
      badgeLabel: isReady ? "수집 완료" : isFailed ? "수집 실패" : "수집 중",
      badgeType: isReady ? "green" : "accent",
      disabled: !isReady,
    };
  } catch {
    return null;
  }
}
