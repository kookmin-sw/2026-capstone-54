# Home Page Components

이 디렉토리는 HomePage를 구성하는 개별 컴포넌트들을 포함합니다.

## 컴포넌트 구조

### Layout Components
- **HomeNavbar** - 상단 네비게이션 바
- **HomeSidebar** - 좌측 사이드바 메뉴
- **LoadingSkeleton** - 로딩 상태 스켈레톤 UI

### Content Components
- **HomeHeader** - 페이지 헤더 (인사말, 사용자 이름)
- **QuickStartHero** - 빠른 시작 CTA 섹션
- **StatsGrid** - 통계 카드 그리드 (면접 횟수, 평균 점수 등)
- **RecentSessions** - 최근 면접 기록 목록
- **StreakCalendar** - 스트릭 달력
- **JobStatus** - 지원 현황 카드

## 사용 예시

```tsx
import {
  HomeNavbar,
  HomeSidebar,
  HomeHeader,
  QuickStartHero,
  StatsGrid,
  RecentSessions,
  StreakCalendar,
  JobStatus,
  LoadingSkeleton,
} from "./components";

// HomePage.tsx에서 사용
<HomeNavbar menuOpen={menuOpen} onMenuToggle={handleToggle} />
<HomeSidebar menuOpen={menuOpen} currentStreak={12} />
<StatsGrid stats={data.stats} revealed={true} />
```

## 타입 정의

모든 컴포넌트는 `@/features/home/api/homeApi`에서 타입을 가져옵니다:
- `HomeStat` - 통계 데이터
- `HomeSession` - 면접 세션 데이터
- `HomeJob` - 채용 공고 데이터
