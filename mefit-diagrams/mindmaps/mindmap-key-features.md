# Mindmap — 핵심 기능 7 가지

| 항목 | 내용 |
|---|---|
| **종류** | Mindmap |
| **PUML** | [`mindmap-key-features.puml`](./mindmap-key-features.puml) |
| **이미지** | [`../out/mindmaps/mindmap-key-features.png`](../out/mindmaps/mindmap-key-features.png) |

## 목적

MeFit 의 **7 개 핵심 기능** 을 한눈에 시각화하여 *"이 시스템이 무엇을 하는가"* 를 빠르게 파악할 수 있도록 합니다.

## 표현 내용

7 개 핵심 기능 (대략):
1. **이력서 · 채용공고 분석** — PDF/DOCX 파싱 + LLM 추출 + 임베딩
2. **AI 가상 화상 면접** — WebSocket + MediaRecorder + TTS/STT + 5~10 질문 Q&A
3. **표정 분석** — face-analyzer Lambda (긍정 / 부정 / 중립 / no_face)
4. **발화 · 음성 분석** — voice-analyzer Lambda (속도 / 필러 / 침묵 / 음량)
5. **6 카테고리 LLM 리포트** — 분석 후 5 카테고리 + 종합 점수 + 등급
6. **스트릭 · 업적 · 티켓** — 게이미피케이션 + BM
7. **데이터 자산화 (To-Be)** — 멘토링 인사이트 반영

## 활용 시점

- 발표 자료 — 서비스 소개 슬라이드
- 마케팅 / 포스터
- 신규 합류자 onboarding

## 관련 문서

- 보고서: [`../../report-drafts/05-key-features.md`](../../presentation-docs/05-key-features.md) (presentation-docs)
- 사용자 흐름: [`../../report-drafts/02-3-functional-requirements.md`](../../report-drafts/02-3-functional-requirements.md)
