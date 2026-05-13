# mefit-diagrams

MeFit 프로젝트의 모든 다이어그램을 **코드 기반으로 재생성 가능**하게 관리합니다.

본 디렉토리는 두 가지 도구를 함께 사용합니다.

| 도구 | 용도 | 디렉토리 |
|---|---|---|
| **diagrams (Python)** | 인프라 토폴로지 (AWS / k3s / 통합) | `main.py`, `main-future.py` |
| **PlantUML (.puml)** | 클래스 / 시퀀스 / 상태 / 활동 / 컴포넌트 / 마인드맵 / 간트 | 분류 디렉토리 (아래 참조) |

## 디렉토리 구조

```
mefit-diagrams/
├── main.py                       # 인프라 (현재) — diagrams 라이브러리
├── main-future.py                # 인프라 (미래) — diagrams 라이브러리
├── *.png                         # 위 두 스크립트의 출력
│
├── activity_diagrams/            # 활동 + 상태 머신
│   ├── activity-01-auth.puml
│   ├── activity-02-resume.puml
│   ├── activity-03-job-description.puml
│   ├── activity-04-interview.puml
│   ├── activity-05-analysis-report.puml
│   ├── state-interview-machine.puml      (Frontend useReducer Machine A)
│   ├── state-interview-pause-resume.puml  (★ Zustand Machine B - orthogonal)
│   ├── state-interview-machine.md         (★ 두 머신 설계 문서)
│   ├── state-interview-session.puml      (Backend 도메인 + pause/resume)
│   ├── state-resume.puml
│   ├── state-user-job-description.puml
│   ├── state-analysis-report.puml
│   └── state-interview-recording.puml
│
├── class_diagrams/               # 도메인 클래스 다이어그램
│   ├── class-interviews.puml
│   ├── class-resumes.puml
│   ├── class-job-descriptions.puml
│   └── class-tickets-subscriptions.puml
│
├── sequence_diagrams/            # 시퀀스 (시간 순)
│   ├── sequence-interview-full-flow.puml      (전체 면접 흐름)
│   ├── sequence-interview-question-generation.puml  (★ FOLLOWUP / FULL_PROCESS 분기)
│   ├── sequence-resume-analysis.puml          (이력서 업로드 + 분석)
│   ├── sequence-jobposting-scraping.puml      (FR-JD-01~10 채용공고 수집)
│   ├── sequence-auth-signup.puml              (FR-AUTH-01~10 회원가입/이메일/JWT)
│   ├── sequence-tickets-lifecycle.puml        (FR-SUB + FR-TICKET 라이프사이클)
│   ├── sequence-report-generation.puml        (FR-REPORT 5+단계 zoom-in)
│   └── sequence-realtime-notification.puml    (SSE + Redis Channel Layer)
│
├── component_diagrams/           # 컴포넌트 / 시스템 구조
│   ├── component-microservices.puml      (12 모듈 통신)
│   ├── component-domain-dependencies.puml (9 도메인 의존)
│   ├── component-aws-event-pipeline.puml (이벤트 파이프라인 PUML)
│   ├── component-security-roadmap.puml   (보안 강화 4 단계)
│   ├── component-plan-vs-final.puml      (계획 vs 최종 비교)
│   └── component-interview-report-ui.puml (★ Frontend 면접 리포트 UI 구조)
│
├── usecase_diagrams/             # 유스케이스 (사용자 / 관리자 / 외부 시스템)
│   └── usecase-mefit-platform.puml       (9 도메인 통합 유스케이스)
│
├── mindmaps/                     # 마인드맵
│   ├── mindmap-goals.puml                (23 세부 목표 트리)
│   ├── mindmap-key-features.puml         (핵심 기능 7가지)
│   ├── mindmap-impact.puml               (기대효과 5 영역)
│   └── mindmap-data-asset-bm.puml        (데이터 자산화 BM)
│
└── gantt/                        # 간트 차트
    ├── gantt-capstone-milestones.puml    (4~5월 마일스톤)
    └── gantt-future-roadmap.puml         (단기/중기/장기 로드맵)
```

## 보고서 매핑 (report-drafts)

각 다이어그램은 [`../report-drafts/`](../report-drafts/) 의 `{TODO: ...}` placeholder 와 1:1 또는 1:N 매핑됩니다.

