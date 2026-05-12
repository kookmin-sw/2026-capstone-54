# Use Case — MeFit 시스템 유스케이스

| 항목 | 내용 |
|---|---|
| **종류** | Use Case Diagram |
| **PUML** | [`usecase-mefit-platform.puml`](./usecase-mefit-platform.puml) |
| **이미지** | [`../out/usecase_diagrams/usecase-mefit-platform.png`](../out/usecase_diagrams/usecase-mefit-platform.png) |

## 목적

MeFit 의 **전체 시스템 범위** 를 액터별 (사용자 / 관리자 / 외부 시스템) 유스케이스로 시각화합니다. *"누가 / 무엇을 할 수 있는가"* 를 한 다이어그램으로 정리.

## 액터 (Actor)

| 액터 | 설명 |
|---|---|
| **사용자 (User)** | 일반 가입자 — Free / Pro 플랜 |
| **운영자 (Admin)** | Django Admin 접근자 — 시드 / 모니터링 / 운영 |
| **외부 시스템** | OpenAI / Microsoft (TTS) / AWS Lambda / 채용 사이트 |

## 주요 유스케이스 그룹

1. **인증 / 온보딩** — 가입 / 로그인 / 프로필 작성
2. **이력서 관리** — 등록 (파일 / 텍스트) / 편집 / 최종 저장
3. **채용공고 관리** — URL 등록 (스크래핑) / 직접 입력 / 편집
4. **면접 진행** — Precheck / 면접 / 답변 녹화
5. **분석 리포트** — 생성 트리거 / 결과 확인
6. **게이미피케이션** — 스트릭 / 업적 / 보상 청구
7. **결제 / 티켓** — 잔량 조회 / 결제 (예정)
8. **운영** — 사용자 관리 / 정책 변경 / 모니터링

## 활용 시점

- 보고서 §2.2.4 시스템 구조 / 설계
- 발표 자료 — 시스템 범위 소개
- 신규 합류자 onboarding

## 관련 문서

- 보고서: [`../../report-drafts/02-5-system-design.md`](../../report-drafts/02-5-system-design.md)
- FR 명세: [`../../report-drafts/fr/`](../../report-drafts/fr/) (120 개 FR)
