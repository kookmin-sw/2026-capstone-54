# face-analyzer — 면접 서비스용 얼굴 표정 분석 Lambda

## 개요

면접 영상에서 1FPS로 추출된 프레임 이미지들을 분석하여 면접자의 표정 상태를 분류하고 통계를 생성합니다.

## 아키텍처

```
Django Celery Worker (frame-extractor step-complete 수신)
    ↓ boto3.invoke (RequestResponse)
face-analyzer Lambda
    ↓ S3에서 프레임 목록 조회 (FRAME_BUCKET/prefix)
    ↓ 순차 분석 (Face Landmarker blendshapes)
    ↓ 결과 반환 + step-complete 발행
Django Celery Worker
```

## 프로젝트 구조

```
face_analysis/
├── functions/
│   └── face_analyzer/
│       └── handler.py              # Lambda 핸들러 (Django에서 invoke)
├── layers/
│   ├── face-analysis/
│   │   └── requirements.txt        # MediaPipe + OpenCV (통합 Layer)
│   ├── face-analysis-core/
│   │   └── requirements.txt        # Layer D-1: mediapipe + protobuf
│   └── face-analysis-cv/
│       └── requirements.txt        # Layer D-2: opencv + numpy + Pillow
├── analyzer/                       # 분석 로직 (코드 ZIP에 포함)
│   ├── face_detector.py            # Face Landmarker + blendshape 추출
│   ├── emotion_category.py         # 표정 판별 규칙 (임계값)
│   ├── frame_analyzer.py           # 단일 프레임 분석
│   ├── statistics.py               # 통계 생성
│   └── batch_processor.py          # 배치 처리
├── models/
│   └── face_landmarker.task        # MediaPipe 모델 (3.7MB, 코드 ZIP에 포함)
├── scripts/
│   ├── build_layer.sh              # Lambda Layer 빌드 스크립트
│   ├── package_code.sh             # Lambda 코드 패키징 스크립트
│   ├── _strip_mediapipe.py         # MediaPipe 불필요 파일 제거 (용량 최적화)
│   └── _zipdir.py                  # ZIP 생성 유틸리티
├── stubs/
│   └── matplotlib/                 # matplotlib 타입 스텁 (Lambda 환경 대응)
├── tests/
│   └── test_face_analyzer_handler.py  # handler 단위 테스트
├── local/
│   ├── poller.py                   # SQS long-polling 로컬 워커
│   └── .env.sample                 # 로컬 환경변수 템플릿
├── Dockerfile                      # 로컬 도커 워커 이미지
├── docker-compose.yml              # 로컬 도커 워커 실행 설정
├── run_local.py                    # 로컬 테스트 CLI
├── DEPLOY.md                       # Lambda 배포 가이드
└── README.md
```

## 표정 분류

| 카테고리 | 의미 |
|---------|------|
| positive | 웃는/놀라는 표정 |
| negative | 찡그린/우는 표정 |
| neutral | 무표정/차분 |
| no_face | 얼굴 미감지 |

## Lambda 배포

[DEPLOY.md](./DEPLOY.md) 참조.

### Lambda Layer 구성

Layer는 용량 최적화를 위해 분리 관리합니다.

| Layer | 내용 |
|---|---|
| `face-analysis-core` | mediapipe + protobuf (핵심 분석 엔진) |
| `face-analysis-cv` | opencv + numpy + Pillow (이미지 처리) |
| `face-analysis` | 통합 Layer (단일 배포용) |

### 빌드 & 패키징 스크립트

```bash
# Lambda Layer ZIP 생성 → dist/mefit-face-analysis-layer.zip
bash scripts/build_layer.sh

# Lambda 코드 ZIP 생성 → dist/face_analyzer.zip
bash scripts/package_code.sh
```

> `build_layer.sh`는 `stubs/matplotlib`를 Layer에 포함시켜 Lambda 환경에서
> matplotlib 없이도 mediapipe가 정상 import되도록 처리합니다.

---

## 로컬 개발 환경

### 방법 1 — run_local.py (단순 CLI 테스트)

```bash
uv run python run_local.py ./sample_images -o result.json -v
```

### 방법 2 — Docker 로컬 워커 (운영과 동일한 코드 경로 검증)

운영 환경에서는 SQS event source mapping으로 Lambda가 호출되지만,
로컬에서는 LocalStack Community 제약으로 Lambda Layer + MediaPipe 동작이 어렵습니다.
`local/poller.py`가 SQS long-polling으로 메시지를 수신하여 `handler(event, context)`를
Lambda와 동일한 `Records` 이벤트 형태로 호출합니다.

**최초 1회 — 공유 Docker 네트워크 생성**

```bash
docker network create mefit-local
```

**환경변수 설정**

```bash
cp local/.env.sample local/.env
# local/.env 값 채우기
```

| 변수 | 설명 |
|---|---|
| `AWS_ENDPOINT_URL` | LocalStack 엔드포인트 |
| `FACE_TRIGGER_SQS_URL` | face-trigger SQS URL |
| `FRAME_BUCKET` | 프레임 이미지 S3 버킷 |
| `STEP_COMPLETE_SQS_URL` | step-complete SQS URL |
| `S3_ENDPOINT_URL` | S3 엔드포인트 |

**워커 실행**

```bash
docker compose up --build
```

> `analysis-video/layers/common/python`이 read-only volume으로 마운트되어
> `mefit_video_common` 패키지를 공유합니다.

## 공유 의존성

- **Lambda Layer**: `pj-kmucd1-04-mefit-video-common` (analysis-video와 공유)
- **Lambda Layer**: `pj-kmucd1-04-mefit-face-analysis` (MediaPipe + OpenCV)

---

## sourceKey 전파

`frame_extractor`가 SQS 트리거 메시지에 실어 보내는 `sourceKey`(원본 `.webm`의 S3 key)를
`publish_step_complete`의 `source_key` 파라미터로 그대로 전달합니다.

이를 통해 backend가 face_analyzer 결과를 정확한 InterviewRecording 한 건에만 반영할 수 있고,
같은 turn에 ABANDONED가 공존하는 경우에도 잘못된 row가 갱신되지 않습니다.
