# LLM Gateway (LiteLLM Proxy)

각 Pod 가 OpenAI / Bedrock / Gemini 를 단일 OpenAI-호환 엔드포인트로 호출하기 위한 K3s 게이트웨이.

설계 배경 / 비교 / 마이그레이션 계획 → [`../docs/LLM_GATEWAY_RESEARCH.md`](../docs/LLM_GATEWAY_RESEARCH.md)

## 구조

```
llm-gateway/
├── configmap.yml          # 환경변수 + LiteLLM config.yaml (model_list / fallbacks)
├── deployment.yml         # LiteLLM Pod (replicas=1, num_workers=1)
├── service.yml            # ClusterIP 4000
├── ingress.yml            # llm.mefit.kr 외부 노출 (Traefik + Let's Encrypt)
├── jobs/
│   └── prisma-push-job.yml  # Prisma schema 마이그레이션 (1회성)
└── README.md              # 이 파일
```

> **로컬 개발 환경**: K8s / 로컬 게이트웨이를 별도로 띄우지 않는다.
> 각 서비스 코드는 `OPENAI_BASE_URL` 이 비어 있으면 OpenAI 직통으로 동작하도록 설계되어
> ([§Graceful fallback](../docs/LLM_GATEWAY_RESEARCH.md#44-로컬-개발-환경-지원)),
> 로컬 개발자는 추가 설정 없이 평소처럼 작업한다.

## 엔드포인트

| 경로 | 용도 |
|------|------|
| `http://mefit-llm-gateway:4000/v1` | **클러스터 내부** — 각 서비스 ConfigMap 의 `OPENAI_BASE_URL` 로 사용 |
| `https://llm.mefit.kr/ui` | **외부 어드민 UI** (별도 subdomain, Ingress 직접 노출) |
| `https://llm.mefit.kr/v1` | 외부 API (가상키 인증 필요, 클러스터 외부에서 호출 시) |

## 사전 준비

### 1) GitHub Repository Secret 등록 (production environment)

저장소 (`kmu-aws-capstone-team-4/infra`) → Settings → Environments → `production` → Environment secrets 에 다음을 등록한다.

| Secret 이름 | 설명 |
|-------------|------|
| `EC2_HOST` | 배포 대상 EC2 호스트 (다른 서비스 워크플로우와 공유) |
| `EC2_USER` | SSH 사용자 (다른 서비스와 공유) |
| `EC2_SSH_KEY` | SSH 개인키 (다른 서비스와 공유) |
| `LITELLM_MASTER_KEY` | 어드민 마스터 키 (`sk-` prefix 필수) |
| `LITELLM_DATABASE_URL` | LiteLLM Postgres URL (예: `postgresql://litellm:PW@HOST:5432/litellm`) |
| `LITELLM_OPENAI_API_KEY` | 게이트웨이가 OpenAI 호출 시 사용할 실 키 |
| `LITELLM_GEMINI_API_KEY` | Gemini API 키 (선택, Bedrock 만 폴백 시 빈 값으로 둠) |
| `LITELLM_UI_USERNAME` | 어드민 UI 로그인 ID |
| `LITELLM_UI_PASSWORD` | 어드민 UI 로그인 비밀번호 |

### 2) DNS 설정 (외부 작업)

Route 53 (또는 사용 중인 DNS 서비스) 에 `llm.mefit.kr` 레코드 추가:
- 기존 `*.mefit.kr` wildcard 가 EC2 ELB/IP 로 향해 있다면 자동 적용
- 없다면 `api.mefit.kr` 와 동일한 target 으로 A record 또는 CNAME 추가

DNS 전파 후 cert-manager 가 자동으로 Let's Encrypt 인증서 발급 (수분 소요).

> 각 서비스 Pod 의 `OPENAI_API_KEY` 는 게이트웨이 어드민 UI 에서 발급한 **가상키** 로 별도 주입.
> 본 워크플로우는 게이트웨이 자체 Secret 만 관리하며, 서비스별 Secret 은 각 서비스 워크플로우 책임.

### 3) RDS 에 `litellm` DB 생성

기존 RDS 에 다음 SQL 실행 (한 번):

```sql
CREATE DATABASE litellm;
CREATE USER litellm WITH ENCRYPTED PASSWORD '<강력한 비밀번호>';
GRANT ALL PRIVILEGES ON DATABASE litellm TO litellm;
```

### 4) AWS Bedrock 모델 활성화

AWS Console → Bedrock → "Model access" 에서 사용할 모델 활성화 (계정 단위 1회).

기본 사용 모델:
- `anthropic.claude-haiku-4-5-20251001-v1:0` (chat 폴백)
- `anthropic.claude-sonnet-4-5-20251001-v1:0` (vision 폴백)
- `amazon.titan-embed-text-v2:0` (embedding 폴백)

> EC2 IAM Role (`mefit-ec2-role`) 의 Bedrock 권한은 이미 부여되어 있다.
> [`../docs/EC2_METADATA_ACCESS.md`](../docs/EC2_METADATA_ACCESS.md) 의 iptables NAT 덕분에
> Pod 가 자동으로 IAM Role 자격증명을 사용한다.

## 배포 — GitHub Actions (권장)

저장소 (`kmu-aws-capstone-team-4/infra`) → Actions → "Deploy LLM Gateway Production" → **Run workflow**

입력 파라미터:

| 입력 | 설명 |
|------|------|
| `action` | `deploy` (배포) / `rollback` (롤백) / `status` (상태 확인) |

워크플로우 동작 (`deploy` 선택 시):

1. EC2 에 SSH 접속 (`EC2_HOST` / `EC2_USER` / `EC2_SSH_KEY`)
2. `~/infra` 레포 최신화 (`git pull`)
3. namespace 생성 (없으면)
4. `mefit-production-llm-gateway-secret` 을 GitHub Secret 으로부터 주입 (idempotent — `--dry-run=client | kubectl apply -f -` 패턴)
5. `~/infra/scripts/deploy-llm-gateway.sh production` 실행 (ConfigMap/Service/Deployment apply + rollout restart + 대기)

워크플로우 파일: [`.github/workflows/deploy-llm-gateway.yml`](../.github/workflows/deploy-llm-gateway.yml)

## 배포 — 수동 SSH (긴급 시)

GitHub Actions 가 동작하지 않는 상황에서만 사용. EC2 SSH 접속 후:

```bash
# Secret 직접 주입 (실 값으로 교체)
kubectl create secret generic mefit-production-llm-gateway-secret \
  --from-literal=LITELLM_MASTER_KEY="sk-..." \
  --from-literal=DATABASE_URL="postgresql://..." \
  --from-literal=OPENAI_API_KEY="sk-..." \
  --from-literal=GEMINI_API_KEY="..." \
  -n mefit-backend-production \
  --dry-run=client -o yaml | kubectl apply -f -

# 배포 실행
git -C ~/infra pull
chmod +x ~/infra/scripts/deploy-llm-gateway.sh
~/infra/scripts/deploy-llm-gateway.sh production
```

## 동작 검증

```bash
# 1) Pod 상태 확인
kubectl get pods -n mefit-backend-production -l app=mefit-production-llm-gateway

# 2) 클러스터 내부에서 health check
kubectl run curl-test -n mefit-backend-production --rm -it --image=curlimages/curl --restart=Never -- \
  curl -s http://mefit-llm-gateway:4000/health/liveliness

# 3) chat completion 호출 테스트 (master key 사용)
kubectl run curl-test -n mefit-backend-production --rm -it --image=curlimages/curl --restart=Never -- \
  curl -s -X POST http://mefit-llm-gateway:4000/v1/chat/completions \
    -H "Authorization: Bearer sk-..." \
    -H "Content-Type: application/json" \
    -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"ping"}]}'
```

## 어드민 UI 접근

별도 subdomain `llm.mefit.kr` 으로 직접 노출. Ingress (`ingress.yml`) 가 Traefik 으로
LiteLLM Pod 에 직접 forward — backend Django 를 거치지 않는다.

```
https://llm.mefit.kr/ui
```

인증 흐름:

1. 위 URL 접근
2. LiteLLM 자체 로그인 페이지 표시 (`token` 쿠키 없을 때)
3. `UI_USERNAME` / `UI_PASSWORD` (또는 master key) 입력 → 어드민 UI 진입

### 보안 모델

- **1차 인증**: LiteLLM UI 자체 인증 (`UI_USERNAME` / `UI_PASSWORD`, GitHub Secrets 로 주입)
- **TLS**: Let's Encrypt (cert-manager) 로 자동 발급/갱신
- **추가 보호 (선택)**: Traefik IP allowlist 또는 Basic Auth middleware 추가 가능. 현재는 LiteLLM 자체 인증만 운영.

> **이전 backend Django reverse proxy 패턴 폐기 이유**: Django proxy 가 LiteLLM 의
> Next.js 자산 (50+ chunks/CSS/woff2) 을 forwarding 할 때 urllib sync blocking +
> Content-Encoding 자동 처리 미지원으로 부하 발생. 별도 subdomain 직접 노출이
> Traefik 의 streaming 패스스루 + 압축 투명성을 활용해 더 효율적.

### 비상시 port-forward

Ingress / Traefik 이 다운된 상태에서 LiteLLM UI 직접 점검이 필요하면:

```bash
kubectl port-forward -n mefit-backend-production svc/mefit-llm-gateway 4000:4000
# 브라우저: http://localhost:4000/ui
```

> SERVER_ROOT_PATH 가 미설정 상태이므로 root path `/ui` 그대로 접근.

## 모델 추가/변경

`STORE_MODEL_IN_DB=True` 가 설정되어 있으므로 어드민 UI 에서 추가/수정 가능.
ConfigMap 의 `config.yaml` 은 초기 부트스트랩 용도.

## 가상키 발급 (각 서비스용)

어드민 UI → "API Keys" → "Create New Key"
- 키 이름: `mefit-{service}-virtual` (예: `mefit-backend-virtual`)
- 모델 접근: `gpt-4o-mini`, `gpt-4o`, `text-embedding-3-small`
- (선택) RPM/TPM 한도, Spend 한도

발급된 키를 각 서비스의 `OPENAI_API_KEY` Secret 에 주입.

## 트러블슈팅

### Pod 가 Bedrock 호출 시 `NoCredentialsError`

EC2 IAM Role 자격증명을 Pod 가 받지 못하는 경우. 확인:

```bash
kubectl exec -n mefit-backend-production -it <litellm-pod> -- \
  curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/
```

응답이 비어 있으면 [`../docs/EC2_METADATA_ACCESS.md`](../docs/EC2_METADATA_ACCESS.md) 의 iptables 설정 재확인.

### 가상키 호출이 401

- `Authorization: Bearer <virtual-key>` 헤더에 마스터키 prefix(`sk-`) 가 포함되어 있는지
- LiteLLM Pod 의 `LITELLM_MASTER_KEY` env 가 `sk-` 로 시작하는지
- 가상키가 어드민 UI 에서 활성 상태인지

### 폴백이 동작 안 함

- ConfigMap 의 `order` 값 확인
- `kubectl logs deployment/mefit-production-llm-gateway -n mefit-backend-production --tail=200`
- Bedrock 모델이 AWS Console 에서 활성화되어 있는지

### Pod 가 OOMKilled 로 종료됨

```bash
kubectl describe pod -n mefit-backend-production -l app=mefit-production-llm-gateway | grep -A5 "Last State"
# Reason: OOMKilled, Exit Code: 137
```

원인은 거의 항상 **multi-provider SDK 로딩 후 메모리 한도 부족**. 점검 순서:

1. **현재 사용량 확인**:
   ```bash
   kubectl top pod -n mefit-backend-production -l app=mefit-production-llm-gateway
   ```
   `MEMORY` 가 limits 의 90% 이상이면 한도 부족.

2. **limits 상향**: `deployment.yml` 의 `resources.limits.memory` 를 1536Mi → 1792Mi → 2Gi 단계적으로 증가.
   m5.large 의 잔여 헤드룸은 [설계 문서 §11.1](../docs/LLM_GATEWAY_RESEARCH.md#111-알려진-리스크) 참조.

3. **사용 안 하는 provider 제거**: `configmap.yml` 의 `model_list` 에서 미사용 provider 항목 제거 후 재배포 → 해당 SDK import 가 lazy 처리되어 메모리 절감 가능.

4. **STORE_MODEL_IN_DB 비활성화**: 어드민 UI 모델 편집 기능을 포기하면 `STORE_MODEL_IN_DB=False` 로 두고 ConfigMap 의 `model_list` 만 사용 — DB 쿼리 캐시 메모리 일부 절감.

**히스토리**: 초기 limits 512Mi 는 multi-provider SDK 로딩으로 OOMKilled 발생 → 1Gi → 1536Mi 까지 단계적 인상. sustained ~982Mi 측정 후 1280Mi 다이어트 시도 → **부팅 중 SDK 일괄 로딩 spike 가 1280Mi 한도에 부딪혀 startup 60s 안에 4000 port listen 못 함 → liveness probe kill → CrashLoopBackOff** 발생으로 1536Mi 복귀. sustained 측정값은 부팅 후 working set 이고, 부팅 peak 는 별도 측정 필요.

## 리소스 / HA 정책

m5.large (heavy nodepool) 에 단일 replica + 단일 워커로 운영.

| 항목 | 값 | 비고 |
|------|----|----|
| replicas | 1 | SPOF 허용 (자동 폴백/복구는 Pod 재시작 + readiness probe) |
| `--num_workers` | 1 | uvicorn 워커당 ~250MB 절약 |
| requests.memory | 512Mi | LiteLLM idle baseline (multi-provider SDK 로딩) |
| limits.memory | 1536Mi | 부팅 peak + sustained ~982Mi + 안전 헤드룸 |
| requests.cpu / limits.cpu | 100m / 500m | LLM API 응답 대기 중심 → CPU 부담 적음 |
| `database_connection_pool_limit` | 5 | 기본 10 → 5 (단일 워커이므로 충분) |
| startupProbe failureThreshold × periodSeconds | 30 × 10s = 5분 | 부팅 최대 허용 시간 (multi-provider SDK + DB 연결) |

**메모리 실측 (2026-05-08, sustained working set)**:

| 구성요소 | 메모리 |
|---------|-------|
| Python 인터프리터 + LiteLLM 본체 + FastAPI/uvicorn | ~150Mi |
| boto3 (Bedrock) | ~80-100Mi |
| google-generativeai (Gemini, protobuf 포함) | ~80-100Mi |
| openai SDK + httpx | ~30-40Mi |
| anthropic SDK | ~20-30Mi |
| Pydantic 스키마 + 콜백 (Prometheus) + STORE_MODEL_IN_DB 캐시 | ~50-100Mi |
| **idle baseline 합 (이론)** | **~350-450Mi** |
| 실측 sustained working set | **~982Mi** |

→ 이론 baseline 보다 sustained 가 2배 큰 이유는 `STORE_MODEL_IN_DB=True` 의 모델 캐시 + httpx connection pool 누적 + LiteLLM 콜백 큐. limits 1280Mi 는 이 sustained 값 + 30% buffer.

**HA 트레이드오프**:

- **장애 시**: Pod 가 OOM/크래시 되면 Kubernetes 가 자동 재시작하지만 그 사이 ~30s 간 5xx 발생.
   각 서비스 LangChain 코드는 `OPENAI_BASE_URL` 미설정 시 OpenAI 직통이 가능한 구조이지만,
   운영 ConfigMap 에는 게이트웨이 URL 이 명시되어 있으므로 실제 fallback 동작 안함.
   향후 critical path 에 LangChain `with_fallbacks` 추가 검토 ([설계 문서 §7.4](../docs/LLM_GATEWAY_RESEARCH.md#74-2차-안전장치-네이티브-폴백-체인)).

- **배포 시**: `RollingUpdate(maxSurge=1, maxUnavailable=0)` 으로 새 Pod Ready 후 구 Pod 종료.
   배포 1-2분 동안 메모리가 일시 2x (~2.5Gi peak) 로 spike. m5.large overcommit 상황에서는 위험할 수 있어 모니터링 강화 필요.

- **부하 한계**: 단일 워커 기준 약 50-100 RPS. 그 이상이 필요해지면 replicas 증설 (m5.large 헤드룸 확인 후).

## 의존성

- `mefit-production-redis` (캐시) — 기존 Redis 재사용
- `RDS litellm` 데이터베이스 — 가상키/Spend 저장
- EC2 IAM Role — Bedrock 호출 자격증명
