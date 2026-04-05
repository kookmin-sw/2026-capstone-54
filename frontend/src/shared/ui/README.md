# meFit 디자인 시스템

## 공통 컴포넌트

### Button

```tsx
import { Button } from '@/shared/ui';

// Primary 버튼
<Button variant="primary" size="md">
  면접 시작하기 →
</Button>

// Secondary 버튼
<Button variant="secondary" size="sm">
  임시저장
</Button>

// Ghost 버튼
<Button variant="ghost" onClick={handleCancel}>
  취소
</Button>
```

### Card

```tsx
import { Card } from '@/shared/ui';

// 기본 카드
<Card>
  <h3>제목</h3>
  <p>내용</p>
</Card>

// 다크 카드
<Card variant="dark">
  <h3>다크 테마</h3>
</Card>

// 테두리 카드
<Card variant="bordered">
  <h3>화이트 배경</h3>
</Card>
```

### Badge

```tsx
import { Badge } from '@/shared/ui';

<Badge variant="primary">Pro</Badge>
<Badge variant="success">완료</Badge>
<Badge variant="neutral">대기</Badge>
<Badge variant="warning">주의</Badge>
```

### Input

```tsx
import { Input } from '@/shared/ui';

<Input 
  label="이메일"
  type="email"
  placeholder="hello@mefit.kr"
  error={errors.email}
/>
```

## 디자인 토큰

### 색상
- `var(--fg)` - 메인 텍스트 (#0A0A0A)
- `var(--accent)` - 액센트 컬러 (#0991B2)
- `var(--muted)` - 보조 텍스트 (#6B7280)
- `var(--em)` - 강조 (성공) (#059669)
- `var(--am)` - 경고 (#D97706)

### 그림자
- `shadow-card` - 카드 기본 그림자
- `shadow-card-hover` - 카드 호버 그림자
- `shadow-button` - 버튼 그림자

### 간격
- `gap-3` = 12px
- `gap-4` = 16px
- `gap-6` = 24px
- `py-25` = 100px (커스텀)

### 폰트
- `font-inter` - Inter 폰트
- `font-bold` - 700
- `font-extrabold` - 800
- `font-black` - 900

## Tailwind 유틸리티 클래스

### 자주 쓰는 조합

```tsx
// 카드 스타일
className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-6 shadow-card"

// 버튼 스타일
className="bg-[var(--fg)] text-white px-6 py-3 rounded-lg font-bold hover:opacity-85"

// 입력 필드
className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:border-[var(--accent)]"

// 배지
className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#E6F7FA] text-[var(--accent)]"
```

## 반응형 디자인

```tsx
// 모바일: 세로 스택, 데스크탑: 가로 배치
className="flex flex-col gap-4 md:flex-row md:gap-6"

// 모바일: 1열, 태블릿: 2열, 데스크탑: 3열
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"

// 모바일: 작은 텍스트, 데스크탑: 큰 텍스트
className="text-[14px] md:text-[16px]"
```

## 애니메이션

```tsx
// 페이드업 애니메이션
className="animate-fadeUp"

// 스켈레톤 로딩
className="animate-shimmer bg-gradient-to-r from-[#F3F4F6] via-[#E5E7EB] to-[#F3F4F6]"
```
