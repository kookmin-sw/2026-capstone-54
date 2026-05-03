# Face Analysis — 면접 서비스용 얼굴 표정 분석 모듈

## 개요

1FPS로 추출된 프레임 이미지들을 분석하여 면접자의 표정 상태를 분류하고 통계를 생성합니다.

## 감정 대분류 카테고리

| 카테고리 | 설명 | 매핑되는 감정 |
|---------|------|-------------|
| `no_face` | 얼굴 미감지 또는 화면에 완전히 들어오지 않음 | - |
| `positive` | 면접에 긍정적으로 임하는 표정 | happy, neutral, sad, surprised |
| `negative` | 면접에 부정적인 표정 | angry, disgust, fearful |

## 아키텍처

```
이미지 입력
    │
    ▼
MediaPipe Face Mesh (1차 필터)
    ├─ 얼굴 미감지 → no_face
    ├─ 얼굴 일부만 보임 → no_face
    └─ 얼굴 완전 감지 → crop ─┐
                              ▼
                Progressive Teacher (ONNX)
                MobileFaceNet 7클래스, RAF-DB 88.27%
                              │
                              ▼
                대분류 카테고리 매핑
                (positive / negative / no_face)
```

## 사용 모델

- **MediaPipe Face Mesh**: 얼굴 감지 + 468개 랜드마크 + 고개 방향 추정
- **Progressive Teacher (MobileFaceNet ONNX)**: 표정 분석 7클래스 (~5MB, ~10-20ms/장)

## 로컬 실행

```bash
uv run python run_local.py ./sample_images --output result.json --workers 4
```

## Lambda 배포 (Container Image)

```bash
docker build -t mefit-face-analysis .
docker tag mefit-face-analysis:latest <account>.dkr.ecr.<region>.amazonaws.com/mefit-face-analysis:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/mefit-face-analysis:latest
```

## 환경 변수

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `ANALYSIS_MAX_WORKERS` | 병렬 분석 워커 수 | `2` |
| `RESULT_BUCKET` | 결과 JSON 저장 S3 버킷 | (미설정 시 저장 안 함) |
| `LOG_LEVEL` | 로그 레벨 | `INFO` |

## Lambda 권장 설정

- **메모리**: 1024MB 이상
- **타임아웃**: 300초
