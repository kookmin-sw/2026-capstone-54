/** platform·title 키워드 → 카테고리 id 추론 */

const PLATFORM_MAP: [string[], number][] = [
  [["인사", "hr"],              5],
  [["영업", "서비스"],          4],
  [["금융", "회계"],            3],
  [["마케팅", "광고"],          2],
  [["it", "개발"],              1],
];

const KEYWORD_MAP: [string[], number][] = [
  [["tech", "software", "개발", "engineer", "it", "dev",
    "backend", "frontend", "fullstack", "data", "ai", "ml",
    "naver", "kakao", "google", "meta", "nexon", "ncsoft"], 1],
  [["market", "마케팅", "광고", "brand", "브랜드",
    "content", "콘텐츠", "design", "디자인"],              2],
  [["bank", "은행", "금융", "finance", "pay", "toss",
    "카드", "결제", "회계", "accounting"],                  3],
  [["sales", "영업", "service", "서비스", "cs", "고객",
    "delivery", "배달", "물류", "shop", "쇼핑", "commerce"], 4],
  [["hr", "인사", "recruit", "채용", "people", "talent"],  5],
];

function matchKeywords(src: string, map: [string[], number][]): number {
  for (const [keywords, id] of map) {
    if (keywords.some((k) => src.includes(k))) return id;
  }
  return 0;
}

export function inferCategoryId(platform: string, title: string): number {
  const platformId = matchKeywords(platform.toLowerCase(), PLATFORM_MAP);
  if (platformId !== 0) return platformId;
  return matchKeywords(`${platform} ${title}`.toLowerCase(), KEYWORD_MAP);
}
