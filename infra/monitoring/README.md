# Monitoring (Grafana Cloud Free + k8s-monitoring)

MeFit production k3s 클러스터의 **Pod / Node 메모리 시계열 + OOM 이벤트** 추적용 옵저버빌리티 스택. 저장/UI 는 Grafana Cloud Free tier, 클러스터에는 수집 에이전트 (Alloy) + 보조 서비스만 배치.

> **방식**: `grafana/k8s-monitoring` helm chart 직접 운영 (GitOps, t3.small 보호 정책 적용).
> Grafana Cloud UI 의 wizard 는 **백엔드 alert/recording rules 설치 1 회만** 사용 (helm chart 에선 안 깔리는 부분).

## 구성 파일

```
infra/monitoring/
├── namespace.yml            # mefit-monitoring 네임스페이스
├── values.yaml              # k8s-monitoring helm values (커밋, 시크릿 없음)
├── secret-template.yml      # grafana-cloud-credentials 템플릿
└── README.md                # 이 파일

infra/scripts/
└── deploy-monitoring.sh     # helm upgrade --install / rollback / status / history / uninstall
```

## 토폴로지

| 컴포넌트 | 종류 | 배치 노드 | 메모리 (req/limit) | 역할 |
|---|---|---|---|---|
| `alloy-metrics` | StatefulSet (replicas=1) | m5.large | 128Mi / 256Mi | 모든 메트릭 스크랩 → Grafana Cloud Prometheus |
| `alloy-singleton` | Deployment (replicas=1) | m5.large | 64Mi / 128Mi | 클러스터 이벤트 → Grafana Cloud Loki |
| `kube-state-metrics` | Deployment | m5.large | 50Mi / 100Mi | K8s 객체 상태 (OOMKilled reason 등) |
| `node-exporter` | DaemonSet | **모든 노드** | 30Mi / 50Mi | 호스트 메모리/CPU/디스크 |
| `alloy-operator` | Deployment | m5.large | (차트 기본값) | Alloy 라이프사이클 관리 |

**t3.small 추가 부담**: node-exporter 1 개 (~30Mi) 만. 그 외 전부 m5.large.

## Free tier 한도 검증

