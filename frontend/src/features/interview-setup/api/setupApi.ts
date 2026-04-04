const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface SetupJdItem {
  id: string;
  icon: string;
  company: string;
  role: string;
  stage: string;
  badgeLabel: string;
  badgeType: "green" | "accent";
}

export async function fetchSetupJdListApi(): Promise<SetupJdItem[]> {
  await delay(200);
  return [
    { id: "j1", icon: "🏦", company: "카카오뱅크", role: "백엔드 개발자", stage: "1차 면접", badgeLabel: "지원 완료", badgeType: "green" },
    { id: "j2", icon: "💳", company: "토스",       role: "서버 개발자",    stage: "서류 전형",  badgeLabel: "지원 예정", badgeType: "accent" },
    { id: "j3", icon: "🟢", company: "네이버",     role: "플랫폼 개발",    stage: "2차 면접",   badgeLabel: "지원 완료", badgeType: "green" },
  ];
}
