/**
 * notifiableType과 notifiableId를 받아 해당 객체의 프론트엔드 경로를 반환합니다.
 * 라우팅 구조 기준:
 *   /resume/:uuid
 *   /interview/session/:uuid/report
 *   /jd/:uuid
 */
export function getNotifiableUrl(
  notifiableType: string | null,
  notifiableId: string | null,
): string | null {
  if (!notifiableType || !notifiableId) return null;

  switch (notifiableType) {
    case "resumes.resume":
      return `/resume/${notifiableId}`;
    case "interviews.interviewsession":
      return `/interview/session/${notifiableId}/report`;
    case "job_descriptions.userjobdescription":
      return `/jd/${notifiableId}`;
    default:
      return null;
  }
}