| 보고서 위치 | 다이어그램 |
|---|---|
| 1.1 프로젝트 개요 (통합 인프라) | `full_infrastructure.png` |
| 1.2 페르소나 시각화 | (TODO: 별도 작성 권장) |
| 2.1 목표 트리 | `mindmaps/mindmap-goals.puml` |
| 2.1 마일스톤 타임라인 | `gantt/gantt-capstone-milestones.puml` |
| 2.2.1 9 도메인 의존 | `component_diagrams/component-domain-dependencies.puml` |
| 2.2.1 활동 다이어그램 5종 | `activity_diagrams/activity-0[1-5]-*.puml` |
| 2.2.2 시스템 유스케이스 | `usecase_diagrams/usecase-mefit-platform.puml` |
| 2.2.2 시퀀스 (회원가입/인증) | `sequence_diagrams/sequence-auth-signup.puml` |
| 2.2.2 시퀀스 (채용공고 수집) | `sequence_diagrams/sequence-jobposting-scraping.puml` |
| 2.2.2 시퀀스 (티켓 라이프사이클) | `sequence_diagrams/sequence-tickets-lifecycle.puml` |
| 2.2.2 시퀀스 (면접 질문 생성) | `sequence_diagrams/sequence-interview-question-generation.puml` |
| 2.2.4 통합 인프라 | `full_infrastructure.png` |
| 2.2.4 AWS 영상 파이프라인 | `aws_infrastructure.png` + `component_diagrams/component-aws-event-pipeline.puml` |
| 2.2.4 k3s 클러스터 | `k8s_infrastructure.png` |
| 2.2.4 클래스 다이어그램 4종 | `class_diagrams/*.puml` |
| 2.2.4 시퀀스 다이어그램 (면접 전체 흐름) | `sequence_diagrams/sequence-interview-full-flow.puml` |
| 2.2.4 시퀀스 다이어그램 (이력서 분석) | `sequence_diagrams/sequence-resume-analysis.puml` |
| 2.2.4 시퀀스 다이어그램 (분석 리포트 파이프라인) | `sequence_diagrams/sequence-report-generation.puml` |
| 2.2.4 실시간 알림 시퀀스 | `sequence_diagrams/sequence-realtime-notification.puml` |
| 2.2.4 상태 다이어그램 5종 | `activity_diagrams/state-*.puml` |
| 2.2.4 면접 일시중지/재개 (orthogonal) | `activity_diagrams/state-interview-pause-resume.puml` + `state-interview-machine.md` |
| 2.2.4 면접 리포트 UI 컴포넌트 | `component_diagrams/component-interview-report-ui.puml` |
| 2.2.4 계획 vs 최종 | `component_diagrams/component-plan-vs-final.puml` |
| 2.2.6 보안 강화 로드맵 | `component_diagrams/component-security-roadmap.puml` |
| 2.3 기대효과 5 영역 | `mindmaps/mindmap-impact.puml` |
| 2.3 데이터 자산화 BM | `mindmaps/mindmap-data-asset-bm.puml` |
| 2.3 향후 로드맵 | `gantt/gantt-future-roadmap.puml` |
| 발표 자료 핵심 기능 | `mindmaps/mindmap-key-features.puml` |

## 빠른 실행

### diagrams (Python — 인프라 토폴로지)

```bash
cd mefit-diagrams

# 현재 운영 관점 3종 생성
python3 main.py

# 미래 배치 관점 3종 생성
python3 main-future.py

# 개별 생성도 가능
python3 main.py aws
python3 main.py k8s
python3 main.py combined
```

### PlantUML (.puml — UML 다이어그램)

```bash
# Java + plantuml.jar 필요 (또는 plantuml CLI 도구)

# 단일 파일 PNG 출력
java -jar plantuml.jar class_diagrams/class-interviews.puml

# 모든 .puml 일괄 PNG 변환
find . -name "*.puml" -exec java -jar plantuml.jar {} \;

# SVG 출력 (벡터)
java -jar plantuml.jar -tsvg sequence_diagrams/*.puml

# 활동 다이어그램만 일괄 생성 (기존 스크립트)
bash activity_diagrams/generate_png.sh
```

#### macOS / Linux 설치

```bash
# macOS (Homebrew)
brew install plantuml

# 또는 Java + plantuml.jar 다운로드
# https://plantuml.com/download

# 사용 (brew 설치 시)
plantuml class_diagrams/class-interviews.puml
```

## 다이어그램 설계 원칙

- 과도한 요약을 지양하고 실제 리소스 명 / 연결을 명시
- 입력 버킷(`video-files`)과 출력 버킷 분리로 가독성 확보
- 이벤트 기반 연결(S3 이벤트, SNS 구독, SQS 매핑, polling)을 라벨로 명시
- 노드 간 겹침 완화를 위한 레이아웃 파라미터 적용
- **PlantUML 다이어그램은 `state-interview-machine.puml` 의 skinparam 스타일을 일관되게 따름**:
  - 배경 `#FEFEFE`
  - 일반 BackgroundColor `#E8F4FD` / BorderColor `#2196F3`
  - 종료 상태 `<<terminal>>` `#C8E6C9`
  - 에러 상태 `<<errstate>>` `#FFCDD2`
  - 선택 상태 `<<choice>>` `#FFF9C4`

## 의존성

- Python 3.14+
- [diagrams](https://diagrams.mingrammer.com/)
- Graphviz (`dot` 명령 필요)
- [PlantUML](https://plantuml.com/) (Java 1.8+ + `plantuml.jar` 또는 `brew install plantuml`)

`pyproject.toml`:

```toml
dependencies = [
  "diagrams>=0.23.0",
]
```

## 유지보수 가이드

다이어그램 변경 시 아래 순서로 진행하세요.

1. `infra/`, `TODO_INFRA/`, 연계 서비스 코드, [`../report-drafts/`](../report-drafts/) 에서 실제 연결 구조 / 변경 내용 확인
2. 적절한 디렉토리의 `.puml` 또는 `main.py` / `main-future.py` 수정
3. 이미지 재생성 후 라벨 / 겹침 / 연결 방향 점검
4. 변경된 `.puml` (또는 `.py`) + `.png` 를 함께 커밋

## 참고

- 보고서 초안: [`../report-drafts/`](../report-drafts/)
- 발표 자료: [`../presentation-docs/`](../presentation-docs/)
- 멘토링 원문: [`../면담 내용.md`](../면담%20내용.md)
- `TODO.md`: 다이어그램 개선 요구 및 작업 메모 (커밋 대상 제외 권장)
