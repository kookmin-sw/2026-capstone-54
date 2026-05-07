[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/Lvs6kcL8)

<div align="center">

# 미핏 · 54팀

**未fit, meFit. 이력서·채용공고 기반 AI 가상 면접과 음성·영상 분석 리포트로 면접 준비를 완성하는 플랫폼.**

국민대학교 캡스톤 2026 · 54팀

[**팀 페이지 (GitHub Pages)**](https://kookmin-sw.github.io/2026-capstone-54/) ·
[**사이트**](https://mefit.kr) ·
[**API 서버**](https://api.mefit.kr) ·
[**팀 GitHub**](https://github.com/kmu-aws-capstone-team-4)

</div>

---

## 1. 프로젝트 소개

**meFit (미핏)** 은 사용자가 자신의 이력서와 지원할 채용공고를 입력하면, AI가 두 정보를 결합해 실제 면접관처럼 맞춤형 질문을 던지고 답변을 음성·영상으로 녹화 후 종합 분석 리포트를 자동 생성하는 가상 면접 플랫폼입니다.

### 핵심 기능 3가지

| 기능 | 설명 |
|---|---|
| **이력서 + 채용공고 수집/분석** | PDF·DOCX 업로드 또는 URL 입력 → LangChain + OpenAI 로 자동 파싱 |
| **꼬리질문 면접 + 전체 프로세스 면접** | FOLLOWUP / FULL_PROCESS · EASY/MEDIUM/HARD · 친근/일반/압박 면접관 |
| **종합 분석 리포트** | LLM 채점 + 음성/표정 분석 |

### 부가 기능

- 스트릭 & 도전과제 (게이미피케이션)
- 이메일 알림 시스템
- 티켓 재화 기반 사용 횟수 관리

## 2. 소개 영상

> 추가 예정

## 3. 팀 소개

| 이름 | 역할 | 담당 |
|---|---|---|
| **김신건** | PM | 프로젝트 매니징 · 전체 아키텍처 · AI/Infra/Backend 전반 |
| **김석준** | Backend | Django · 채용공고, 표정 분석 파이프라인 |
| **김유진** | Backend | Django · 면접 질문 생성 및 분석 파이프라인 |
| **이주현** | Frontend | Frontend 개발 및 디자인 전반 |

## 4. 기술 스택

**프론트엔드** React 19 · Vite · Bun · TypeScript · Tailwind CSS 4 · Zustand · MediaRecorder API
**백엔드** Django 6 · DRF · Celery · Channels · LangChain · Pydantic · LiteLLM
**AI / ML** OpenAI GPT-4o · GPT-4o Vision · Embedding · MediaPipe (face-analyzer) · Whisper STT
**인프라** AWS EC2 + k3s · Traefik · RDS PostgreSQL · S3 · SNS/SQS · Lambda 5종
**관측** Grafana · Prometheus · Loki · Flower · TokenUsage 추적
**CI/CD** GitHub Actions · Docker Hub · deploy.sh 무중단 배포

## 5. 마이크로서비스

| 서비스 | 역할 |
|---|---|
| `backend` | Django API + 비즈니스 로직 + WebSocket/SSE |
| `frontend` | React 19 사용자 UI |
| `analysis-resume` | 이력서 텍스트 추출 + 임베딩 + LLM 파싱 |
| `analysis-stt` | 면접 발화 STT (Whisper) |
| `interview-analysis-report` | 면접 종합 분석 리포트 (LangChain + Hypothesis) |
| `voice-api` | TTS (FastAPI + edge-tts) |
| `face-analyzer` | 표정 분석 (MediaPipe Lambda) |
| `scraping` | 채용공고 자동 수집 (Playwright) |
| `infra` | k3s 매니페스트 + 배포 스크립트 |

## 6. 사용법

### 사용자

1. [`https://mefit.kr`](https://mefit.kr) 방문 → 회원가입 → 이메일 인증 → 직무/경력 입력
2. 이력서 업로드 (PDF/DOCX) 또는 텍스트 입력
3. 채용공고 URL 입력 (사람인/잡코리아/잡플래닛 등) 또는 직접 입력
4. 면접 모드 + 난이도 선택 → Precheck → 면접 시작
5. 면접 종료 후 분석 리포트 생성 클릭 → 점수 + 음성/표정 분석 확인

© 2026 meFit (미핏) · 김신건 · 김석준 · 김유진 · 이주현
