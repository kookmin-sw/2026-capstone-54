# mefit-diagrams

MeFit 인프라 구조를 코드 기반으로 재생성 가능한 다이어그램으로 관리합니다.

이 디렉토리는 두 가지 관점을 제공합니다.

- `main.py`: 현재 운영 관점(실제 구성 반영)
- `main-future.py`: 노드 역할 분담(control-plane / worker)을 강조한 미래 배치 관점

## 생성되는 다이어그램

### Current (`main.py`)

- `aws_infrastructure.png`
  - S3 input 분리, SNS→SQS fan-out, Lambda 처리, step-complete 소비 흐름
- `k8s_infrastructure.png`
  - k3s on EC2(복수 노드) + namespace 내 서비스/워커/스토리지 연결
- `full_infrastructure.png`
  - 프론트엔드, k3s 워크로드, AWS 이벤트 파이프라인 통합 뷰

### Future (`main-future.py`)

- `aws_infrastructure_future.png`
- `k8s_infrastructure_future.png`
- `full_infrastructure_future.png`

Future 버전은 control-plane/worker 분담을 더 직접적으로 표현합니다.

## 빠른 실행

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

python3 main-future.py aws
python3 main-future.py k8s
python3 main-future.py combined
```

## 다이어그램 설계 원칙

- 과도한 요약을 지양하고 실제 리소스 명/연결을 명시
- 입력 버킷(`video-files`)과 출력 버킷 분리로 가독성 확보
- 이벤트 기반 연결(S3 이벤트, SNS 구독, SQS 매핑, polling)을 라벨로 명시
- 노드 간 겹침 완화를 위한 레이아웃 파라미터 적용

## 의존성

- Python 3.14+
- [diagrams](https://diagrams.mingrammer.com/)
- Graphviz (`dot` 명령 필요)

`pyproject.toml`:

```toml
dependencies = [
  "diagrams>=0.23.0",
]
```

## 유지보수 가이드

다이어그램 변경 시 아래 순서로 진행하세요.

1. `infra/`, `TODO_INFRA/`, 연계 서비스 코드에서 실제 연결 구조 확인
2. `main.py`(현재) 또는 `main-future.py`(미래안) 수정
3. 이미지 재생성 후 라벨/겹침/연결 방향 점검
4. 변경된 `.py` + `.png`를 함께 커밋

## 참고

- `TODO.md`: 다이어그램 개선 요구 및 작업 메모 (커밋 대상 제외 권장)
