/**
 * 현재 시간대에 맞는 인사말을 반환합니다.
 *
 * 새벽  (05:00 ~ 08:59) → "Good morning ☀️"
 * 오전  (09:00 ~ 11:59) → "Good morning ☀️"
 * 점심  (12:00 ~ 13:59) → "Good afternoon 🌤️"
 * 오후  (14:00 ~ 17:59) → "Good afternoon 🌤️"
 * 저녁  (18:00 ~ 20:59) → "Good evening 🌆"
 * 밤    (21:00 ~ 04:59) → "Good night 🌙"
 */
export function getTimeBasedGreeting(now: Date = new Date()): string {
  const hour = now.getHours();

  if (hour >= 5 && hour < 12) return "Good morning ☀️";
  if (hour >= 12 && hour < 18) return "Good afternoon 🌤️";
  if (hour >= 18 && hour < 21) return "Good evening 🌆";
  return "Good night 🌙";
}
