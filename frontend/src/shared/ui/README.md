# 공통 UI 컴포넌트 가이드

이 디렉토리는 프로젝트 전체에서 재사용 가능한 UI 컴포넌트들을 포함합니다.

## 사용 가능한 컴포넌트

### Layout & Structure

#### `<Navigation />`
고정 상단 네비게이션 바

```tsx
import { Navigation } from "@/shared/ui";

const navItems = [
  { to: "/home", label: "홈" },
  { to: "/jd", label: "채용공고", active: true },
  { to: "/interview", label: "면접 시작" },
  { to: "/resume", label: "이력서" },
];

<Navigation items={navItems} />
```

#### `<Card />`
기본 카드 컨테이너

```tsx
import { Card } from "@/shared/ui";

<Card padding="lg">
  <h2>카드 제목</h2>
  <p>카드 내용</p>
</Card>

// padding: "none" | "sm" | "md" | "lg"
```

#### `<PageHeader />`
페이지 상단 헤더 (뱃지, 제목, 설명, 액션 버튼)

```tsx
import { PageHeader } from "@/shared/ui";

<PageHeader
  badge="+ 채용공고 추가"
  title="새 채용공고 등록"
  description="URL만 붙여넣으면 AI가 나머지를 분석해 드려요"
  action={<Button>목록으로</Button>}
/>
```

#### `<SectionHeader />`
섹션 헤더 (아이콘, 제목, 설명)

```tsx
import { SectionHeader } from "@/shared/ui";

<SectionHeader
  icon="🔗"
  title="채용공고 URL"
  description="정확한 채용공고 페이지 URL을 입력해주세요"
  gradient="linear-gradient(135deg,#60A5FA,#2563EB)"
/>
```

#### `<Divider />`
구분선

```tsx
import { Divider } from "@/shared/ui";

<Divider spacing="md" />
// spacing: "sm" | "md" | "lg"
```

### Form Components

#### `<Input />`
텍스트 입력 필드

```tsx
import { Input } from "@/shared/ui";

<Input
  label="이메일"
  required
  helperText="회사 이메일을 입력하세요"
  icon="📧"
  type="email"
  placeholder="example@company.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={error}
/>
```

#### `<Textarea />`
여러 줄 텍스트 입력

```tsx
import { Textarea } from "@/shared/ui";

<Textarea
  label="자기소개"
  maxLength={5000}
  value={content}
  onChange={(e) => setContent(e.target.value)}
  showCharCount
  rows={10}
/>
```

#### `<Toggle />`
토글 스위치

```tsx
import { Toggle } from "@/shared/ui";

<Toggle
  checked={isActive}
  onChange={setIsActive}
  label="AI 면접에 포함하기"
  description="비활성화 시 면접 질문 생성에서 제외됩니다"
/>
```

### Interactive Components

#### `<Button />`
버튼 컴포넌트

```tsx
import { Button } from "@/shared/ui";

<Button variant="primary" size="md" onClick={handleClick}>
  저장하기
</Button>

<Button variant="secondary" loading={isLoading}>
  처리 중...
</Button>

// variant: "primary" | "secondary" | "outline" | "ghost" | "link"
// size: "sm" | "md" | "lg"
```

#### `<Chip />`
선택 가능한 칩/태그

```tsx
import { Chip } from "@/shared/ui";

<Chip
  icon="🎨"
  selected={selected === "frontend"}
  onClick={() => setSelected("frontend")}
>
  프론트엔드
</Chip>

<Chip onRemove={() => removeTag(tag)}>
  {tag}
</Chip>
```

#### `<StatusCard />`
상태 선택 카드 그리드

```tsx
import { StatusCard } from "@/shared/ui";

const options = [
  { value: "planned", icon: "📅", label: "지원 예정", desc: "곧 지원할 예정" },
  { value: "applied", icon: "✅", label: "지원 완료", desc: "이미 지원함" },
];

<StatusCard
  options={options}
  selected={status}
  onSelect={setStatus}
  columns={3}
/>
```

### Feedback Components

#### `<Alert />`
알림 메시지

```tsx
import { Alert } from "@/shared/ui";

<Alert variant="error">
  오류가 발생했습니다
</Alert>

<Alert variant="success">
  저장되었습니다
</Alert>

// variant: "info" | "success" | "warning" | "error"
```

