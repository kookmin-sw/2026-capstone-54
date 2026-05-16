"""main_tobe_compact.py
=======================

main_compact.py 의 **To-Be (목표) 아키텍처** 통합 버전.

As-Is(현재) 대비 핵심 개선 사항:

1. **네트워크**: 단일 EC2 public endpoint → VPC + Public/Private Subnet (Multi-AZ)
2. **컨테이너 오케스트레이션**: EC2 위 self-managed k3s → AWS **EKS** (managed control plane)
3. **로드밸런서**: Traefik Ingress on EC2 → **ALB** (AWS Load Balancer Controller) + ACM + WAF
4. **DB HA**: 단일 RDS PostgreSQL → **RDS Multi-AZ** (Primary + Standby + Read Replica)
5. **캐시 HA**: 단일 Redis Deployment(in-cluster) → **ElastiCache for Redis (Cluster Mode Enabled)**
   - 3 shards × (1 primary + 1 replica) 구성
6. **백엔드 도메인 마이크로화 가능성**: 단일 Django 모놀리식 →
   **도메인별 마이크로서비스** (auth / resume / jd / interview / ticket / profile / notification ...)
   ALB Ingress 의 path-based routing 으로 도메인 단위 분리 배포 가능 (dashed 클러스터 = 점진 분리 가능)
7. **이벤트 파이프라인 강화**: KMS 암호화 + DLQ + VPC Endpoint 사설 경로
8. **시크릿/이미지**: Secrets Manager + ESO, ECR private repo, IRSA 권한 분리
9. **자동 확장**: HPA + Karpenter
10. **관측**: CloudWatch Container Insights + Logs + X-Ray
11. **백업**: RDS 자동 스냅샷 + S3 Versioning + AWS Backup

출력 (단일 통합 다이어그램):
  - full_infrastructure_tobe_compact.png  (PPT 16:9 친화 비율)
"""

import sys
from urllib.request import urlretrieve

from diagrams import Cluster, Diagram, Edge
from diagrams.aws.compute import ECR, EKS, LambdaFunction
from diagrams.aws.database import ElasticacheForRedis, RDSPostgresqlInstance
from diagrams.aws.integration import SNS, SQS
from diagrams.aws.management import Cloudwatch
from diagrams.aws.network import (
    ALB,
    NATGateway,
    Privatelink,
    Route53,
)
from diagrams.aws.security import ACM, WAF, KMS, SecretsManager
from diagrams.aws.storage import Backup, S3
from diagrams.custom import Custom
from diagrams.k8s.compute import Deploy
from diagrams.k8s.network import Ing
from diagrams.onprem.client import Client
from diagrams.programming.framework import Nextjs
from diagrams.saas.cdn import Cloudflare


FLOWER_ICON = "flower.png"

BASE_GRAPH_ATTR = {
    "splines": "spline",
    "nodesep": "0.05",
    "ranksep": "0.40",
    "pad": "0.10",
    "margin": "0",
    "fontsize": "16",
    "overlap": "false",
    "newrank": "true",
    "concentrate": "true",
    "compound": "true",
    "ratio": "0.5625",
    "dpi": "72",
}

BASE_NODE_ATTR = {
    "fontsize": "14",
    "margin": "0.03,0.015",
    "imagescale": "true",
    "labelloc": "b",
    "height": "1.5",
}

EDGE_DEFAULT = {
    "color": "#4B5563",
    "fontsize": "10",
    "fontname": "Helvetica",
    "penwidth": "1.2",
    "arrowsize": "0.6",
    "minlen": "1",
}

CLUSTER_ATTR = {
    "margin": "4",
    "fontsize": "13",
    "labeljust": "l",
    "style": "rounded",
    "penwidth": "1.5",
    "fontname": "Helvetica-Bold",
}

VPC_CLUSTER_ATTR = {**CLUSTER_ATTR, "bgcolor": "#F0F7FF", "penwidth": "1.4"}
PUBLIC_SUBNET_ATTR = {**CLUSTER_ATTR, "bgcolor": "#FFF7E6", "style": "rounded,dashed"}
PRIVATE_APP_SUBNET_ATTR = {**CLUSTER_ATTR, "bgcolor": "#E8F5E9"}
PRIVATE_DB_SUBNET_ATTR = {**CLUSTER_ATTR, "bgcolor": "#FCE4EC"}
EKS_CLUSTER_ATTR = {**CLUSTER_ATTR, "bgcolor": "#EDE7F6", "penwidth": "1.4"}
MICROSERVICE_CLUSTER_ATTR = {
    **CLUSTER_ATTR,
    "bgcolor": "#FFF3E0",
    "style": "rounded,dashed",
    "penwidth": "1.4",
    "color": "#FB8C00",
}


def C(label, attrs=None):
    return Cluster(label, graph_attr=attrs or CLUSTER_ATTR)


