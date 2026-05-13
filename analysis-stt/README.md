# analysis-stt

면접 audio 의 객관적 STT 결과를 backend 로 전달하는 Celery worker. 자체 `faster-whisper` 모델 사용 (voice-api 호출 X).

## 아키텍처

```
analysis-video Lambda audio_extractor
     ↓ (publish_step_complete via SQS)
backend process_video_step_complete (step="audio_extractor")
     ↓ recording.audio_key 저장
     ↓ app.send_task("transcribe_audio") → "analysis-stt" 큐
     ↓
[analysis-stt worker (이 프로젝트)]
  - S3 audio 다운로드
  - faster-whisper transcribe
  - app.send_task("interviews.tasks.save_transcript_result_task.SaveTranscriptResultTask")
     ↓
backend SaveTranscriptResultTask
  - InterviewTurn.transcript_text + transcript_status=COMPLETED 저장
```

worker 는 backend DB 를 직접 조작하지 않는다. 결과는 모두 Celery payload 로 backend 의 callback task 에 전달된다 (analysis-resume 패턴).

## 기술 스택

- Python 3.12
- Celery 5.4+ (Redis broker)
- faster-whisper 1.2+ (small / cpu / int8 default)
- boto3 (S3 audio download)
- Docker

## 환경 변수

`.env.example` 참조. 핵심:

| 변수 | 설명 | 기본값 |
|---|---|---|
| `CELERY_BROKER_URL` | Redis broker | `redis://localhost:6379/0` |
| `STT_MODEL_SIZE` | faster-whisper 모델 (`tiny`/`small`/`medium`...) | `small` |
| `STT_DEVICE` | `cpu` 또는 `cuda` | `cpu` |
| `STT_COMPUTE_TYPE` | `int8` (CPU 권장) / `float16` (GPU) | `int8` |
| `BACKEND_CALLBACK_QUEUE` | backend 의 task 큐 (보통 `celery`) | `celery` |
| `BACKEND_CALLBACK_TASK_NAME` | backend 콜백 태스크 name | `interviews.tasks.save_transcript_result_task.SaveTranscriptResultTask` |

## 실행

### 1. 호스트 (uv run — 빠른 디버깅)

backend 의 redis 가 호스트 `6379` 로 노출되어 있으면 그대로 사용 가능.

```bash
cd analysis-stt
cp .env.example .env
uv sync
uv run celery -A app.celery_app worker -Q analysis-stt -l INFO --concurrency 1
```

### 2. Docker Compose (권장 — backend 와 동일 네트워크)

backend 의 `mefit-redis` / `mefit-s3mock` 컨테이너를 그대로 활용한다.

#### 사전 조건 (최초 1회)

```bash
# 공유 Docker 네트워크 (없으면 생성)
docker network create mefit-local

# backend 가 먼저 떠 있어야 한다 (mefit-redis, mefit-s3mock 제공)
cd ../backend && docker compose up -d
```

#### 실행

```bash
cd analysis-stt
cp .env.example .env
docker compose up --build
```

처음 실행 시 faster-whisper `small` 모델 (~244MB) 이 다운로드되어 `analysis_stt_models` 볼륨에 캐시된다. 이후 재시작 시 즉시 로드.

#### 정지 / 정리

```bash
docker compose down              # 컨테이너만 정지
docker compose down -v           # 볼륨 (모델 캐시) 까지 삭제
```

### 3. Docker (단발 실행)

```bash
docker build -t analysis-stt:dev .
docker run --rm \
  --env-file .env \
  -e CELERY_BROKER_URL=redis://mefit-redis:6379/0 \
  -e AWS_S3_ENDPOINT_URL=http://mefit-s3mock:9090 \
  -e AWS_ACCESS_KEY_ID=dummy \
  -e AWS_SECRET_ACCESS_KEY=dummy \
  --network=mefit-local \
  analysis-stt:dev
```

## Backend 와의 contract

### 수신 task: `transcribe_audio`

```python
{
  "turn_id": int,
  "audio_bucket": str,
  "audio_key": str,
  "language": str (optional, default="ko"),
  "prompt": str | None (optional)
}
```

### 송신 task (success): backend 의 `SaveTranscriptResultTask`

```python
{
  "turn_id": int,
  "transcript_text": str,
  "speech_segments": [{"start_ms": int, "end_ms": int, "text": str, "avg_logprob": float}, ...],
  "language": str,
  "duration_ms": int,
}
```

### 송신 task (failure):

```python
{
  "turn_id": int,
  "transcript_text": "",
  "speech_segments": [],
  "language": "",
  "duration_ms": 0,
  "error_code": "<exception class name>",
}
```

backend 의 `SaveTranscriptResultTask` 가 `error_code` 필드 유무로 success/failure 분기.

## 책임 분리

- 이 worker: audio S3 다운로드 + STT 추론 only
- backend `SaveTranscriptResultTask`: DB 저장 + 상태 업데이트
- voice-api: TTS only (STT 책임 없음)
- 브라우저 WebSpeech STT: 사용자 UX 보조 (실시간 자막) only — `answer` 의 source 가 아님
