"""
4단계 배포 흐름 다이어그램
1. Code Push → 2. Build (GH Action) → 3. Push Registry → 4. Deploy Target

서비스별 배포 도구:
- git push / docker buildx / docker push / kubectl apply
- uv sync / wrangler / wrangler deploy
- bun run build / aws s3 cp / sam deploy
- aws lambda update
"""

import os
import sys

from diagrams import Cluster, Diagram, Edge
from diagrams.onprem.vcs import Git
from diagrams.onprem.ci import GithubActions
from diagrams.onprem.container import Docker
from diagrams.aws.compute import LambdaFunction
from diagrams.aws.storage import S3
from diagrams.saas.cdn import Cloudflare
from diagrams.k8s.compute import Deploy


# out/reports 디렉토리에 생성
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
OUT_DIR = os.path.join(ROOT_DIR, "out", "reports")
os.makedirs(OUT_DIR, exist_ok=True)

GRAPH_ATTR = {
    "splines": "spline",
    "nodesep": "1.4",
    "ranksep": "2.2",
    "pad": "0.6",
    "fontsize": "12",
    "fontname": "Helvetica",
    "overlap": "false",
    "newrank": "true",
}

EDGE_DEFAULT = {
    "color": "#374151",
    "fontsize": "9",
    "fontname": "Helvetica",
    "penwidth": "1.4",
    "arrowsize": "0.8",
}

EDGE_STEP = {
    "color": "#2563EB",
    "penwidth": "2.0",
    "arrowsize": "0.9",
    "fontsize": "10",
    "fontname": "Helvetica",
}


def deploy_flow():
    with Diagram(
        "MeFit 4단계 배포 흐름",
        filename=os.path.join(OUT_DIR, "deploy_flow"),
        show=False,
        direction="LR",
        graph_attr=GRAPH_ATTR,
        edge_attr=EDGE_DEFAULT,
    ):
        # ===== Stage 1: Code Push =====
        with Cluster("1. Code Push"):
            git_push = Git("git push")

        # ===== Stage 2: Build (GH Action) =====
        with Cluster("2. Build (GitHub Actions)"):
            build_docker = GithubActions("docker buildx\n(Backend, Voice, Workers)")
            build_uv = GithubActions("uv sync\n(Lambda layers)")
            build_bun = GithubActions("bun run build\n(Frontend)")
            build_sam = GithubActions("sam build\n(Lambda SAM)")

        # ===== Stage 3: Push Registry =====
        with Cluster("3. Push Registry"):
            push_docker = Docker("docker push\n(GHCR / ECR)")
            push_wrangler = Cloudflare("wrangler upload\n(Cloudflare)")
            push_s3 = S3("aws s3 cp\n(Lambda zip)")
            push_sam = LambdaFunction("sam package\n(SAM artifact)")

        # ===== Stage 4: Deploy Target =====
        with Cluster("4. Deploy Target"):
            deploy_k8s = Deploy("kubectl apply\n(k3s cluster)")
            deploy_cf = Cloudflare("wrangler deploy\n(Cloudflare Workers)")
            deploy_lambda = LambdaFunction("sam deploy /\naws lambda update\n(Lambda functions)")

        # --- Flow: Backend (Django API, Voice API, Workers) ---
        (
            git_push
            >> Edge(label="backend/*", **EDGE_STEP)
            >> build_docker
            >> Edge(label="image", **EDGE_STEP)
            >> push_docker
            >> Edge(label="kubectl set image", **EDGE_STEP)
            >> deploy_k8s
        )

        # --- Flow: Frontend (Vite SPA) ---
        (
            git_push
            >> Edge(label="frontend/*", **EDGE_STEP)
            >> build_bun
            >> Edge(label="dist/", **EDGE_STEP)
            >> push_wrangler
            >> Edge(label="deploy", **EDGE_STEP)
            >> deploy_cf
        )

        # --- Flow: Lambda (SAM) ---
        (
            git_push
            >> Edge(label="lambda/*", **EDGE_STEP)
            >> build_sam
            >> Edge(label="zip", **EDGE_STEP)
            >> push_sam
            >> Edge(label="sam deploy", **EDGE_STEP)
            >> deploy_lambda
        )

        # --- Flow: Lambda layers (uv) ---
        (
            build_uv
            >> Edge(label="layer zip", color="#6B7280")
            >> push_s3
            >> Edge(label="update layer", color="#6B7280")
            >> deploy_lambda
        )


if __name__ == "__main__":
    deploy_flow()
    print("Done: out/reports/deploy_flow.png")
