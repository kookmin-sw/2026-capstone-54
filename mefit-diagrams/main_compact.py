"""main_compact.py
================

main.py 와 동일한 3 종 인프라 다이어그램을, 노드/엣지/클러스터 사이
여백을 공격적으로 줄인 **컴팩트 버전**으로 다시 그린다.

핵심 차이는 다음 4 가지 attribute 만:

1. graph `nodesep` / `ranksep` / `pad` 축소
2. cluster `margin` 축소
3. node `margin` 축소 (라벨 padding)
4. edge `penwidth` / `arrowsize` / `minlen` 축소

라벨 텍스트와 폰트 크기는 가독성을 위해 거의 그대로 유지한다.

출력:
  - aws_infrastructure_compact.png
  - k8s_infrastructure_compact.png
  - full_infrastructure_compact.png
"""

import sys
from urllib.request import urlretrieve

from diagrams import Cluster, Diagram, Edge
from diagrams.aws.compute import EC2
from diagrams.aws.integration import SNS, SQS
from diagrams.aws.storage import S3
from diagrams.aws.compute import LambdaFunction
from diagrams.custom import Custom
from diagrams.k8s.compute import Deploy, Pod
from diagrams.k8s.network import Ing, SVC
from diagrams.onprem.client import Client
from diagrams.onprem.database import Postgresql
from diagrams.programming.framework import Django, Nextjs
from diagrams.saas.cdn import Cloudflare


FLOWER_ICON = "flower.png"

# graph_attr 단위: inch. 원본 main.py 의 nodesep=1.6 / ranksep=2.0 / pad=0.4 대비
# 6~4배 축소. 더 줄이면 라벨이 겹치기 시작한다.
BASE_GRAPH_ATTR = {
    "splines": "ortho",
    "nodesep": "0.30",
    "ranksep": "0.55",
    "pad": "0.15",
    "margin": "0",
    "fontsize": "11",
    "overlap": "false",
    "newrank": "true",
    "concentrate": "true",
    "compound": "true",
}

# node margin 단위: "가로,세로" inch. 기본 ~0.11,0.055.
BASE_NODE_ATTR = {
    "fontsize": "10",
    "margin": "0.08,0.04",
    "imagescale": "true",
}

# edge minlen=1 → 같은 rank 로 붙을 수 있는 가장 짧은 엣지.
EDGE_DEFAULT = {
    "color": "#4B5563",
    "fontsize": "9",
    "fontname": "Helvetica",
    "penwidth": "1.1",
    "arrowsize": "0.6",
    "minlen": "1",
}

# cluster margin 단위: points (1pt ≈ 1/72 inch). graph 의 margin 과 단위가 다르다.
CLUSTER_ATTR = {
    "margin": "8",
    "fontsize": "10",
    "labeljust": "l",
    "style": "rounded",
    "penwidth": "1.2",
}


def C(label):
    return Cluster(label, graph_attr=CLUSTER_ATTR)


def download_flower_icon():
    try:
        urlretrieve(
            "https://raw.githubusercontent.com/mher/flower/main/flower/static/flower.png",
            FLOWER_ICON,
        )
    except Exception:
        pass