def download_flower_icon():
    try:
        urlretrieve(
            "https://raw.githubusercontent.com/mher/flower/main/flower/static/flower.png",
            FLOWER_ICON,
        )
    except Exception:
        pass


def combined_diagram():
    """전체 인프라 통합 뷰 (To-Be, PPT 16:9 친화).

    핵심:
    - VPC + Multi-AZ (Public / Private App / Private DB)
    - EKS managed control plane
    - **Backend 도메인을 마이크로서비스로 분리** — ALB path-based routing
      현재 모놀리식 Django → 도메인 단위 Deployment 로 점진적 분리 가능
      (dashed orange 클러스터 = 마이크로화 후보 영역)
    - RDS PostgreSQL Multi-AZ (Primary + Standby + Read Replica)
    - ElastiCache Redis Cluster Mode (3 shards × P+R)
    - 이벤트 기반 영상 파이프라인 (S3 → SNS → SQS → Lambda)
    """
    download_flower_icon()

    with Diagram(
        "MeFit Full Infrastructure (To-Be, Compact)",
        filename="full_infrastructure_tobe_compact",
        show=False,
        direction="LR",
        graph_attr=BASE_GRAPH_ATTR,
        node_attr=BASE_NODE_ATTR,
        edge_attr=EDGE_DEFAULT,
    ):
        with C("Client + Edge"):
            user = Client("User\nBrowser")
            cf_dns = Cloudflare("Cloudflare\nDNS + CDN")
            frontend = Nextjs("Next.js\n(Pages)")
            route53 = Route53("Route 53")
            waf = WAF("AWS WAF")
            acm = ACM("ACM TLS")

        with C("VPC 10.0.0.0/16  (Multi-AZ a/b/c)", VPC_CLUSTER_ATTR):
            with C("Public Subnet", PUBLIC_SUBNET_ATTR):
                alb = ALB("ALB\n(public, path-routed)")
                nat = NATGateway("NAT GW\n× AZ")

            with C("VPC Endpoints"):
                vpce_s3 = Privatelink("S3\nGateway")
                vpce_sqs = Privatelink("SQS\nInterface")
                vpce_ecr = Privatelink("ECR\nInterface")
                vpce_sm = Privatelink("Secrets\nInterface")

            with C("Private App Subnet — EKS Multi-AZ", PRIVATE_APP_SUBNET_ATTR):
                eks_cp = EKS("EKS Control Plane\n(managed)")
                ingress = Ing("Ingress\npath-based routing")

                with C(
                    "Backend Domain Microservices  (per-domain Deployments)",
                    MICROSERVICE_CLUSTER_ATTR,
                ):
                    svc_auth = Deploy("auth-svc\n/auth /users")
                    svc_resume = Deploy("resume-svc\n/resumes")
                    svc_jd = Deploy("jd-svc\n/job-descriptions")
                    svc_interview = Deploy("interview-svc\n/interviews")
                    svc_ticket = Deploy(
                        "ticket-svc\n/tickets /subscriptions"
                    )
                    svc_profile = Deploy(
                        "profile-svc\n/profiles /achievements /streaks"
                    )
                    svc_notif = Deploy(
                        "notification-svc\n/notifications  (SSE)"
                    )

                with C("Specialized Services"):
                    voice_svc = Deploy("voice-api\nFastAPI (TTS/STT)")
                    async_workers = Deploy(
                        "Async Workers × 4\ncelery / sqs-celery\nscraper / beat"
                    )
                    ai_workers = Deploy(
                        "AI/Reporting × 2\nresume-analyzer\nreport-worker"
                    )
                    flower = Custom("Flower\n(admin)", FLOWER_ICON)

            with C("Private DB Subnet — RDS Multi-AZ", PRIVATE_DB_SUBNET_ATTR):
                rds_primary = RDSPostgresqlInstance("RDS Primary\n(AZ-a)")
                rds_standby = RDSPostgresqlInstance("RDS Standby\n(AZ-b, sync)")
                rds_replica = RDSPostgresqlInstance("RDS Read Replica\n(AZ-c, async)")

            with C("Private DB Subnet — ElastiCache Cluster", PRIVATE_DB_SUBNET_ATTR):
                redis_p1 = ElasticacheForRedis("Shard 1\nPrimary")
                redis_r1 = ElasticacheForRedis("Shard 1\nReplica")
                redis_p2 = ElasticacheForRedis("Shard 2\nPrimary")
                redis_r2 = ElasticacheForRedis("Shard 2\nReplica")
                redis_p3 = ElasticacheForRedis("Shard 3\nPrimary")
                redis_r3 = ElasticacheForRedis("Shard 3\nReplica")

        with C("S3 (KMS, Versioned)"):
            s3_video = S3("video-files\n.webm input")
            s3_outputs = S3("output buckets × 4\n.mp4 / .jpg / .wav / 16kHz")
            s3_be = S3("be-files\n(app assets)")

        with C("Event Pipeline"):
            sns_uploaded = SNS("SNS\nvideo-uploaded")
            sqs_fanout = SQS("SQS Fan-out × 3\n+ DLQ each")
            sqs_step = SQS("SQS step-complete\n(+ face-q, DLQs)")
            lb_media = LambdaFunction(
                "Media Lambdas × 3\nvideo / frame / audio"
            )
            lb_ml = LambdaFunction(
                "ML Lambdas × 2\nface / voice"
            )

        with C("AWS Managed Services"):
            ecr = ECR("ECR")
            sm = SecretsManager("Secrets Mgr")
            kms = KMS("KMS CMK")
            backup = Backup("AWS Backup")
            cw = Cloudwatch("CloudWatch\n+ X-Ray")

        user >> Edge(label="DNS") >> cf_dns
        cf_dns >> Edge(label="static (Pages)") >> frontend
        cf_dns >> Edge(label="api.mefit.kr") >> route53
        route53 >> waf >> alb
        acm >> Edge(style="dotted", color="#9CA3AF") >> alb

        frontend >> Edge(label="presigned upload") >> s3_video
        frontend >> Edge(label="API call") >> waf

        alb >> Edge(label="HTTPS 443") >> ingress
        ingress >> Edge(label="/auth/*") >> svc_auth
        ingress >> Edge(style="dashed", color="#FB8C00") >> svc_resume
        ingress >> Edge(style="dashed", color="#FB8C00") >> svc_jd
        ingress >> Edge(style="dashed", color="#FB8C00") >> svc_interview
        ingress >> Edge(style="dashed", color="#FB8C00") >> svc_ticket
        ingress >> Edge(style="dashed", color="#FB8C00") >> svc_profile
        ingress >> Edge(style="dashed", color="#FB8C00") >> svc_notif
        ingress >> Edge(label="/voice/*") >> voice_svc

        s3_video >> Edge(label="ObjectCreated", color="darkgreen") >> sns_uploaded
        sns_uploaded >> sqs_fanout
        sqs_fanout >> lb_media
        lb_media >> s3_outputs
        lb_media >> Edge(label="complete", color="darkblue") >> sqs_step
        lb_media >> Edge(label="frames", color="purple") >> sqs_step
        sqs_step >> lb_ml
        lb_ml >> Edge(label="complete", color="darkblue") >> sqs_step

        sqs_step >> Edge(label="long poll", color="darkblue") >> vpce_sqs
        vpce_sqs >> async_workers
        svc_resume >> Edge(style="dashed", color="#43A047", label="private") >> vpce_s3
        vpce_s3 >> s3_be
        vpce_ecr >> ecr
        vpce_sm >> sm

        rds_primary >> Edge(label="sync", color="#1E88E5", style="bold") >> rds_standby
        rds_primary >> Edge(label="async", color="#1E88E5", style="dashed") >> rds_replica
        svc_auth >> Edge(label="write") >> rds_primary
        svc_resume >> Edge(label="write") >> rds_primary
        svc_jd >> rds_primary
        svc_interview >> rds_primary
        svc_ticket >> rds_primary
        svc_profile >> rds_primary
        svc_notif >> rds_primary
        ai_workers >> Edge(label="read", color="#1E88E5") >> rds_replica
        async_workers >> rds_primary

        redis_p1 >> Edge(label="async repl", style="dashed", color="#E53935") >> redis_r1
        redis_p2 >> Edge(label="async repl", style="dashed", color="#E53935") >> redis_r2
        redis_p3 >> Edge(label="async repl", style="dashed", color="#E53935") >> redis_r3
        svc_auth >> Edge(label="hash slot") >> redis_p1
        svc_interview >> redis_p2
        svc_notif >> redis_p3
        async_workers >> redis_p2
        ai_workers >> redis_p3
        flower >> redis_p1

        voice_svc >> Edge(label="TOKEN_VERIFY") >> svc_auth
        ai_workers >> Edge(label="boto3 invoke") >> lb_ml

        rds_primary >> Edge(style="dotted", color="#9CA3AF", label="snapshot") >> backup
        async_workers >> Edge(style="dashed", color="#FB8C00", label="egress") >> nat
        kms >> Edge(style="dotted", color="#9CA3AF") >> s3_video
        kms >> Edge(style="dotted", color="#9CA3AF") >> sqs_fanout

        svc_auth >> Edge(style="dotted", color="#6B7280") >> cw
        lb_media >> Edge(style="dotted", color="#6B7280") >> cw

        eks_cp >> Edge(style="dotted", color="#9CA3AF") >> svc_auth


def main():
    combined_diagram()
    print("Done!")


if __name__ == "__main__":
    main()
