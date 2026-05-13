interface HomeHeaderProps {
  greeting: string;
  userName: string;
  lastInterviewDaysAgo: number | null;
}

export function HomeHeader({ greeting, userName, lastInterviewDaysAgo }: HomeHeaderProps) {
  const subText = lastInterviewDaysAgo === null
    ? "아직 면접 기록이 없어요. 첫 면접을 시작해보세요!"
    : lastInterviewDaysAgo === 0
      ? "오늘 면접을 진행했어요. 스트릭을 이어가세요!"
      : `마지막 면접으로부터 ${lastInterviewDaysAgo}일이 지났어요. 스트릭을 이어가세요!`;

  return (
    <div className="hp-header">
      <div className="hp-eyebrow">{greeting}</div>
      <h1 className="hp-title">
        안녕하세요, {userName} 님.<br />오늘도 핏을 맞춰볼까요?
      </h1>
      <p className="hp-sub">{subText}</p>
    </div>
  );
}