def aws_diagram():
    with Diagram(
        "MeFit AWS Video Pipeline (Compact)",
        filename="aws_infrastructure_compact",
        show=False,
        direction="LR",
        graph_attr=BASE_GRAPH_ATTR,
        node_attr=BASE_NODE_ATTR,
        edge_attr=EDGE_DEFAULT,
    ):
        with C("S3 Input"):
            s3_video = S3("pj-kmucd1-04-mefit-video-files\n.webm input")

        with C("S3 Output"):
            s3_scaled_video = S3("pj-kmucd1-04-mefit-scaled-video-files\n.mp4 output")
            s3_frames = S3("pj-kmucd1-04-mefit-video-frame-files\n.jpg output")
            s3_audio = S3("pj-kmucd1-04-mefit-audio-files\n.wav output")
            s3_scaled_audio = S3("pj-kmucd1-04-mefit-scaled-audio-files\n16kHz wav")

        sns_uploaded = SNS("pj-kmucd1-04-mefit-video-uploaded")

        with C("Fan-out Queues"):
            sqs_converter = SQS("video-converter-queue")
            sqs_converter_dlq = SQS("video-converter-queue-dlq")
            sqs_frame = SQS("frame-extractor-queue")
            sqs_frame_dlq = SQS("frame-extractor-queue-dlq")
            sqs_audio = SQS("audio-extractor-queue")
            sqs_audio_dlq = SQS("audio-extractor-queue-dlq")

        with C("Downstream Queues"):
            sqs_face = SQS("face-analyzer-queue")
            sqs_face_dlq = SQS("face-analyzer-queue-dlq")

        with C("Completion Queue"):
            sqs_step = SQS("video-step-complete")
            sqs_step_dlq = SQS("video-step-complete-dlq")

        with C("Lambda (Python 3.12)"):
            lb_converter = LambdaFunction("video-converter")
            lb_frame = LambdaFunction("frame-extractor")
            lb_audio = LambdaFunction("audio-extractor")
            lb_face = LambdaFunction("face-analyzer")
            LambdaFunction("voice-analyzer\n(on-demand invoke)")

        celery_sqs_worker = Django(
            "Django SQS Celery Worker\nqueue: mefit-video-step-complete"
        )

        (
            s3_video
            >> Edge(label="ObjectCreated *.webm", color="darkgreen")
            >> sns_uploaded
        )

        sns_uploaded >> Edge(label="subscription") >> sqs_converter
        sns_uploaded >> Edge(label="subscription") >> sqs_frame
        sns_uploaded >> Edge(label="subscription") >> sqs_audio

        sqs_converter >> Edge(label="event source mapping") >> lb_converter
        sqs_frame >> Edge(label="event source mapping") >> lb_frame
        sqs_audio >> Edge(label="event source mapping") >> lb_audio

        lb_converter >> Edge(label=".mp4") >> s3_scaled_video
        lb_frame >> Edge(label=".jpg") >> s3_frames
        lb_audio >> Edge(label="wav") >> s3_audio
        lb_audio >> Edge(label="16kHz mono wav") >> s3_scaled_audio

        lb_converter >> Edge(label="step complete", color="darkblue") >> sqs_step
        lb_audio >> Edge(label="step complete", color="darkblue") >> sqs_step

        lb_frame >> Edge(label="frames ready", color="purple") >> sqs_face
        sqs_face >> Edge(label="event source mapping") >> lb_face
        lb_face >> Edge(label="step complete", color="darkblue") >> sqs_step

        (
            sqs_step
            >> Edge(label="long polling (kombu/celery)", color="darkblue")
            >> celery_sqs_worker
        )

        (
            sqs_converter
            >> Edge(label="redrive", style="dashed", color="firebrick")
            >> sqs_converter_dlq
        )
        (
            sqs_frame
            >> Edge(label="redrive", style="dashed", color="firebrick")
            >> sqs_frame_dlq
        )
        (
            sqs_audio
            >> Edge(label="redrive", style="dashed", color="firebrick")
            >> sqs_audio_dlq
        )
        (
            sqs_face
            >> Edge(label="redrive", style="dashed", color="firebrick")
            >> sqs_face_dlq
        )
        (
            sqs_step
            >> Edge(label="redrive", style="dashed", color="firebrick")
            >> sqs_step_dlq
        )


