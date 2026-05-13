# face-analyzer Lambda 배포 가이드

> **선행**: analysis-video의 Phase 2 (IAM, SNS, SQS) + Phase 3 (Layer A: mefit-video-common)
> **모든 AWS 리소스 생성은 AWS Console에서 수행한다.**

---

## 1. Lambda Layer 빌드 (로컬 스크립트)

```bash
cd face_analysis
rm -f dist/*.zip
bash scripts/build_layer.sh
```

- mediapipe에서 Face Landmarker에 불필요한 모듈을 자동 삭제하여 250MB 제한을 준수
- 출력: `dist/mefit-face-analysis-layer.zip`
- 빌드 로그에 "Stripped: X MB -> Y MB" 형태로 절감량 표시

---

## 2. S3에 Layer zip 업로드

**경로**: AWS Console → S3 → `pj-kmucd1-04-mefit-video-files` 버킷

1. `_layers/` 폴더로 이동 (없으면 "폴더 만들기"로 생성)
2. "업로드" 클릭 → `face_analysis/dist/mefit-face-analysis-layer.zip` 선택 → 업로드

업로드 후 S3 URI 확인: `s3://pj-kmucd1-04-mefit-video-files/_layers/mefit-face-analysis-layer.zip`

---

## 3. Lambda Layer 생성 (콘솔)

**경로**: Lambda → 왼쪽 메뉴 **계층** → **계층 생성**

| 항목 | 값 |
|------|-----|
| 이름 | `pj-kmucd1-04-mefit-face-analysis` |
| 업로드 방식 | **Amazon S3에서 업로드** |
| S3 링크 URL | `s3://pj-kmucd1-04-mefit-video-files/_layers/mefit-face-analysis-layer.zip` |
| 호환 런타임 | **Python 3.12** |
| 호환 아키텍처 | **x86_64** |

"생성" 클릭.

---

## 4. Lambda 함수 생성 (콘솔) 여기서부터 진행 5/6

**경로**: Lambda → **함수 생성** → **새로 작성**

| 항목 | 값 |
|------|-----|
| 함수명 | `pj-kmucd1-04-mefit-face-analyzer` |
| 런타임 | **Python 3.12** |
| 아키텍처 | **x86_64** |
| 실행 역할 | **기존 역할 사용** → `LabRole` |
| 메모리 | **1024 MB** |
| 타임아웃 | **5분** |
| 임시 스토리지 | **512 MB** |

> 함수가 이미 존재하면 이 단계는 건너뛰세요.

---

## 5. Layer 연결

**경로**: Lambda → `pj-kmucd1-04-mefit-face-analyzer` → **코드** 탭 하단 → **계층** → **편집**

1. 기존에 연결된 불필요한 Layer(face-analysis-core, face-analysis-cv)가 있으면 X로 제거
2. "계층 추가" → 사용자 지정 계층 → 아래 2개를 추가:

| 연결할 Layer | 비고 |
|---|---|
| `pj-kmucd1-04-mefit-video-common` | analysis-video에서 이미 생성됨 |
| `pj-kmucd1-04-mefit-face-analysis` | 위 3단계에서 생성 |

3. "저장" 클릭

> 런타임 호환성 경고가 뜨면 "ARN 지정"으로 전환하여 해당 Layer의 ARN을 직접 입력하세요. 실행에는 문제 없습니다.

---

## 6. 환경변수 설정 (face_analyzer)

**경로**: Lambda → `pj-kmucd1-04-mefit-face-analyzer` → **구성** → **환경 변수** → **편집**

| 키 | 값 |
|-----|-----|
| `FRAME_BUCKET` | `pj-kmucd1-04-mefit-video-frame-files` |
| `STEP_COMPLETE_SQS_URL` | `https://sqs.us-east-1.amazonaws.com/<account-id>/pj-kmucd1-04-mefit-video-step-complete` |
| `REGION` | `us-east-1` |

> `<account-id>`는 AWS 계정 ID로 교체하세요. 콘솔 우측 상단에서 확인 가능합니다.

---

## 7. Face_Trigger_SQS 큐 생성

**경로**: AWS Console → SQS → **대기열 생성**

| 항목 | 값 |
|------|-----|
| 유형 | **표준** |
| 이름 | `pj-kmucd1-04-mefit-face-trigger` |
| 표시 제한 시간 | **300초** (5분, face_analyzer 타임아웃과 동일) |
| 메시지 보존 기간 | **4일** (기본값) |

---

## 8. Face_Analyzer에 SQS 트리거 연결

**경로**: Lambda → `pj-kmucd1-04-mefit-face-analyzer` → **구성** → **트리거** → **트리거 추가**

| 항목 | 값 |
|------|-----|
| 소스 | **SQS** |
| SQS 대기열 | `pj-kmucd1-04-mefit-face-trigger` |
| 배치 크기 | **1** |

---

## 9. Frame_Extractor 환경변수 추가

**경로**: Lambda → `pj-kmucd1-04-mefit-frame-extractor` → **구성** → **환경 변수** → **편집**

| 키 | 값 |
|-----|-----|
| `FACE_TRIGGER_SQS_URL` | (7단계에서 생성한 SQS 큐의 URL) |

> SQS 큐 URL 확인: SQS → `pj-kmucd1-04-mefit-face-trigger` → 세부 정보에서 "URL" 복사

---

## 10. 코드 배포

### 10-1. 로컬에서 zip 생성

```bash
bash scripts/package_code.sh
```

출력: `dist/face_analyzer.zip`

### 10-2. 콘솔에서 업로드

**경로**: Lambda → `pj-kmucd1-04-mefit-face-analyzer` → **코드** 탭 → **에서 업로드** → **.zip 파일**

`dist/face_analyzer.zip` 선택 → 업로드

업로드 후 **런타임 설정** 확인 → 핸들러가 `handler.handler`인지 확인.

---

## 11. 테스트

**경로**: Lambda → `pj-kmucd1-04-mefit-face-analyzer` → **테스트** 탭

테스트 이벤트:
```json
{
  "frameBucket": "pj-kmucd1-04-mefit-video-frame-files",
  "framePrefix": "test-session/test-turn/frames/",
  "sessionUuid": "test-session",
  "turnId": "test-turn"
}
```

---

## 체크리스트

- [ ] `bash scripts/build_layer.sh`로 Layer zip 빌드
- [ ] S3 `_layers/` 폴더에 `mefit-face-analysis-layer.zip` 업로드
- [ ] Lambda Layer `pj-kmucd1-04-mefit-face-analysis` 생성 (S3 URL 지정)
- [ ] Lambda 함수 `pj-kmucd1-04-mefit-face-analyzer` 생성 (이미 있으면 skip)
- [ ] Layer 연결: `video-common` + `face-analysis`
- [ ] face_analyzer 환경변수 설정 (FRAME_BUCKET, STEP_COMPLETE_SQS_URL, REGION)
- [ ] SQS 큐 `pj-kmucd1-04-mefit-face-trigger` 생성
- [ ] face_analyzer에 SQS 트리거 연결 (배치 크기 1)
- [ ] frame_extractor에 `FACE_TRIGGER_SQS_URL` 환경변수 추가
- [ ] `bash scripts/package_code.sh`로 코드 zip 생성
- [ ] 코드 zip 업로드 + 핸들러 `handler.handler` 확인
- [ ] 테스트 이벤트로 실행 확인
