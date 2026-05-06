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
│   └── face-analysis/
│       └── requirements.txt        # MediaPipe + OpenCV Layer 의존성
├── analyzer/                       # 분석 로직 (코드 ZIP에 포함)
│   ├── face_detector.py            # Face Landmarker + blendshape 추출
│   ├── emotion_category.py         # 표정 판별 규칙 (임계값)
│   ├── frame_analyzer.py           # 단일 프레임 분석
│   ├── statistics.py               # 통계 생성
│   └── batch_processor.py          # 배치 처리
├── models/
│   └── face_landmarker.task        # MediaPipe 모델 (3.7MB, 코드 ZIP에 포함)
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

## 로컬 테스트

```bash
uv run python run_local.py ./sample_images -o result.json -v
```

## 공유 의존성

- **Lambda Layer**: `pj-kmucd1-04-mefit-video-common` (analysis-video와 공유)
- **Lambda Layer**: `pj-kmucd1-04-mefit-face-analysis` (MediaPipe + OpenCV)
