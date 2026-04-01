# Voice API - Quick Start

## 5분 안에 시작하기

### 1. 로컬 개발 환경 설정

```bash
# 프로젝트 디렉토리로 이동
cd voice-api

# 환경 변수 설정
cp .env.sample .env

# 의존성 설치 및 서버 실행
uv sync
uv run uvicorn app.main:app --reload --port 8001
```

서버가 http://localhost:8001 에서 실행됩니다.

### 2. API 테스트

```bash
# Health check
curl http://localhost:8001/health

# TTS API 테스트 (유효한 토큰 필요)
curl -X POST http://localhost:8001/api/v1/tts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello World", "language": "en"}'
```

### 3. Docker로 실행

```bash
# Docker Compose 사용
docker-compose up

# 또는 Docker 직접 사용
docker build -t voice-api .
docker run -p 8001:8001 --env-file .env voice-api
```

### 4. 프로덕션 배포

```bash
# 1. GitHub에 push (자동으로 Docker 이미지 빌드)
git push origin main

# 2. Kubernetes 배포
cd ../infra
./scripts/deploy-voice-api.sh
```

## API 엔드포인트

### POST /api/v1/tts

텍스트를 음성으로 변환합니다.

**Request:**
```json
{
  "text": "안녕하세요",
  "language": "ko"
}
```

**Response:**
```json
{
  "text": "안녕하세요",
  "audio_base64": "..."
}
```

### GET /health

서비스 상태를 확인합니다.

**Response:**
```json
{
  "status": "healthy"
}
```

## 인증

모든 API 요청은 Bearer 토큰이 필요합니다:

```bash
Authorization: Bearer <your-token>
```

토큰은 backend API (`/api/v1/users/tokens/verify/`)를 통해 검증됩니다.

## 다음 단계

- [DEPLOYMENT.md](./DEPLOYMENT.md) - 상세한 배포 가이드
- [README.md](./README.md) - 프로젝트 개요
- [../infra/docs/VOICE_API_SETUP.md](../infra/docs/VOICE_API_SETUP.md) - Kubernetes 설정
