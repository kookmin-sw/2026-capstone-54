/**
 * 비밀번호 유효성 검사 공통 유틸리티
 *
 * 비밀번호 정책: 8자 이상, 대문자·소문자·숫자·특수문자 각 1개 이상 포함
 * 정책 변경 시 이 파일만 수정하면 됩니다.
 */

const SPECIAL_CHARS = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

/** PasswordChecklist 컴포넌트와 공유하는 체크 항목 목록 */
export const PASSWORD_CHECKS = [
  { label: "8자 이상",  test: (pw: string) => pw.length >= 8 },
  { label: "대문자",    test: (pw: string) => /[A-Z]/.test(pw) },
  { label: "소문자",    test: (pw: string) => /[a-z]/.test(pw) },
  { label: "숫자",      test: (pw: string) => /[0-9]/.test(pw) },
  { label: "특수문자",  test: (pw: string) => SPECIAL_CHARS.test(pw) },
] as const;

/**
 * 비밀번호 유효성을 검사하고 첫 번째 위반 사항의 에러 메시지를 반환합니다.
 * 유효한 경우 null을 반환합니다.
 */
export function validatePassword(pw: string): string | null {
  if (pw.length < 8) return "비밀번호는 8자 이상이어야 합니다.";
  if (!/[A-Z]/.test(pw)) return "비밀번호에 대문자를 포함해야 합니다.";
  if (!/[a-z]/.test(pw)) return "비밀번호에 소문자를 포함해야 합니다.";
  if (!/[0-9]/.test(pw)) return "비밀번호에 숫자를 포함해야 합니다.";
  if (!SPECIAL_CHARS.test(pw)) return "비밀번호에 특수문자를 포함해야 합니다.";
  return null;
}