[2026 Grafana Cloud 한도](https://grafana.com/pricing/) vs 우리 클러스터 (m5.large + t3.small + ~15 Pod) 추정:

| 항목 | Free 한도 | 우리 추정 | 사용률 |
|---|---|---|---|
| K8s Monitoring host hours | 2,232 / 월 | 1,460 (2 host × 730h) | 65% ✅ |
| K8s Monitoring container hours | 37,944 / 월 | ~22,000 | 58% ✅ |
| Metrics active series | 10,000 | ~3,500–4,500 | 35–45% ✅ |
| Logs ingest | 50 GB / 월 | < 1 GB (events 만) | 2% ✅ |
| Stacks | 1 (자동 생성) | 1 | ✅ |

**Free tier 안전.** 단, [`values.yaml`](./values.yaml) 의 4 개 위험 feature (`annotationAutodiscovery`, `applicationObservability`, `profiling`, `podLogsViaLoki`) 를 켜면 한도를 빠르게 초과할 수 있음 → 모두 OFF 유지.

## 사전 준비

### 1) Grafana Cloud 무료 계정

1. [grafana.com/auth/sign-up](https://grafana.com/auth/sign-up/create-user) 가입 (이메일만, 카드 X)
2. **Stack 은 가입 시 자동으로 1 개 생성됨** (Free tier 1 stack 한도). "Create Stack" 버튼 없음.
3. 자동 리다이렉트되는 URL: `https://<your-stack-name>.grafana.net/`

### 2) Prometheus / Loki endpoint URL + Username 수집 (Cloud Portal)

> ⚠️ Stack Grafana 의 **Connections > Add new connection** 메뉴는 standalone Alloy on VM 용 화면이라서 URL / Username 이 한눈에 안 보입니다. **Cloud Portal 의 Stack Details 페이지**가 정답입니다 ([공식](https://grafana.com/docs/grafana-cloud/account-management/cloud-stacks/)).

1. [grafana.com/orgs](https://grafana.com/orgs) 접속 → 본인 organization 클릭
2. 본인 Stack 카드 → **"Details"** 버튼
3. **Prometheus 카드**의 "Details" → 다음 두 값 복사:

   | 항목 | 라벨 |
   |---|---|
   | Prometheus URL | "Remote Write Endpoint" 또는 "URL" |
   | Prometheus username | "Username" 또는 "Instance ID" (숫자) |

4. **Loki 카드**의 "Details" → 같은 방식으로 두 값 복사:

   | 항목 | 라벨 |
   |---|---|
   | Loki URL | "URL" |
   | Loki username | "Username" 또는 "Instance ID" (숫자) |

URL 형태 예시:
- Prometheus: `https://prometheus-prod-13-prod-us-east-0.grafana.net/api/prom/push`
- Loki: `https://logs-prod-006.grafana.net/loki/api/v1/push`

### 3) Access Policy Token 발급

> ⚠️ 구 "API Keys" 는 deprecated. **Access Policy Token** 사용 ([공식 안내](https://grafana.com/blog/2022/11/22/grafana-cloud-access-policies-say-hi-to-the-new-cloud-api-keys/)). 단일 토큰으로 prometheus + loki 양쪽 인증 처리.

#### 방법 A: Connections 메뉴에서 발급 (빠름) ⭐

Stack Grafana → 좌측 햄버거 메뉴 → **Connections → Add new connection** → "Hosted Prometheus metrics" 검색 → 클릭 → **Configuration details** 탭 → **§3 Set the configuration** 섹션:

1. **"Create a new token"** 탭 (기본 선택됨)
2. **Token name**: `mefit-k8s-monitoring`
3. **Expiration date**: `No expiry`
4. **Scopes**: `set:alloy-data-write` (자동 설정 — metrics + logs + traces 모두 포함)
5. **Create token** 클릭
6. **표시된 토큰 (`glc_...` 형태) 을 즉시 복사** (다시 안 보임)

> 같은 화면의 §2 ("Install Grafana Alloy"), §4 ("systemctl restart alloy.service") 단계는 **무시**. 우리는 helm chart 가 Alloy 를 자동 배포하므로 standalone Alloy 설치 과정이 불필요합니다.

#### 방법 B: Cloud Portal 에서 직접 발급

[grafana.com/orgs](https://grafana.com/orgs) → organization → 좌측 메뉴 **Security → Access Policies** → **Create access policy**:

- Display name: `mefit-k8s-monitoring`
- Realm: `Stack` → 본인 stack 선택
- Scopes: ✅ `metrics:write` ✅ `logs:write` (방법 A 의 `set:alloy-data-write` 와 동등)

Save → 정책 클릭 → **Add token** → Token name + Expiration 입력 → 토큰 복사.

prometheus / loki **양쪽 password 로 같은 토큰** 사용.

### 4) helm 설치 확인 (EC2 m5.large)

```bash
helm version || curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

### 5) values.yaml 의 endpoint URL 채우기

[`infra/monitoring/values.yaml`](./values.yaml) 의 두 `url:` 값을 §2 에서 복사한 endpoint 로 수정 후 커밋:

```yaml
destinations:
  grafana-cloud-metrics:
    url: "https://prometheus-prod-13-prod-us-east-0.grafana.net/api/prom/push"  # ← §2
    ...
  grafana-cloud-events:
    url: "https://logs-prod-006.grafana.net/loki/api/v1/push"  # ← §2
    ...
```

> URL 자체는 secret 아님 (계정 식별자만). git 커밋 안전.

### 6) Grafana Cloud 자격증명 secret 주입

EC2 m5.large SSH 후:

```bash
kubectl apply -f ~/infra/monitoring/namespace.yml

kubectl create secret generic grafana-cloud-credentials \
  --from-literal=prometheus-username='xxx' \
  --from-literal=prometheus-password='xxx' \
  --from-literal=loki-username='xxx' \
  --from-literal=loki-password='xxx' \
  -n mefit-monitoring
```

`<ACCESS_POLICY_TOKEN>` 은 §3 의 토큰. prometheus / loki 양쪽 같은 값.

## 배포

### 1) Helm chart 배포

EC2 m5.large 에서:

```bash
git -C ~/infra pull
chmod +x ~/infra/scripts/deploy-monitoring.sh
~/infra/scripts/deploy-monitoring.sh production
```

스크립트 동작:
1. helm 존재 검증
2. `grafana` helm repo 추가/업데이트
3. `mefit-monitoring` namespace 생성
4. `values.yaml` 의 빈 URL 검증 (비어있으면 abort)
5. `grafana-cloud-credentials` secret 검증 (없으면 abort)
6. `helm upgrade --install --atomic --wait` (실패 시 자동 롤백)
7. Pod 분포 표시

배포 완료까지 ~3-5 분.

### 2) Backend alert / recording rules 설치 (UI 1 회)

helm chart 만 깔면 Grafana Cloud 백엔드의 사전 구성 alert / recording rules 가 누락됩니다 (Workload 대시보드 데이터 일부 빔). UI 에서 1 회 설치:

1. Stack Grafana → 좌측 메뉴 → **Observability → Kubernetes → Configuration**
2. 상단 노란 경고 띠의 **"Install now"** 버튼 클릭
3. 끝 (5–10 분 후 데이터 채워짐)

설치 확인: Stack Grafana → **Alerting → Alert rules** 에 `KubePodCrashLooping`, `KubePodNotReady`, `CPUThrottlingHigh` 등 표시되면 성공.

> **wizard 진행은 불필요.** 우리는 helm 으로 이미 배포 완료. wizard 의 Cluster name / Namespace 입력 화면을 끝까지 따라가지 마세요 — 다른 리소스를 생성하려고 시도해서 충돌할 수 있습니다.

### 업그레이드 (values.yaml 수정 후)

```bash
~/infra/scripts/deploy-monitoring.sh production
```

helm 이 변경된 부분만 reconcile.

### 롤백

```bash
~/infra/scripts/deploy-monitoring.sh history          # 리비전 확인
~/infra/scripts/deploy-monitoring.sh rollback         # 직전 리비전으로
~/infra/scripts/deploy-monitoring.sh rollback 3       # 특정 리비전으로
```

### 제거

```bash
~/infra/scripts/deploy-monitoring.sh uninstall

# namespace 까지 완전 제거 (선택)
kubectl delete namespace mefit-monitoring
```

Grafana Cloud 측 backend rules 도 제거하려면: Stack Grafana → **Observability → Kubernetes → Configuration → Manage app → Uninstall**.

## 동작 검증

### 1) Pod 상태

```bash
kubectl get pods -n mefit-monitoring -o wide
```

기대 결과 (전부 Running):

```
NAME                                    READY  NODE
alloy-operator-xxx                      1/1    <m5.large>
k8s-monitoring-alloy-metrics-0          2/2    <m5.large>
k8s-monitoring-alloy-singleton-xxx      2/2    <m5.large>
k8s-monitoring-kube-state-metrics-xxx   1/1    <m5.large>
k8s-monitoring-node-exporter-xxx        1/1    <m5.large>
k8s-monitoring-node-exporter-yyy        1/1    <t3.small>
```

### 2) Grafana Cloud 메트릭 도착 확인

Stack Grafana → **Explore** → 데이터소스: 본인의 Prometheus → 쿼리:

```promql
up{cluster="mefit-prod-k3s"}
```

각 컴포넌트별로 `1` 시계열 표시되면 정상.

### 3) Pod 메모리 데이터

```promql
container_memory_working_set_bytes{cluster="mefit-prod-k3s", namespace="mefit-backend-production", container!="", container!="POD"}
```

### 4) OOM 이벤트

Loki 데이터소스:
```logql
{cluster="mefit-prod-k3s"} |= "OOMKilling"
```

Prometheus 데이터소스:
```promql
sum by (pod, namespace) (
  kube_pod_container_status_last_terminated_reason{reason="OOMKilled", cluster="mefit-prod-k3s"}
)
```

### 5) Free tier 사용량 확인

Stack Grafana → **Administration → Cost management → Usage** — Metrics / Logs / K8s host hours 가 모두 한도 안인지.

## 주요 대시보드

§배포 §2 (backend rules 설치) 후 노출됨.

Stack Grafana → **Observability → Kubernetes**:

| 메뉴 | 용도 |
|---|---|
| Cluster overview | 전체 노드 / Pod 요약 |
| Nodes | t3.small / m5.large 별 사용량 |
| Workloads | Deployment / StatefulSet / DaemonSet 별 |
| Pods | 특정 Pod 메모리 시계열 + limit 대비 |
| Alerts | 등록된 alert 룰 + 발생 이력 |

또는 Stack Grafana → **Dashboards** → "Kubernetes" 폴더 (Mixin 대시보드).

## 핵심 PromQL

```promql
# 1. 최근 1시간 OOM 발생 카운트
increase(kube_pod_container_status_terminated_reason{reason="OOMKilled"}[1h])

# 2. 어떤 Pod 가 OOM 자주 나는가
sum by (pod, namespace) (
  kube_pod_container_status_last_terminated_reason{reason="OOMKilled"}
)

# 3. Pod 메모리 사용량 vs limit (1.0 에 가까울수록 OOM 위험)
container_memory_working_set_bytes{container!="", container!="POD"}
  / on(pod, container, namespace) group_left
  kube_pod_container_resource_limits{resource="memory"}

# 4. 노드 가용 메모리 비율
node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes

# 5. 노드별 Pod requests 합계 / allocatable (오버커밋 정도)
sum by (node) (kube_pod_container_resource_requests{resource="memory"})
  / on(node) group_left
  kube_node_status_allocatable{resource="memory"}
```

## Alerting

### 자동 등록되는 룰 (§배포 §2 후)

`KubePodCrashLooping`, `KubePodNotReady`, `CPUThrottlingHigh`, `KubeMemoryOvercommit`, `KubeNodeNotReady`, `KubeletDown`, `KubeDeploymentReplicasMismatch` 등 ~30 개. 전체 목록은 [공식 문서](https://grafana.com/docs/grafana-cloud/monitor-infrastructure/kubernetes-monitoring/configuration/manage-configuration/#alerting-rules) 참고.

### EC2 정지 시 알람 폭탄 방지 — 운영 정책

> **배경**: AWS 비용 절감 정책상 EC2 (m5.large + t3.small) 가 비업무 시간 또는 수시로 stop/start. 이때 ~15-20개 시스템 알람이 동시에 발화 가능. 정지 시간이 일정하지 않아 mute timing (시간대 지정) 으로는 부족.
>
> **대응 = Grouping + 시스템 알람 일부 Pause** 조합.

#### A) Notification grouping (15+ 알람 → 1-2 메시지로 압축)

Stack Grafana → 좌측 메뉴 → **Alerts & IRM → Alerting → Notification configuration → Notification policies** 탭:

1. **Default policy** 의 **... → Edit** 클릭
2. 다음 값으로 설정:

   | 항목 | 값 | 효과 |
   |---|---|---|
   | Default contact point | (Slack 등록 후 §Slack 통합 참고) | 기본 알림 채널 |
   | **Group by** | `cluster`, `alertname` (둘 다 추가) | 같은 노드 / 같은 alert 종류끼리 묶임 |
   | **Group wait** | `5m` | 첫 알람 후 5분 추가 대기 — 묶을 알람 모음 |
   | **Group interval** | `30m` | 그룹 단위 재발송 30분 1회 |
   | **Repeat interval** | `4h` | 같은 그룹 재알림 4시간 후 |

3. **Save** 클릭

→ EC2 정지 1회당 Slack 메시지 ~1-2 개 수준 (개별 알람이 아닌 그룹 메시지 형태).

#### B) 정지 시 false positive 알람 5 개 Pause

EC2 정지가 진짜 장애가 아닌 의도된 운영이라 다음 5 개는 **알림 보내지 않도록 Pause**:

Stack Grafana → **Alerts & IRM → Alerting → Alert rules** → "grafana-cloud-k8s-monitoring" 또는 "kubernetes" 폴더에서 다음 룰 각각:

| Alert rule | 정지 시 동작 | Pause 권장 이유 |
|---|---|---|
| `KubeNodeNotReady` | 즉시 발화 | 정지 = 의도된 NotReady |
| `KubeNodeUnreachable` | 즉시 발화 | 동일 |
| `KubeletDown` | 즉시 발화 | 노드 자체 정지 → kubelet 도 정지 |
| `KubePodNotReady` | 즉시 발화 | 정지 노드의 모든 Pod 가 NotReady |
| `KubeDeploymentReplicasMismatch` | 즉시 발화 | replica 수 일시 mismatch (재기동 시 자동 회복) |

각 룰의 **... → Pause** 버튼으로 비활성화. 또는 **Edit → "Add labels"** 에 `pause: "true"` 추가하고 Notification policy 에서 매칭 분기로 처리.

#### C) 유지하는 알람 (실제 문제만 알림)

다음은 EC2 정지 시 발화 안 하므로 **그대로 유지**:

- **OOM 관련**: 컨테이너 단위 OOMKilled — 정지 시엔 OOM 자체가 안 일어남
- **`KubePodCrashLooping`**: 재기동 직후 일시 발화 가능하나 grouping 으로 압축됨
- **`CPUThrottlingHigh`, `KubeMemoryOvercommit`**: 정지 중엔 평가 자체가 안 됨
- **`KubeAPIErrorBudgetBurn`, certificate expiration**: 정지와 무관
- **`KubePersistentVolumeFillingUp`**: 무관

#### D) EC2 자체 lifecycle 알림 (OS 레벨)

§B 에서 `KubeNodeNotReady` 등을 Pause 했으므로 **EC2 가 언제 정지/재기동되었는지 자체**는 K8s 측 신호로 알 수 없습니다. 호스트 OS 의 systemd 훅으로 별도 추적합니다.

**원리:** systemd `oneshot` + `RemainAfterExit=yes` 유닛이
- `ExecStart` (boot 시): :green_heart: 시작 알림 1회
- `ExecStop` (shutdown 시): :zzz: 정지 알림 1회

를 `#mefit-alerts` Slack 채널 (§Slack 통합 §1 의 webhook 재사용) 로 발송. 메시지에는 instance-id / instance-type / AZ / 로컬 시각 (Asia/Seoul) 포함.

**제약사항:**

| 시나리오 | 알림 발송 여부 |
|---|---|
| 콘솔/CLI `aws ec2 stop-instances` | ✅ (graceful → systemd shutdown 진입) |
| OS 내부 `shutdown -h now`, `reboot` | ✅ |
| 비용절감 cron 의 자동 stop | ✅ |
| AWS Console `Force stop` / hibernate | ❌ |
| 커널 패닉 / 호스트 하드웨어 장애 | ❌ |

→ 강제 종료까지 추적하려면 EventBridge + Lambda 추가 권장 (별도 작업).

**설치 (각 EC2 1회씩):**

```bash
ssh ubuntu@<m5.large IP>
git -C ~/infra pull
sudo ~/infra/scripts/setup-shutdown-notify.sh '<SLACK_WEBHOOK_URL>'

ssh ubuntu@<t3.small IP>
git -C ~/infra pull
sudo ~/infra/scripts/setup-shutdown-notify.sh '<SLACK_WEBHOOK_URL>'
```

`<SLACK_WEBHOOK_URL>` 은 §Slack 통합 §1 에서 만든 webhook (예: `https://hooks.slack.com/services/T.../B.../...`).

**설치되는 파일 (root 소유):**

| 경로 | 권한 | 용도 |
|---|---|---|
| `/usr/local/bin/notify-lifecycle.sh` | 0755 | Slack 발송 스크립트 (IMDSv2 + curl) |
| `/etc/default/notify-lifecycle` | 0600 | `SLACK_WEBHOOK_URL` 환경변수 (root 만 read) |
| `/etc/systemd/system/notify-lifecycle.service` | 0644 | systemd oneshot 유닛 |

**동작 검증 (재부팅 없이):**

```bash
sudo systemctl start notify-lifecycle.service   # → :green_heart: 시작 알림 1회
sudo systemctl stop  notify-lifecycle.service   # → :zzz: 정지 알림 1회
sudo systemctl start notify-lifecycle.service   # 다시 활성화 (다음 실제 shutdown 대비)

journalctl -u notify-lifecycle.service -n 50
journalctl -t notify-lifecycle -n 50
```

**Webhook URL 변경:**

`sudo ~/infra/scripts/setup-shutdown-notify.sh '<새 URL>'` 재실행하면 `/etc/default/notify-lifecycle` 가 덮어써짐. systemd reload 도 자동.

**제거:**

```bash
sudo systemctl disable --now notify-lifecycle.service
sudo rm /etc/systemd/system/notify-lifecycle.service
sudo rm /etc/default/notify-lifecycle
sudo rm /usr/local/bin/notify-lifecycle.sh
sudo systemctl daemon-reload
```

---

### Slack 통합 — 알림 받기

#### 1) Slack 측 — Incoming Webhook 생성

> Slack API token 방식도 가능하나 (다중 채널 라우팅 시 유용), 단일 채널 알림이라면 **Webhook URL 방식이 가장 간단**합니다.

1. [api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → **From scratch**
2. App Name: `grafana-cloud-mefit-monitoring`, Workspace 선택 → **Create App**
3. 좌측 메뉴 → **Features → Incoming Webhooks** → 토글 **On**
4. 페이지 하단 → **Add New Webhook to Workspace**
5. 알림 받을 **채널 선택** (예: `#mefit-alerts`) → **Allow**
6. 생성된 **Webhook URL 복사** (형태: `https://hooks.slack.com/services/T.../B.../...`)

> Webhook URL 은 secret 입니다. git 커밋 X, Slack 외부 노출 X. 노출되면 Slack App 페이지에서 즉시 revoke.

#### 2) Grafana Cloud 측 — Contact point 등록

1. Stack Grafana → 좌측 메뉴 → **Alerts & IRM → Alerting → Notification configuration → Contact points** 탭
2. **+ Add contact point** 클릭
3. 입력:

   | 필드 | 값 |
   |---|---|
   | **Name** | `slack-mefit-alerts` |
   | **Integration** | `Slack` 선택 |
   | **Webhook URL** | §1 단계 복사한 URL |

4. 우측 상단 **Test** 클릭 → Slack 채널에 테스트 메시지 도착 확인
5. **Save contact point**

#### 3) Default policy 가 Slack 으로 보내도록 연결

§A) Notification grouping 단계와 같은 화면 (Notification policies):

1. **Default policy → ... → Edit**
2. **Default contact point** 드롭다운에서 §2 에서 만든 `slack-mefit-alerts` 선택
3. **Save**

→ 이제 모든 alert (Pause 한 5 개 제외) 가 Slack 으로 전송됨.

#### 4) 메시지 형태 확인

처음 발화 시 Slack 메시지 예시:

```
[FIRING:3] cluster=mefit-prod-k3s alertname=KubePodCrashLooping
- Pod mefit-production-celery-worker-xxx in mefit-backend-production
- ...
```

기본 템플릿이 cluster, namespace, severity, summary 등 충분히 표시. 한국어 변경이나 멘션 추가 필요하면 [공식 가이드](https://grafana.com/docs/grafana-cloud/alerting-and-irm/alerting/configure-notifications/manage-contact-points/integrations/configure-slack/#optional-settings) 참고.

---

### 추가 커스텀 알림 (선택)

다음은 자동 등록 룰에 없으므로 직접 추가하면 유용:

Stack Grafana → **Alerting → Alert rules → New alert rule**:

| 알림 | 쿼리 | 임계값 |
|---|---|---|
| Pod 메모리 90% 초과 | `(container_memory_working_set_bytes / kube_pod_container_resource_limits{resource="memory"}) > 0.90` | > 0.9 (10분 지속) |
| 노드 가용 메모리 < 10% | `node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes < 0.10` | < 10% (5분 지속) |

`for: 10m` / `5m` 으로 길게 잡는 이유: EC2 정지 시 일시적 dip 으로 발화하는 false positive 방지.

## 트러블슈팅

### Grafana Cloud 에 메트릭이 안 옴

```bash
kubectl logs -n mefit-monitoring statefulset/k8s-monitoring-alloy-metrics --tail=200
```

- `Unauthorized` / `401` → secret 의 token scope (`metrics:write` + `logs:write`) 확인
- `connection refused` / DNS 에러 → values.yaml 의 `url:` 오타 확인

### "Cluster status" 대시보드가 영원히 노란색 / 빨간색

§배포 §2 (backend rules 설치) 안 했을 가능성 큼. 다시 확인. 룰 설치 후 5–10 분 기다려야 데이터 채워짐.

### node-exporter 가 t3.small 에 안 뜸

```bash
kubectl describe node <t3.small-name> | grep -A2 Taints
```

taint 가 있으면 [`values.yaml`](./values.yaml) 의 `telemetryServices.node-exporter.tolerations` 에 추가.

### t3.small 메모리 부족으로 노드 NotReady

monitoring 풋프린트 확인:

```bash
kubectl top pods -n mefit-monitoring --sort-by=memory
```

`node-exporter` 가 limits 50Mi 안이면 monitoring 책임 아님. 다른 워크로드 limit 조정 필요.

극단적으로 t3.small 에서 node-exporter 를 빼야 한다면 [`values.yaml`](./values.yaml) 의 `telemetryServices.node-exporter` 에 nodeSelector 추가:

```yaml
telemetryServices:
  node-exporter:
    deploy: true
    nodeSelector:
      nodepool: heavy   # ← t3.small 에선 안 돔
```

(Pod 메모리는 kubelet cAdvisor 로 alloy-metrics 가 직접 수집하므로 t3.small 의 컨테이너 메모리는 그대로 보임. 호스트 레벨 swap/buffer 만 못 봄.)

### Free tier active series 한도 (10k) 가 위험

Stack Grafana → **Administration → Cost management → Usage** → Metrics 카드 확인. 8k 이상이면:

1. `clusterMetrics.metricsTuning.useDefaultAllowList: true` 추가 (핵심 메트릭만 유지):
   ```yaml
   clusterMetrics:
     enabled: true
     metricsTuning:
       useDefaultAllowList: true
   ```
2. `global.scrapeInterval` 60s → 120s (DPM 절반)
3. **Adaptive Metrics** (Free tier 포함): Stack Grafana → **Cost management → Metrics → Adaptive Metrics** → 사용 안 하는 메트릭 자동 추천 / drop

## 관련 문서

- [`../README.md`](../README.md) — 인프라 전체 개요
- [`../docs/EC2_METADATA_ACCESS.md`](../docs/EC2_METADATA_ACCESS.md) — Pod 의 IAM 접근
- [Grafana k8s-monitoring helm chart](https://github.com/grafana/k8s-monitoring-helm) — 차트 공식 문서
- [Grafana Cloud Access Policies](https://grafana.com/docs/grafana-cloud/account-management/authentication-and-permissions/access-policies/) — token scope
- [Grafana Cloud Free tier 한도](https://grafana.com/pricing/) — 정기 확인
