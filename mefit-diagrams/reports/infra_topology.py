"""
인프라 토폴로지 다이어그램
- EC2 (m5.large, Seoul region) 위 k3s 클러스터
- AWS RDS, S3, SNS/SQS, Lambda, Cloudflare, Grafana Cloud
"""

import os
import sys

from diagrams import Cluster, Diagram, Edge
from diagrams.aws.compute import EC2, LambdaFunction
from diagrams.aws.database import RDS
from diagrams.aws.integration import SNS, SQS
from diagrams.aws.storage import S3
from diagrams.k8s.compute import Deploy, StatefulSet
from diagrams.k8s.network import Ing
from diagrams.onprem.monitoring import Grafana, Prometheus
from diagrams.onprem.logging import Loki
from diagrams.saas.cdn import Cloudflare
from diagrams.onprem.inmemory import Redis


# out/reports 디렉토리에 생성
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
OUT_DIR = os.path.join(ROOT_DIR, "out", "reports")
os.makedirs(OUT_DIR, exist_ok=True)

GRAPH_ATTR = {
    "splines": "ortho",
    "nodesep": "1.2",
    "ranksep": "1.8",
    "pad": "0.5",
    "fontsize": "12",
    "fontname": "Helvetica",
    "overlap": "false",
    "newrank": "true",
}

EDGE_DEFAULT = {
    "color": "#4B5563",
    "fontsize": "9",
    "fontname": "Helvetica",
    "penwidth": "1.2",
    "arrowsize": "0.7",
}


def infra_topology():
    with Diagram(
        "MeFit 인프라 토폴로지",
        filename=os.path.join(OUT_DIR, "infra_topology"),
        show=False,
        direction="TB",
        graph_attr=GRAPH_ATTR,
        edge_attr=EDGE_DEFAULT,
    ):
        # --- Cloudflare Edge ---
        with Cluster("Cloudflare Workers (Edge, Global)"):
            cf_frontend = Cloudflare("mefit-frontend\n(Vite SPA bundle)")

        # --- EC2 (m5.large, Seoul region) ---
        with Cluster("EC2 (m5.large, Seoul region)"):

            # --- k3s server node ---
            with Cluster("k3s server node"):
                with Cluster("namespace: mefit-backend-production"):
                    # Deployments / StatefulSets
                    api = Deploy("mefit-production-api\n(Django API)")
                    celery_worker = Deploy("mefit-production-celery-worker\n(default queue)")
                    celery_beat = Deploy("mefit-production-celery-beat\n(scheduler)")
                    sqs_celery = Deploy("mefit-production-sqs-celery-worker\n(SQS consumer)")
                    flower = Deploy("mefit-production-flower\n(Celery monitoring)")
                    voice_api = Deploy("mefit-production-voice-api\n(FastAPI)")
                    llm_gw = Deploy("mefit-llm-gateway\n(LiteLLM)")
                    redis = StatefulSet("mefit-production-redis\n(StatefulSet, 1Gi PVC)")
                    analysis_resume = Deploy("mefit-production-\nanalysis-resume-worker")
                    interview_report = Deploy("mefit-production-interview-\nanalysis-report-worker")

                # Ingress (Traefik)
                with Cluster("Ingress (Traefik)"):
                    ing_api = Ing("api.mefit.kr\n→ api:8000")
                    ing_llm = Ing("llm.mefit.kr\n→ llm-gateway:4000")
                    ing_voice = Ing("voice.mefit.kr\n→ voice-api:8001")

            # --- k3s agent node (t3.small) ---
            with Cluster("k3s agent node (t3.small)"):
                light_workload = Deploy("가벼운 워크로드\n(Celery worker 일부, flower 등)")

            # --- k3s agent node (m5.large, nodepool=heavy) ---
            with Cluster("k3s agent node (m5.large, nodepool=heavy)"):
                scraper = Deploy("mefit-production-scraper-worker\n(Playwright, shm 512MB)")
                stt_worker = Deploy("mefit-production-analysis-stt-worker\n(faster-whisper, 2Gi)")

        # --- AWS RDS ---
        with Cluster("AWS RDS"):
            rds = RDS("PostgreSQL\n+ pgvector ext.\n\nusers, resumes,\ninterviews, reports\nlitellm (virtual keys)")

        # --- AWS S3 ---
        with Cluster("AWS S3 (5 buckets)"):
            s3_video = S3("mefit-video")
            s3_scaled_video = S3("mefit-scaled-video")
            s3_frame = S3("mefit-frame")
            s3_audio = S3("mefit-audio")
            s3_scaled_audio = S3("mefit-scaled-audio")

        # --- AWS SNS / SQS ---
        with Cluster("AWS SNS / SQS"):
            sns_video = SNS("video-uploaded SNS")
            sqs_converter = SQS("converter Q")
            sqs_frame_q = SQS("frame Q")
            sqs_audio_q = SQS("audio Q")
            sqs_step = SQS("step-complete Q")
            sqs_face = SQS("face-trigger Q")

        # --- AWS Lambda ---
        with Cluster("AWS Lambda (5 functions)"):
            lb_converter = LambdaFunction("video-converter")
            lb_frame = LambdaFunction("frame-extractor")
            lb_audio = LambdaFunction("audio-extractor")
            lb_voice = LambdaFunction("voice-analyzer\n(sync)")
            lb_face = LambdaFunction("face-analyzer")

        # --- Grafana Cloud ---
        with Cluster("Grafana Cloud (monitoring)"):
            grafana = Grafana("Grafana")
            prometheus = Prometheus("Prometheus\n(metrics)")
            loki = Loki("Loki\n(logs)")

        # --- Edges: Ingress → Services ---
        ing_api >> api
        ing_llm >> llm_gw
        ing_voice >> voice_api

        # --- Edges: k3s → AWS ---
        api >> Edge(label="DB") >> rds
        llm_gw >> Edge(label="DB") >> rds
        sqs_celery >> Edge(label="long poll") >> sqs_step

        # --- Edges: SNS fan-out ---
        sns_video >> sqs_converter
        sns_video >> sqs_frame_q
        sns_video >> sqs_audio_q

        # --- Edges: SQS → Lambda ---
        sqs_converter >> lb_converter
        sqs_frame_q >> lb_frame
        sqs_audio_q >> lb_audio
        sqs_face >> lb_face

        # --- Edges: Lambda → S3 ---
        lb_converter >> s3_scaled_video
        lb_frame >> s3_frame
        lb_audio >> s3_audio
        lb_audio >> s3_scaled_audio

        # --- Edges: Lambda → step complete ---
        lb_converter >> sqs_step
        lb_frame >> sqs_face
        lb_face >> sqs_step
        lb_audio >> sqs_step

        # --- Edges: Monitoring ---
        api >> Edge(style="dashed", color="#6B7280") >> prometheus
        prometheus >> grafana
        loki >> grafana

        # --- Cloudflare → EC2 ---
        cf_frontend >> Edge(label="API call") >> ing_api


if __name__ == "__main__":
    infra_topology()
    print("Done: out/reports/infra_topology.png")
