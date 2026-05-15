"""main_landscape.py
================

406mm x 212mm (15.98 x 8.35 inch) 고정 크기 가로 다이어그램.
여백 최소화, 아이콘/선 가시성 최적화.

출력:
  - aws_infrastructure_landscape.png
  - k8s_infrastructure_landscape.png
  - full_infrastructure_landscape.png
"""

import sys
from urllib.request import urlretrieve

from diagrams import Cluster, Diagram, Edge
from diagrams.aws.compute import EC2, LambdaFunction
from diagrams.aws.integration import SNS, SQS
from diagrams.aws.storage import S3
from diagrams.custom import Custom
from diagrams.k8s.compute import Deploy, Pod
from diagrams.k8s.network import Ing, SVC
from diagrams.onprem.client import Client
from diagrams.onprem.database import Postgresql
from diagrams.programming.framework import Django, Nextjs
from diagrams.saas.cdn import Cloudflare


FLOWER_ICON = "flower.png"

# 406mm x 212mm = 15.98 x 8.35 inch
# dpi=150 -> 2397 x 1253 px  /  dpi=200 -> 3196 x 1670 px
W = "16.18"
H = "8.35"

BASE_GRAPH_ATTR = {
    "splines": "ortho",
    "nodesep": "0.25",
    "ranksep": "0.55",
    "pad": "0.08",          # 외곽 여백 최소화 (inch)
    "fontsize": "10",
    "overlap": "false",
    "newrank": "true",
    "concentrate": "true",
    "compound": "true",
    "size": f"{W},{H}!",    # ! = 정확히 이 크기로 고정
    "ratio": "fill",        # 캔버스를 size에 꽉 채움
    "dpi": "150",
}

BASE_NODE_ATTR = {
    "fontsize": "9",
    "margin": "0.07,0.03",  # 노드 내부 패딩 최소화
    "imagescale": "true",
    "width": "0.9",
    "height": "0.9",
    "fixedsize": "false",
}

EDGE_DEFAULT = {
    "color": "#374151",
    "fontsize": "8",
    "fontname": "Helvetica",
    "penwidth": "1.4",
    "arrowsize": "0.7",
    "minlen": "1",
}

CLUSTER_ATTR = {
    "margin": "6",
    "fontsize": "9",
    "labeljust": "l",
    "style": "rounded",
    "penwidth": "1.3",
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
        "MeFit AWS Video Pipeline",
        filename="aws_infrastructure_landscape",
        show=False,
        direction="LR",
        graph_attr={**BASE_GRAPH_ATTR, "size": "16.25,8.35!"},
        node_attr=BASE_NODE_ATTR,
        edge_attr=EDGE_DEFAULT,
    ):
        with C("S3 Input"):
            s3_video = S3("video-files\n.webm")

        sns_uploaded = SNS("video-uploaded\nSNS")

        with C("Fan-out Queues"):
            sqs_converter = SQS("video-converter-queue")
            sqs_converter_dlq = SQS("video-converter-dlq")
            sqs_frame = SQS("frame-extractor-queue")
            sqs_frame_dlq = SQS("frame-extractor-dlq")
            sqs_audio = SQS("audio-extractor-queue")
            sqs_audio_dlq = SQS("audio-extractor-dlq")

        with C("Lambda (Python 3.12)"):
            lb_converter = LambdaFunction("video-converter")
            lb_frame = LambdaFunction("frame-extractor")
            lb_audio = LambdaFunction("audio-extractor")
            lb_face = LambdaFunction("face-analyzer")
            lb_voice = LambdaFunction("voice-analyzer\n(on-demand)")

        with C("Downstream Queues"):
            sqs_face = SQS("face-analyzer-queue")
            sqs_face_dlq = SQS("face-analyzer-dlq")

        with C("Completion Queue"):
            sqs_step = SQS("video-step-complete")
            sqs_step_dlq = SQS("video-step-complete-dlq")

        with C("S3 Output"):
            s3_scaled_video = S3("scaled-video\n.mp4")
            s3_frames = S3("video-frames\n.jpg")
            s3_audio = S3("audio-files\n.wav")
            s3_scaled_audio = S3("scaled-audio\n16kHz wav")

        celery_sqs_worker = Django("Django SQS\nCelery Worker")

        s3_video >> Edge(label="ObjectCreated *.webm", color="#16a34a") >> sns_uploaded

        sns_uploaded >> Edge(label="sub") >> sqs_converter
        sns_uploaded >> Edge(label="sub") >> sqs_frame
        sns_uploaded >> Edge(label="sub") >> sqs_audio

        sqs_converter >> Edge(label="ESM") >> lb_converter
        sqs_frame >> Edge(label="ESM") >> lb_frame
        sqs_audio >> Edge(label="ESM") >> lb_audio

        lb_converter >> Edge(label=".mp4") >> s3_scaled_video
        lb_frame >> Edge(label=".jpg") >> s3_frames
        lb_audio >> Edge(label=".wav") >> s3_audio
        lb_audio >> Edge(label="16kHz") >> s3_scaled_audio

        lb_converter >> Edge(label="step complete", color="#1d4ed8") >> sqs_step
        lb_audio >> Edge(label="step complete", color="#1d4ed8") >> sqs_step

        lb_frame >> Edge(label="frames ready", color="#7c3aed") >> sqs_face
        sqs_face >> Edge(label="ESM") >> lb_face
        lb_face >> Edge(label="step complete", color="#1d4ed8") >> sqs_step

        sqs_step >> Edge(label="kombu long poll", color="#1d4ed8") >> celery_sqs_worker

        sqs_converter >> Edge(label="redrive", style="dashed", color="#dc2626") >> sqs_converter_dlq
        sqs_frame >> Edge(label="redrive", style="dashed", color="#dc2626") >> sqs_frame_dlq
        sqs_audio >> Edge(label="redrive", style="dashed", color="#dc2626") >> sqs_audio_dlq
        sqs_face >> Edge(label="redrive", style="dashed", color="#dc2626") >> sqs_face_dlq
        sqs_step >> Edge(label="redrive", style="dashed", color="#dc2626") >> sqs_step_dlq