def k8s_diagram():
    download_flower_icon()

    with Diagram(
        "MeFit k3s Cluster (Compact)",
        filename="k8s_infrastructure_compact",
        show=False,
        direction="LR",
        graph_attr=BASE_GRAPH_ATTR,
        node_attr=BASE_NODE_ATTR,
        edge_attr=EDGE_DEFAULT,
    ):
        ec2_edge = EC2("EC2 public endpoint\n:80/:443")

        with C("k3s cluster on EC2 instances"):
            cp_node = EC2("ec2-control-plane\n(k3s server)")
            wk_node_1 = EC2("ec2-worker-1\n(k3s agent)")
            wk_node_2 = EC2("ec2-worker-2\n(k3s agent)")

            web_ing = Ing("Traefik Ingress\nHost: api.mefit.kr")
            voice_ing = Ing("Traefik Ingress\nHost: voice-api.mefit.kr")

            with C("Namespace: mefit-backend-production"):
                with C("backend"):
                    api_svc = SVC("Service mefit-production-api\nClusterIP:8000")
                    api_dp = Deploy("Deployment mefit-production-api\nreplicas=2")
                    api_pod1 = Pod("django pod-1")
                    api_pod2 = Pod("django pod-2")

                    celery_worker_dp = Deploy(
                        "Deployment mefit-production-celery-worker\nreplicas=1"
                    )
                    celery_worker_pod = Pod("celery-worker pod")

                    celery_beat_dp = Deploy(
                        "Deployment mefit-production-celery-beat\nreplicas=1"
                    )
                    celery_beat_pod = Pod("celery-beat pod")

                    sqs_worker_dp = Deploy(
                        "Deployment mefit-production-sqs-celery-worker\nreplicas=1"
                    )
                    sqs_worker_pod = Pod("sqs-celery-worker pod")

                    flower_dp = Deploy("Deployment mefit-production-flower\nreplicas=1")
                    flower_pod = Pod("flower pod")
                    flower_svc = SVC("Service mefit-production-flower\nClusterIP:5555")

                with C("voice-api"):
                    voice_svc = SVC(
                        "Service mefit-production-voice-api\nClusterIP:8001"
                    )
                    voice_dp = Deploy(
                        "Deployment mefit-production-voice-api\nreplicas=1"
                    )
                    voice_pod = Pod("voice-api pod")

                with C("analysis-resume"):
                    resume_dp = Deploy(
                        "Deployment mefit-production-analysis-resume-worker\nreplicas=1"
                    )
                    resume_pod = Pod("analysis-resume pod")

                with C("interview-analysis-report"):
                    report_dp = Deploy(
                        "Deployment mefit-production-interview-analysis-report-worker\nreplicas=1"
                    )
                    report_pod = Pod("report-worker pod")

                with C("scraper"):
                    scraper_dp = Deploy(
                        "Deployment mefit-production-scraper-worker\nreplicas=1"
                    )
                    scraper_pod = Pod("scraper pod")

                with C("common"):
                    redis_svc = SVC("Service mefit-production-redis\nClusterIP:6379")
                    redis_dp = Deploy("Deployment mefit-production-redis\nreplicas=1")
                    redis_pod = Pod("redis pod")

        rds = Postgresql("AWS RDS PostgreSQL")
        sqs_step = SQS("SQS video-step-complete")

        cp_node >> wk_node_1
        cp_node >> wk_node_2
        ec2_edge >> Edge(label="HTTP 80/443") >> web_ing
        ec2_edge >> Edge(label="HTTP 80/443") >> voice_ing

        web_ing >> api_svc >> api_dp
        api_dp >> api_pod1
        api_dp >> api_pod2

        voice_ing >> voice_svc >> voice_dp >> voice_pod

        api_pod1 >> Edge(label="token verify endpoint") >> voice_pod
        voice_pod >> Edge(label="BACKEND_API_URL") >> api_svc

        celery_worker_dp >> celery_worker_pod
        celery_beat_dp >> celery_beat_pod
        sqs_worker_dp >> sqs_worker_pod
        resume_dp >> resume_pod
        report_dp >> report_pod
        scraper_dp >> scraper_pod
        flower_dp >> flower_pod >> flower_svc
        redis_svc >> redis_dp >> redis_pod

        api_pod1 >> rds
        api_pod2 >> rds
        resume_pod >> rds
        report_pod >> rds
        sqs_worker_pod >> rds

        api_pod1 >> redis_svc
        api_pod2 >> redis_svc
        celery_worker_pod >> redis_svc
        celery_beat_pod >> redis_svc
        resume_pod >> redis_svc
        report_pod >> redis_svc
        scraper_pod >> redis_svc
        flower_pod >> redis_svc

        sqs_step >> Edge(label="kombu long poll") >> sqs_worker_pod


