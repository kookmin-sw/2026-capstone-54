# meFit - AI 면접 준비 플랫폼

React + TypeScript + Vite로 구축된 AI 기반 면접 준비 플랫폼입니다.

## 기술 스택

- React 19.2.0
- TypeScript
- Vite
- Zustand (상태 관리)
- React Router DOM
- Tailwind CSS 4.2.1

## 프로젝트 구조 (FSD)

Feature-Sliced Design 아키텍처를 따릅니다:

```
src/
├── app/          # 앱 설정, 라우팅, 전역 스타일
├── pages/        # 페이지 컴포넌트
│   ├── landing/  # 랜딩 페이지
│   ├── home/     # 대시보드 홈
│   ├── login/    # 로그인
│   ├── sign-up/  # 회원가입
│   └── ...
├── widgets/      # 복합 UI 블록
├── features/     # 비즈니스 기능
├── entities/     # 비즈니스 엔티티
└── shared/       # 공유 UI, 유틸리티
```

## 라우트

- `/` - 랜딩 페이지
- `/home` - 대시보드 홈 (면접 통계, 활동 스트릭)
- `/sign-up` - 회원가입
- `/login` - 로그인
- `/verify-email` - 이메일 인증
- `/onboarding` - 온보딩

## 디자인 시스템

### 색상
- 배경: `#FFFFFF`
- 액센트: `#0991B2` / `#06B6D4`
- 로고: me + **Fit** (Fit 색상 `#0991B2`)
- 배지: `#0991B2` 텍스트 + `#E6F7FA` 배경
- 버튼: `#0A0A0A` 배경 + 흰색 텍스트
- 카드: `#F9FAFB` 배경 + `#E5E7EB` 보더

### 폰트
- Inter (무게: 900/800/700)

### 그림자
- `var(--sc)`: 기본 카드 그림자

## 개발 시작

```bash
# 의존성 설치
bun install

# 개발 서버 실행
bun run dev

# 빌드
bun run build

# 테스트
bun run test
```

## React Compiler

이 템플릿은 React Compiler가 활성화되어 있습니다. 자세한 내용은 [공식 문서](https://react.dev/learn/react-compiler)를 참조하세요.