def k8s_diagram():
    download_flower_icon()

    with Diagram(
        "MeFit k3s Cluster",
        filename="k8s_infrastructure_landscape",
        show=False,
        direction="LR",
        graph_attr=BASE_GRAPH_ATTR,
        node_attr=BASE_NODE_ATTR,
        edge_attr=EDGE_DEFAULT,
    ):
        ec2_edge = EC2("EC2\n:80/:443")

        with C("k3s cluster on EC2"):
            cp_node = EC2("control-plane\n(k3s server)")
            wk_node_1 = EC2("worker-1\n(k3s agent)")
            wk_node_2 = EC2("worker-2\n(k3s agent)")

            web_ing = Ing("Traefik\napi.mefit.kr")
            voice_ing = Ing("Traefik\nvoice-api.mefit.kr")

            with C("Namespace: mefit-backend-production"):
                with C("backend"):
                    api_svc = SVC("api\n:8000")
                    api_dp = Deploy("api\nreplicas=2")
                    api_pod1 = Pod("django pod-1")
                    api_pod2 = Pod("django pod-2")

                    celery_worker_dp = Deploy("celery-worker\nreplicas=1")
                    celery_worker_pod = Pod("celery-worker")

                    celery_beat_dp = Deploy("celery-beat\nreplicas=1")
                    celery_beat_pod = Pod("celery-beat")

                    sqs_worker_dp = Deploy("sqs-celery-worker\nreplicas=1")
                    sqs_worker_pod = Pod("sqs-celery-worker")

                    flower_dp = Deploy("flower\nreplicas=1")
                    flower_pod = Pod("flower")
                    flower_svc = SVC("flower\n:5555")

                with C("voice-api"):
                    voice_svc = SVC("voice-api\n:8001")
                    voice_dp = Deploy("voice-api\nreplicas=1")
                    voice_pod = Pod("voice-api")

                with C("analysis-resume"):
                    resume_dp = Deploy("analysis-resume\nreplicas=1")
                    resume_pod = Pod("analysis-resume")

                with C("interview-analysis-report"):
                    report_dp = Deploy("report-worker\nreplicas=1")
                    report_pod = Pod("report-worker")

                with C("scraper"):
                    scraper_dp = Deploy("scraper-worker\nreplicas=1")
                    scraper_pod = Pod("scraper")

                with C("common"):
                    redis_svc = SVC("redis\n:6379")
                    redis_dp = Deploy("redis\nreplicas=1")
                    redis_pod = Pod("redis")

        rds = Postgresql("RDS PostgreSQL")
        sqs_step = SQS("SQS\nvideo-step-complete")

        cp_node >> wk_node_1
        cp_node >> wk_node_2
        ec2_edge >> Edge(label=":80/:443") >> web_ing
        ec2_edge >> Edge(label=":80/:443") >> voice_ing

        web_ing >> api_svc >> api_dp
        api_dp >> api_pod1
        api_dp >> api_pod2

        voice_ing >> voice_svc >> voice_dp >> voice_pod

        api_pod1 >> Edge(label="token verify") >> voice_pod
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
        "MeFit Full Infrastructure",
        filename="full_infrastructure_landscape",
        show=False,
        direction="LR",
        graph_attr={
            **BASE_GRAPH_ATTR,
            "nodesep": "0.20",
            "ranksep": "0.50",
        },
        node_attr=BASE_NODE_ATTR,
        edge_attr=EDGE_DEFAULT,
    ):
        user = Client("User\nBrowser")

        with C("Cloudflare"):
            cf_dns = Cloudflare("DNS\nmefit.kr")
            cf_worker = Cloudflare("Pages\nFrontend")

        frontend = Nextjs("Next.js\nFrontend")
        ec2_edge = EC2("EC2\n:80/:443")

        with C("k3s on EC2"):
            cp_node = EC2("control-plane")
            wk_node_1 = EC2("worker-1")
            wk_node_2 = EC2("worker-2")

        with C("S3 Input"):
            s3_video = S3("video-files\n.webm")

        with C("AWS Storage + Event"):
            s3_scaled_video = S3("scaled-video\n.mp4")
            s3_frames = S3("frames\n.jpg")
            s3_audio = S3("audio\n.wav")
            s3_scaled_audio = S3("scaled-audio\n16kHz")
            s3_be = S3("be-files")

            sns_uploaded = SNS("video-uploaded")

            sqs_converter = SQS("video-converter-q")
            sqs_frame = SQS("frame-extractor-q")
            sqs_audio = SQS("audio-extractor-q")
            sqs_face = SQS("face-analyzer-q")
            sqs_step = SQS("video-step-complete")

            lb_converter = LambdaFunction("video-converter")
            lb_frame = LambdaFunction("frame-extractor")
            lb_audio = LambdaFunction("audio-extractor")
            lb_face = LambdaFunction("face-analyzer")
            lb_voice = LambdaFunction("voice-analyzer")

        with C("k3s: mefit-backend-production"):
            web_ing = Ing("Ingress\napi.mefit.kr")
            voice_ing = Ing("Ingress\nvoice-api")

            api_svc = SVC("api:8000")
            api_dp = Deploy("api\nreplicas=2")
            api_pod1 = Pod("api pod-1")
            api_pod2 = Pod("api pod-2")

            voice_svc = SVC("voice-api:8001")
            voice_dp = Deploy("voice-api")
            voice_pod = Pod("voice pod")

            celery_worker = Deploy("celery-worker")
            celery_beat = Deploy("celery-beat")
            sqs_worker = Deploy("sqs-celery-worker")

            scraper = Deploy("scraper")
            resume = Deploy("analysis-resume")
            report = Deploy("report-worker")

            redis_svc = SVC("redis:6379")
            redis = Deploy("redis")
            flower = Custom("Flower", FLOWER_ICON)

        rds = Postgresql("RDS\nPostgreSQL")

        user >> Edge(label="DNS") >> cf_dns
        cf_dns >> cf_worker
        cf_worker >> Edge(label="static") >> frontend
        cf_dns >> Edge(label="api.mefit.kr") >> ec2_edge

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

        s3_video >> Edge(label="S3 event") >> sns_uploaded
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

        lb_frame >> Edge(label="frames ready", color="#7c3aed") >> sqs_face
        sqs_face >> Edge(label="ESM") >> lb_face
        lb_face >> Edge(label="step complete") >> sqs_step

        sqs_step >> Edge(label="kombu poll") >> sqs_worker

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

        voice_pod >> Edge(label="TOKEN_VERIFY") >> api_svc
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