#### `<Badge />`
상태 뱃지

```tsx
import { Badge } from "@/shared/ui";

<Badge variant="success">✓ 완료</Badge>
<Badge variant="info">진행 중</Badge>

// variant: "default" | "success" | "warning" | "error" | "info" | "primary"
// size: "sm" | "md"
```

#### `<ProgressBar />`
진행률 표시

```tsx
import { ProgressBar } from "@/shared/ui";

<ProgressBar
  value={75}
  max={100}
  showLabel
  label="작성 완성도"
/>
```

#### `<Spinner />`
로딩 스피너

```tsx
import { Spinner } from "@/shared/ui";

<Spinner size="md" />
// size: "sm" | "md" | "lg"
```

## 마이그레이션 가이드

### Before (기존 코드)

```tsx
<div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] p-[28px_24px]">
  <div className="text-[15px] font-extrabold text-[#0A0A0A] mb-1 flex items-center gap-2">
    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[13px] shrink-0" style={{ background: "linear-gradient(135deg,#60A5FA,#2563EB)" }}>🔗</span>
    채용공고 URL
  </div>
  <p className="text-[13px] text-[#6B7280] mb-[18px] ml-9">정확한 채용공고 페이지 URL을 입력해주세요.</p>
  
  <div className="relative">
    <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-base pointer-events-none">🔗</span>
    <input
      type="url"
      className="w-full bg-white border border-[#E5E7EB] rounded-lg py-[13px] pr-4 pl-11 text-sm font-medium text-[#0A0A0A] outline-none transition-[border-color] appearance-none focus:border-[#0991B2] focus:shadow-[0_0_0_3px_rgba(9,145,178,0.1)] placeholder:text-[#D1D5DB]"
      placeholder="https://..."
      value={url}
      onChange={(e) => setUrl(e.target.value)}
    />
  </div>
</div>
```

### After (리팩토링 후)

```tsx
import { Card, SectionHeader, Input } from "@/shared/ui";

<Card>
  <SectionHeader
    icon="🔗"
    title="채용공고 URL"
    description="정확한 채용공고 페이지 URL을 입력해주세요."
    gradient="linear-gradient(135deg,#60A5FA,#2563EB)"
  />
  
  <Input
    icon="🔗"
    type="url"
    placeholder="https://..."
    value={url}
    onChange={(e) => setUrl(e.target.value)}
  />
</Card>
```

## 디자인 토큰

모든 컴포넌트는 일관된 디자인 토큰을 사용합니다:

- **Primary Color**: `#0991B2`
- **Text Colors**: `#0A0A0A` (primary), `#6B7280` (secondary), `#9CA3AF` (muted)
- **Border**: `#E5E7EB`
- **Background**: `#F9FAFB` (card), `#FFFFFF` (base)
- **Success**: `#059669`
- **Error**: `#DC2626`
- **Warning**: `#D97706`

## 기여 가이드

새로운 공통 컴포넌트를 추가할 때:

1. 최소 3개 이상의 페이지에서 동일한 패턴이 반복될 때만 추가
2. Props는 명확하고 일관성 있게 정의
3. TypeScript 타입을 명시적으로 정의
4. 접근성(a11y) 고려 (aria-label, role 등)
5. `index.ts`에 export 추가

## 다음 단계

아직 리팩토링되지 않은 페이지들:
- `src/pages/jd-list/ui/JdListPage.tsx`
- `src/pages/jd-detail/ui/JdDetailPage.tsx`
- `src/pages/jd-edit/ui/JdEditPage.tsx`
- `src/pages/resume-list/ui/ResumeListPage.tsx`
- `src/pages/interview-setup/ui/InterviewSetupPage.tsx`
- `src/pages/interview-precheck/ui/InterviewPreCheckPage.tsx`
- `src/pages/login/ui/LoginPage.tsx`
- `src/pages/sign-up/ui/SignUpPage.tsx`
- `src/pages/settings/ui/SettingsPage.tsx`

이 페이지들도 점진적으로 공통 컴포넌트를 적용하면 코드 중복이 크게 줄어들고 유지보수가 쉬워집니다.
