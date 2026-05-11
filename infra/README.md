# MeFit Infra

[kmu-aws-capstone-team-4/infra](https://github.com/kmu-aws-capstone-team-4/infra)

EC2 위 k3s 클러스터에서 mefit 백엔드를 운영하기 위한 Kubernetes 매니페스트 및 배포 스크립트입니다.

## 구조

```
infra/
├── namespace.yml
├── configmap.yml
├── api-deployment.yml
├── api-service.yml
├── celery-worker-deployment.yml
├── celery-beat-deployment.yml
├── redis-deployment.yml
├── redis-service.yml
├── ingress.yml
├── jobs/
│   ├── migrate-job.yml
│   └── collectstatic-job.yml
├── scripts/
│   └── deploy.sh
├── S3_SETUP.md
└── DOMAIN_HTTPS_SETUP.md
```

## 인프라 구성

| 구성 요소 | 기술 |
|----------|------|
| 컨테이너 오케스트레이션 | k3s (EC2 m5.large server + t3.small agent, 2-node cluster) |
| Ingress Controller | Traefik (k3s 기본) |
| 이미지 레지스트리 | Docker Hub (`teammefit/mefit-backend`) |
| DB | AWS RDS PostgreSQL |
| 파일 스토리지 | AWS S3 (`pj-kmucd1-04-mefit-be-files`, us-east-1) |
| 외부 접근 | AWS API Gateway → EC2:80 |

## 사전 준비

### EC2에 k3s 설치

server 노드 (m5.large) — kubelet eviction threshold 권장 옵션 포함:

```bash
curl -sfL https://get.k3s.io | sh -s - server \
  --kubelet-arg=eviction-hard=memory.available<200Mi,nodefs.available<10% \
  --kubelet-arg=eviction-soft=memory.available<300Mi \
  --kubelet-arg=eviction-soft-grace-period=memory.available=30s
```

agent 노드 (t3.small) — 메모리가 작으므로 더 보수적인 임계값:

```bash
curl -sfL https://get.k3s.io | K3S_URL=https://<SERVER_IP>:6443 K3S_TOKEN=<TOKEN> sh -s - agent \
  --kubelet-arg=eviction-hard=memory.available<150Mi,nodefs.available<10% \
  --kubelet-arg=eviction-soft=memory.available<250Mi \
  --kubelet-arg=eviction-soft-grace-period=memory.available=30s
```

eviction 임계값을 두면 OOMKill 이전에 kubelet 이 priority 가 낮은 파드를 사전에 evict 하여 핵심 파드(api/redis) 보호 여력이 커집니다.

### 노드 라벨링 (필수)

`api`, `redis`, `scraper`, `analysis-stt`, `llm-gateway` 등 무거운 워크로드는 `nodeSelector: nodepool=heavy` 로 m5.large 에 핀됩니다. server 노드에 라벨을 부여해야 정상 스케줄됩니다.

```bash
./scripts/setup-node-labels.sh           # dry-run (적용할 명령 출력)
./scripts/setup-node-labels.sh --apply   # 실제 적용
```

스크립트는 allocatable memory > 4Gi 인 노드를 자동으로 `nodepool=heavy` 라벨링합니다.

### infra 레포 클론

```bash
git clone https://github.com/kmu-aws-capstone-team-4/infra.git ~/infra
```

배포 시마다 `git pull`로 자동 최신화됩니다.

## 배포

### 전체 배포

```bash
./scripts/deploy.sh production
```

내부적으로 아래 순서로 실행됩니다:

```
1. kubectl apply -f (매니페스트 적용)
2. migrate Job 실행 → 완료 대기
3. 이미지 업데이트 → rollout 대기
4. collectstatic Job 실행 → 완료 대기
```

### 특정 타겟만 배포

```bash
./scripts/deploy.sh production api
./scripts/deploy.sh production celery-worker
./scripts/deploy.sh production celery-beat
```

### Job 단독 실행

```bash
./scripts/deploy.sh migrate production
./scripts/deploy.sh collectstatic production
```

### 롤백

```bash
# 전체 직전 버전으로 롤백
./scripts/deploy.sh rollback

# 특정 타겟만 롤백
./scripts/deploy.sh rollback api

# 특정 리비전으로 롤백
./scripts/deploy.sh history api        # 리비전 번호 확인
./scripts/deploy.sh rollback api 3
```

### 상태 확인

```bash
./scripts/deploy.sh status
./scripts/deploy.sh history
```

## GitHub Actions 배포

backend 레포의 `.github/workflows/deploy-production.yml`에서 이 레포의 스크립트를 사용합니다.

**트리거:** GitHub Actions 탭 → `Deploy Production` → `Run workflow`

**필요한 GitHub Environment secrets (`production`):**

| Secret | 설명 |
|--------|------|
| `EC2_HOST` | EC2 퍼블릭 IP |
| `EC2_USER` | SSH 유저 (예: `ubuntu`) |
| `EC2_SSH_KEY` | SSH 개인키 |
| `DJANGO_SECRET_KEY` | Django SECRET_KEY |
| `DATABASE_URL` | RDS 접속 URL |
| `ALLOWED_HOSTS` | 허용 호스트 목록 |

## 운영

```bash
# Pod 상태
kubectl get pods -n mefit-backend-production

# 로그
kubectl logs -n mefit-backend-production deployment/mefit-production-api -f

# 스케일링
kubectl scale deployment/mefit-production-api --replicas=3 -n mefit-backend-production
```