def combined_diagram():
    download_flower_icon()

    with Diagram(
        "MeFit Full Infrastructure (Compact)",
        filename="full_infrastructure_compact",
        show=False,
        direction="TB",
        graph_attr=BASE_GRAPH_ATTR,
        node_attr=BASE_NODE_ATTR,
        edge_attr=EDGE_DEFAULT,
    ):
        user = Client("User Browser")
        with C("Cloudflare Edge"):
            cf_dns = Cloudflare("DNS\nmefit.kr · api.mefit.kr")
            cf_worker = Cloudflare("Worker (Pages)\nFrontend 정적 호스팅")
        frontend = Nextjs("Frontend Next.js")

        ec2_edge = EC2("EC2 public endpoint\n:80/:443")

        with C("k3s cluster on EC2 instances"):
            cp_node = EC2("ec2-control-plane\n(k3s server)")
            wk_node_1 = EC2("ec2-worker-1\n(k3s agent)")
            wk_node_2 = EC2("ec2-worker-2\n(k3s agent)")

        with C("S3 Input"):
            s3_video = S3("video-files\n.webm")

        with C("AWS Storage + Event"):
            s3_scaled_video = S3("scaled-video-files\n.mp4")
            s3_frames = S3("video-frame-files\n.jpg")
            s3_audio = S3("audio-files\n.wav")
            s3_scaled_audio = S3("scaled-audio-files\n16kHz wav")
            s3_be = S3("be-files")

            sns_uploaded = SNS("video-uploaded")

            sqs_converter = SQS("video-converter-queue")
            sqs_frame = SQS("frame-extractor-queue")
            sqs_audio = SQS("audio-extractor-queue")
            sqs_face = SQS("face-analyzer-queue")
            sqs_step = SQS("video-step-complete")

            lb_converter = LambdaFunction("video-converter")
            lb_frame = LambdaFunction("frame-extractor")
            lb_audio = LambdaFunction("audio-extractor")
            lb_face = LambdaFunction("face-analyzer")
            lb_voice = LambdaFunction("voice-analyzer")

        with C("k3s namespace: mefit-backend-production"):
            web_ing = Ing("Ingress api.mefit.kr")
            voice_ing = Ing("Ingress voice-api.mefit.kr")

            api_svc = SVC("Service mefit-production-api:8000")
            api_dp = Deploy("Deployment api\nreplicas=2")
            api_pod1 = Pod("api pod-1")
            api_pod2 = Pod("api pod-2")

            voice_svc = SVC("Service voice-api:8001")
            voice_dp = Deploy("Deployment voice-api\nreplicas=1")
            voice_pod = Pod("voice pod")

            celery_worker = Deploy("Deployment celery-worker")
            celery_beat = Deploy("Deployment celery-beat")
            sqs_worker = Deploy("Deployment sqs-celery-worker")

            scraper = Deploy("Deployment scraper-worker")
            resume = Deploy("Deployment analysis-resume-worker")
            report = Deploy("Deployment interview-analysis-report-worker")

            redis_svc = SVC("Service redis:6379")
            redis = Deploy("Deployment redis")
            flower = Custom("Flower\n(admin/flower)", FLOWER_ICON)

        rds = Postgresql("RDS PostgreSQL")
        user >> Edge(label="DNS lookup") >> cf_dns
        cf_dns >> Edge(label="Frontend\n(mefit.kr)") >> cf_worker
        cf_worker >> Edge(label="static assets") >> frontend
        cf_dns >> Edge(label="API\n(api.mefit.kr)") >> ec2_edge
        frontend >> Edge(label="presigned upload") >> s3_video
        frontend >> Edge(label="API call") >> ec2_edge
        cp_node >> wk_node_1
        cp_node >> wk_node_2
        ec2_edge >> web_ing
        ec2_edge >> voice_ing

        web_ing >> api_svc >> api_dp
        api_dp >> api_pod1
        api_dp >> api_pod2
        voice_ing >> voice_svc >> voice_dp >> voice_pod

        s3_video >> Edge(label="S3 event .webm") >> sns_uploaded
        sns_uploaded >> Edge(label="fan-out") >> sqs_converter
        sns_uploaded >> Edge(label="fan-out") >> sqs_frame
        sns_uploaded >> Edge(label="fan-out") >> sqs_audio

        sqs_converter >> lb_converter
        sqs_frame >> lb_frame
        sqs_audio >> lb_audio

        lb_converter >> s3_scaled_video
        lb_frame >> s3_frames
        lb_audio >> s3_audio
        lb_audio >> s3_scaled_audio

        lb_converter >> sqs_step
        lb_audio >> sqs_step

        lb_frame >> Edge(label="frames ready", color="purple") >> sqs_face
        sqs_face >> Edge(label="event source mapping") >> lb_face
        lb_face >> Edge(label="step complete") >> sqs_step

        sqs_step >> Edge(label="kombu polling") >> sqs_worker

        api_pod1 >> rds
        api_pod2 >> rds
        resume >> rds
        report >> rds
        sqs_worker >> rds

        api_pod1 >> s3_be
        api_pod2 >> s3_be

        api_pod1 >> redis_svc
        api_pod2 >> redis_svc
        celery_worker >> redis_svc
        celery_beat >> redis_svc
        resume >> redis_svc
        report >> redis_svc
        scraper >> redis_svc
        flower >> redis_svc
        redis_svc >> redis

        voice_pod >> Edge(label="TOKEN_VERIFY_ENDPOINT") >> api_svc
        report >> Edge(label="boto3 invoke") >> lb_voice
        lb_voice >> Edge(label="read scaled audio") >> s3_scaled_audio


def main():
    if len(sys.argv) > 1:
        cmd = sys.argv[1]
        if cmd == "aws":
            aws_diagram()
        elif cmd == "k8s":
            k8s_diagram()
        elif cmd == "combined":
            combined_diagram()
    else:
        aws_diagram()
        k8s_diagram()
        combined_diagram()
        print("Done!")


if __name__ == "__main__":
    main()
