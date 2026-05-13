const STT_EXPECTED = "안녕하세요 저는 지원자입니다";

function normalize(s: string) {
  return s.replace(/[,.\s]/g, "").toLowerCase();
}

export type SttMatchResult = "match" | "mismatch" | "empty";

export function checkSttMatch(transcript: string): SttMatchResult {
  const t = normalize(transcript);
  if (!t) return "empty";
  const expected = normalize(STT_EXPECTED);
  let matched = 0;
  let j = 0;
  for (let i = 0; i < t.length && j < expected.length; i++) {
    if (t[i] === expected[j]) { matched++; j++; }
  }
  return matched / expected.length >= 0.5 ? "match" : "mismatch";
}
