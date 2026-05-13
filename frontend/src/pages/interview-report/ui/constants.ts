export const GRADE_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  Excellent: { bg: "bg-[#EDE9FE]", text: "text-[#7C3AED]", label: "Excellent" },
  Good: { bg: "bg-[#E6F7FA]", text: "text-[#0991B2]", label: "Good" },
  Average: { bg: "bg-[#FEF3C7]", text: "text-[#D97706]", label: "Average" },
  "Below Average": { bg: "bg-[#FEE2E2]", text: "text-[#B91C1C]", label: "Below Avg" },
  Poor: { bg: "bg-[#FEE2E2]", text: "text-[#B91C1C]", label: "Poor" },
};

export function getGrade(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Average";
  if (score >= 30) return "Below Average";
  return "Poor";
}
