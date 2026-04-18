# analysis-video

MeFit 면접 영상·음성 후처리 AWS Lambda 함수 모음.

인터뷰 세션 중 녹화된 영상을 변환, 분리, 추출하여 분석에 활용할 수 있는 형태로 가공한다.

## 아키텍처

```
pj-kmucd1-04-mefit-video-files (원본 .webm 업로드)
    │
    ├─ video-converter  → pj-kmucd1-04-mefit-scaled-video-files (.mp4)
    ├─ frame-extractor  → pj-kmucd1-04-mefit-video-frame-files (.jpg)
    └─ audio-extractor  → pj-kmucd1-04-mefit-audio-files (.wav)
                              │
                              └─ audio-scaler → pj-kmucd1-04-mefit-scaled-audio-files (.wav)

모든 출력 완료 시 → processing-notifier → SNS → Django backend
```

## 프로젝트 구조

```
analysis-video/
├── layers/
│   └── common/python/mefit_video_common/   # Lambda Layer (공통 패키지)
│       ├── config.py          # 환경변수 (S3 버킷명, SNS ARN 등)
│       ├── s3_client.py       # boto3 S3 헬퍼 (download/upload)
│       ├── ffmpeg_runner.py   # ffmpeg subprocess 래퍼
│       └── logger.py          # 구조화 JSON 로거
│
├── functions/                              # Lambda 핸들러
│   ├── video_converter/       # WebM → MP4 (H.264, max 720p)
│   ├── frame_extractor/       # 1FPS JPEG 프레임 추출
│   ├── audio_extractor/       # 영상 → WAV 음성 분리
│   ├── audio_scaler/          # WAV → 16kHz mono 다운샘플링
│   ├── processing_notifier/   # 파이프라인 완료 확인 → SNS 알림
│   ├── expression_analyzer/   # 표정 분석 (stub)
│   └── speech_analyzer/       # 음성 분석 (stub)
│
├── local/                                  # 로컬 개발 환경
│   ├── docker-compose.yml     # LocalStack (S3, Lambda, SNS, SQS)
│   ├── localstack_init.sh     # 버킷·토픽·큐 초기화 스크립트
│   └── invoke_local.py        # Lambda 핸들러 로컬 실행 스크립트
│
├── pyproject.toml
├── .gitignore
└── README.md
```

## Lambda 함수 명세

| 함수 | 트리거 | 입력 | 출력 | 타임아웃 | 메모리 |
|------|--------|------|------|----------|--------|
| `video-converter` | S3: video-files `.webm` | 원본 WebM | MP4 (720p H.264) | 5분 | 1024MB |
| `frame-extractor` | S3: video-files `.webm` | 원본 WebM | JPEG 프레임 (1FPS) | 3분 | 512MB |
| `audio-extractor` | S3: video-files `.webm` | 원본 WebM | WAV (44.1kHz) | 2분 | 512MB |
| `audio-scaler` | S3: audio-files `.wav` | WAV | WAV (16kHz mono) | 2분 | 512MB |
| `processing-notifier` | S3: 출력 버킷 | — | SNS 메시지 | 30초 | 256MB |
| `expression-analyzer` | S3: frame-files `.jpg` | JPEG 프레임 | SNS 분석 결과 | 5분 | 2048MB |
| `speech-analyzer` | S3: scaled-audio `.wav` | WAV (16kHz) | SNS 분석 결과 | 3분 | 1024MB |

## S3 버킷

| 버킷 | 용도 |
|------|------|
| `pj-kmucd1-04-mefit-video-files` | 원본 영상 (.webm) |
| `pj-kmucd1-04-mefit-scaled-video-files` | 다운스케일 영상 (.mp4) |
| `pj-kmucd1-04-mefit-video-frame-files` | 1FPS 프레임 이미지 (.jpg) |
| `pj-kmucd1-04-mefit-audio-files` | 분리된 음성 (.wav) |
| `pj-kmucd1-04-mefit-scaled-audio-files` | 다운스케일 음성 (.wav) |

## 로컬 개발

### 사전 요구사항

- Docker, Docker Compose
- Python 3.14+
- ffmpeg (로컬 테스트용)

### LocalStack 실행

```bash
cd local
docker compose up -d
```

5개 S3 버킷 + SNS 토픽 + SQS 큐가 자동 생성됩니다.

### Lambda 핸들러 로컬 테스트

```bash
# 공통 Layer를 PYTHONPATH에 추가하여 실행
python local/invoke_local.py video_converter pj-kmucd1-04-mefit-video-files test/sample.webm
python local/invoke_local.py frame_extractor pj-kmucd1-04-mefit-video-files test/sample.webm
python local/invoke_local.py audio_extractor pj-kmucd1-04-mefit-video-files test/sample.webm
python local/invoke_local.py audio_scaler pj-kmucd1-04-mefit-audio-files test/sample.wav
python local/invoke_local.py processing_notifier pj-kmucd1-04-mefit-scaled-video-files test/sample.mp4
```

## Lambda Layer

### mefit-video-common

공통 유틸리티 패키지. 모든 Lambda 함수에서 공유.

- `config.py` — 환경변수에서 버킷명, SNS ARN, ffmpeg 경로 로드
- `s3_client.py` — `download_to_tmp()`, `upload_from_tmp()`, `get_s3_client()`
- `ffmpeg_runner.py` — `run_ffmpeg(args, description)` — subprocess 래퍼, 타임아웃 280초
- `logger.py` — `get_logger(name)` — 구조화 JSON 로깅

### mefit-ffmpeg-binary

정적 빌드 ffmpeg 바이너리. `/opt/bin/ffmpeg` 경로로 마운트.

## 배포

AWS 콘솔 또는 EC2 CLI를 통해 배포. 상세 절차:
[`TODO_INFRA/PHASE4_LAMBDA.md`](../TODO_INFRA/PHASE4_LAMBDA.md)

## 환경 변수

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `VIDEO_BUCKET` | 원본 영상 버킷 | `pj-kmucd1-04-mefit-video-files` |
| `SCALED_VIDEO_BUCKET` | 스케일 영상 버킷 | `pj-kmucd1-04-mefit-scaled-video-files` |
| `FRAME_BUCKET` | 프레임 버킷 | `pj-kmucd1-04-mefit-video-frame-files` |
| `AUDIO_BUCKET` | 음성 버킷 | `pj-kmucd1-04-mefit-audio-files` |
| `SCALED_AUDIO_BUCKET` | 스케일 음성 버킷 | `pj-kmucd1-04-mefit-scaled-audio-files` |
| `SNS_TOPIC_ARN` | 완료 알림 SNS ARN | — |
| `REGION` | AWS 리전 | `us-east-1` |
| `FFMPEG_PATH` | ffmpeg 바이너리 경로 | `/opt/bin/ffmpeg` |

## 기술 스택

- **Runtime**: Python 3.14 (AWS Lambda)
- **영상 처리**: ffmpeg (static build, Lambda Layer)
- **스토리지**: AWS S3
- **메시징**: AWS SNS → SQS → Django backend
- **로컬 개발**: LocalStack (Docker)
