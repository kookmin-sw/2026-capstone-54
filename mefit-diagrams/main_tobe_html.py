"""main_tobe_html.py
====================

graphviz/diagrams 의 자동 레이아웃 한계 (빈 공간, 작은 아이콘, 긴 엣지) 를
**HTML + AWS 공식 아이콘 + Playwright 캡처** 방식으로 해결한다.

To-Be 전체 인프라를 **PPT 16:9 슬라이드 (1920×1080)** 에 1:1 매핑된 PNG 로 출력.
모든 노드는 픽셀 단위 절대 위치, 모든 엣지는 SVG path 로 명시.

핵심:
- VPC + Multi-AZ (Public / Private App / Private DB)
- EKS managed control plane + Backend Domain Microservices (per-domain Deployments)
- RDS Multi-AZ (Primary + Standby + Read Replica)
- ElastiCache Redis Cluster Mode (3 shards × P+R)
- 이벤트 기반 영상 파이프라인
- 생략 없음: 50+ 노드 모두 포함

출력: full_infrastructure_tobe_compact.png  (1920×1080)
"""

import asyncio
import base64
from pathlib import Path

from playwright.async_api import async_playwright

ROOT = Path(__file__).parent
OUTPUT_PNG = ROOT / "full_infrastructure_tobe_compact.png"
ICON_DIR = ROOT / ".venv/lib/python3.14/site-packages/resources"

CANVAS_W = 1920
CANVAS_H = 1080


def icon(rel_path: str) -> str:
    full = ICON_DIR / rel_path
    if not full.exists():
        raise FileNotFoundError(f"icon not found: {full}")
    data = full.read_bytes()
    b64 = base64.b64encode(data).decode("ascii")
    return f"data:image/png;base64,{b64}"


ICONS = {
    "user": icon("onprem/client/client.png"),
    "cloudflare": icon("saas/cdn/cloudflare.png"),
    "nextjs": icon("programming/framework/nextjs.png"),
    "route53": icon("aws/network/route-53.png"),
    "waf": icon("aws/security/waf.png"),
    "acm": icon("aws/security/certificate-manager.png"),
    "alb": icon("aws/network/elb-application-load-balancer.png"),
    "nat": icon("aws/network/nat-gateway.png"),
    "privatelink": icon("aws/network/privatelink.png"),
    "eks": icon("aws/compute/elastic-kubernetes-service.png"),
    "ecr": icon("aws/compute/ec2-container-registry.png"),
    "lambda": icon("aws/compute/lambda-function.png"),
    "deploy": icon("k8s/compute/deploy.png"),
    "ing": icon("k8s/network/ing.png"),
    "rds": icon("aws/database/rds-postgresql-instance.png"),
    "elasticache": icon("aws/database/elasticache-for-redis.png"),
    "s3": icon("aws/storage/simple-storage-service-s3.png"),
    "sns": icon("aws/integration/simple-notification-service-sns.png"),
    "sqs": icon("aws/integration/simple-queue-service-sqs.png"),
    "kms": icon("aws/security/key-management-service.png"),
    "secrets": icon("aws/security/secrets-manager.png"),
    "cloudwatch": icon("aws/management/cloudwatch.png"),
    "backup": icon("aws/storage/backup.png"),
}


CLUSTERS = [
    dict(id="client", label="Client + Edge",
         x=10, y=10, w=1900, h=110, bg="#F0F7FF", border="#1976D2"),

    dict(id="vpc", label="VPC 10.0.0.0/16  (Multi-AZ  a / b / c)",
         x=10, y=130, w=1180, h=940, bg="#EAF3FF", border="#1976D2", thick=True),

    dict(id="public", label="Public Subnet",
         x=25, y=170, w=560, h=85, bg="#FFF7E6", border="#F57C00", dashed=True),
    dict(id="vpce", label="VPC Endpoints",
         x=600, y=170, w=575, h=85, bg="#E8F5E9", border="#388E3C"),

    dict(id="private_app", label="Private App Subnet — EKS Multi-AZ",
         x=25, y=270, w=1150, h=505, bg="#E8F5E9", border="#388E3C", thick=True),
    dict(id="eks", label="EKS Cluster (Control Plane managed)",
         x=35, y=305, w=1130, h=460, bg="#EDE7F6", border="#7E57C2", thick=True),
    dict(id="ms", label="Backend Domain Microservices  (per-domain Deployments)",
         x=45, y=340, w=765, h=300, bg="#FFF3E0", border="#FB8C00",
         dashed=True, thick=True),
    dict(id="specialized", label="Specialized Services",
         x=820, y=340, w=335, h=300, bg="#F3E5F5", border="#7E57C2"),

    dict(id="rds_sub", label="Private DB Subnet — RDS Multi-AZ",
         x=25, y=785, w=560, h=280, bg="#FCE4EC", border="#E91E63"),
    dict(id="redis_sub", label="Private DB Subnet — ElastiCache Cluster Mode",
         x=600, y=785, w=575, h=280, bg="#FCE4EC", border="#E91E63"),

    dict(id="s3", label="S3  (KMS, Versioned)",
         x=1200, y=130, w=710, h=190, bg="#F9FBE7", border="#9CCC65"),
    dict(id="event", label="Event Pipeline  (S3 → SNS → SQS → Lambda)",
         x=1200, y=335, w=710, h=395, bg="#FFF8E1", border="#FFB300"),
    dict(id="managed", label="AWS Managed Services",
         x=1200, y=745, w=710, h=320, bg="#FCE4EC", border="#E91E63"),
]


N = [
    dict(id="user", label="User Browser", icon="user",
         x=30, y=30, cluster="client"),
    dict(id="cf", label="Cloudflare<br/>DNS + CDN", icon="cloudflare",
         x=180, y=30, cluster="client"),
    dict(id="next", label="Next.js<br/>(Pages)", icon="nextjs",
         x=350, y=30, cluster="client"),
    dict(id="r53", label="Route 53<br/>alias", icon="route53",
         x=520, y=30, cluster="client"),
    dict(id="waf", label="AWS WAF<br/>OWASP rules", icon="waf",
         x=690, y=30, cluster="client"),
    dict(id="acm", label="ACM<br/>TLS *.mefit.kr", icon="acm",
         x=860, y=30, cluster="client"),

    dict(id="alb", label="ALB<br/>path-routed", icon="alb",
         x=70, y=190, cluster="public"),
    dict(id="nat", label="NAT GW<br/>× AZ", icon="nat",
         x=380, y=190, cluster="public"),

    dict(id="vpce_s3", label="S3<br/>Gateway", icon="privatelink",
         x=625, y=190, cluster="vpce"),
    dict(id="vpce_sqs", label="SQS<br/>Interface", icon="privatelink",
         x=765, y=190, cluster="vpce"),
    dict(id="vpce_ecr", label="ECR<br/>Interface", icon="privatelink",
         x=905, y=190, cluster="vpce"),
    dict(id="vpce_sm", label="Secrets<br/>Interface", icon="privatelink",
         x=1045, y=190, cluster="vpce"),

    dict(id="ing", label="Ingress<br/>path-based", icon="ing",
         x=55, y=665, cluster="eks"),
    dict(id="eks_cp", label="EKS Control<br/>Plane", icon="eks",
         x=200, y=665, cluster="eks"),

    dict(id="svc_auth", label="auth-svc<br/>/auth /users", icon="deploy",
         x=70, y=370, cluster="ms"),
    dict(id="svc_resume", label="resume-svc<br/>/resumes", icon="deploy",
         x=210, y=370, cluster="ms"),
    dict(id="svc_jd", label="jd-svc<br/>/job-desc", icon="deploy",
         x=350, y=370, cluster="ms"),
    dict(id="svc_interview", label="interview-svc<br/>/interviews", icon="deploy",
         x=490, y=370, cluster="ms"),
    dict(id="svc_ticket", label="ticket-svc<br/>/tickets /sub", icon="deploy",
         x=630, y=370, cluster="ms"),
    dict(id="svc_profile", label="profile-svc<br/>/profiles /ach", icon="deploy",
         x=70, y=505, cluster="ms"),
    dict(id="svc_notif", label="notification-svc<br/>SSE", icon="deploy",
         x=210, y=505, cluster="ms"),

    dict(id="voice", label="voice-api<br/>FastAPI TTS/STT", icon="deploy",
         x=835, y=370, cluster="specialized"),
    dict(id="async_w", label="Async × 4<br/>celery / sqs<br/>scraper / beat", icon="deploy",
         x=975, y=370, cluster="specialized"),
    dict(id="ai_w", label="AI / Reporting × 2<br/>resume-analyzer<br/>report-worker", icon="deploy",
         x=835, y=505, cluster="specialized"),
    dict(id="flower", label="Flower<br/>(admin)", icon="deploy",
         x=1010, y=505, cluster="specialized"),

    dict(id="rds_p", label="RDS Primary<br/>(AZ-a)", icon="rds",
         x=60, y=815, cluster="rds_sub"),
    dict(id="rds_s", label="RDS Standby<br/>(AZ-b, sync)", icon="rds",
         x=240, y=815, cluster="rds_sub"),
    dict(id="rds_rr", label="RDS Read Replica<br/>(AZ-c, async)", icon="rds",
         x=420, y=815, cluster="rds_sub"),

    dict(id="r1p", label="Shard 1<br/>Primary", icon="elasticache",
         x=620, y=810, cluster="redis_sub"),
    dict(id="r1r", label="Shard 1<br/>Replica", icon="elasticache",
         x=720, y=810, cluster="redis_sub"),
    dict(id="r2p", label="Shard 2<br/>Primary", icon="elasticache",
         x=820, y=810, cluster="redis_sub"),
    dict(id="r2r", label="Shard 2<br/>Replica", icon="elasticache",
         x=920, y=810, cluster="redis_sub"),
    dict(id="r3p", label="Shard 3<br/>Primary", icon="elasticache",
         x=1020, y=810, cluster="redis_sub"),
    dict(id="r3r", label="Shard 3<br/>Replica", icon="elasticache",
         x=1120, y=810, cluster="redis_sub"),

    dict(id="s3_in", label="video-files<br/>.webm input", icon="s3",
         x=1220, y=160, cluster="s3"),
    dict(id="s3_out", label="output × 4<br/>mp4/jpg/wav/16k", icon="s3",
         x=1450, y=160, cluster="s3"),
    dict(id="s3_be", label="be-files<br/>app assets", icon="s3",
         x=1680, y=160, cluster="s3"),

    dict(id="sns", label="SNS<br/>video-uploaded", icon="sns",
         x=1220, y=365, cluster="event"),
    dict(id="sqs_fan", label="SQS Fan-out × 3<br/>+ DLQ each", icon="sqs",
         x=1450, y=365, cluster="event"),
    dict(id="lb_media", label="Media Lambda × 3<br/>video / frame / audio", icon="lambda",
         x=1680, y=365, cluster="event"),
    dict(id="sqs_step", label="SQS step-complete<br/>+ face-q + DLQs", icon="sqs",
         x=1330, y=540, cluster="event"),
    dict(id="lb_ml", label="ML Lambda × 2<br/>face / voice", icon="lambda",
         x=1570, y=540, cluster="event"),

    dict(id="ecr", label="ECR<br/>image registry", icon="ecr",
         x=1220, y=775, cluster="managed"),
    dict(id="sm", label="Secrets Mgr<br/>+ ESO sync", icon="secrets",
         x=1380, y=775, cluster="managed"),
    dict(id="kms", label="KMS CMK<br/>SSE-KMS", icon="kms",
         x=1540, y=775, cluster="managed"),
    dict(id="backup", label="AWS Backup<br/>cross-region", icon="backup",
         x=1700, y=775, cluster="managed"),
    dict(id="cw", label="CloudWatch<br/>+ X-Ray + Insights", icon="cloudwatch",
         x=1380, y=940, cluster="managed"),
]


def node_center(nid: str) -> tuple[int, int]:
    n = next(x for x in N if x["id"] == nid)
    return n["x"] + 45, n["y"] + 45


E = [
    ("user", "cf", "DNS", "#4B5563", False),
    ("cf", "next", "static (Pages)", "#4B5563", False),
    ("cf", "r53", "api.mefit.kr", "#4B5563", False),
    ("r53", "waf", "", "#4B5563", False),
    ("waf", "alb", "", "#4B5563", False),
    ("acm", "alb", "TLS cert", "#9CA3AF", True),

    ("next", "s3_in", "presigned upload", "darkgreen", False),
    ("next", "waf", "API call", "#4B5563", False),

    ("alb", "ing", "HTTPS 443", "#1976D2", False),

    ("ing", "svc_auth", "/auth/*", "#FB8C00", True),
    ("ing", "svc_resume", "", "#FB8C00", True),
    ("ing", "svc_jd", "", "#FB8C00", True),
    ("ing", "svc_interview", "", "#FB8C00", True),
    ("ing", "svc_ticket", "", "#FB8C00", True),
    ("ing", "svc_profile", "", "#FB8C00", True),
    ("ing", "svc_notif", "", "#FB8C00", True),
    ("ing", "voice", "/voice/*", "#4B5563", False),

    ("svc_auth", "rds_p", "write", "#1E88E5", False),
    ("svc_resume", "rds_p", "", "#1E88E5", False),
    ("svc_interview", "rds_p", "", "#1E88E5", False),
    ("svc_ticket", "rds_p", "", "#1E88E5", False),
    ("svc_profile", "rds_p", "", "#1E88E5", False),
    ("svc_notif", "rds_p", "", "#1E88E5", False),
    ("svc_jd", "rds_p", "", "#1E88E5", False),
    ("async_w", "rds_p", "", "#1E88E5", False),
    ("ai_w", "rds_rr", "read", "#1E88E5", True),

    ("rds_p", "rds_s", "sync repl", "#1E88E5", False),
    ("rds_p", "rds_rr", "async repl", "#1E88E5", True),

    ("svc_auth", "r1p", "hash slot", "#E53935", False),
    ("svc_interview", "r2p", "", "#E53935", False),
    ("svc_notif", "r3p", "", "#E53935", False),
    ("async_w", "r2p", "", "#E53935", False),
    ("ai_w", "r3p", "", "#E53935", False),
    ("r1p", "r1r", "async repl", "#E53935", True),
    ("r2p", "r2r", "async repl", "#E53935", True),
    ("r3p", "r3r", "async repl", "#E53935", True),

    ("s3_in", "sns", "ObjectCreated", "darkgreen", False),
    ("sns", "sqs_fan", "fan-out", "#4B5563", False),
    ("sqs_fan", "lb_media", "consume", "#4B5563", False),
    ("lb_media", "s3_out", "write", "darkgreen", False),
    ("lb_media", "sqs_step", "complete", "darkblue", False),
    ("sqs_step", "lb_ml", "face-q", "purple", False),
    ("lb_ml", "sqs_step", "complete", "darkblue", False),
    ("sqs_step", "vpce_sqs", "long poll", "darkblue", False),
    ("vpce_sqs", "async_w", "private", "#43A047", True),
    ("ai_w", "lb_ml", "boto3 invoke", "#4B5563", False),
    ("lb_ml", "s3_out", "read scaled audio", "darkgreen", True),

    ("svc_resume", "vpce_s3", "private", "#43A047", True),
    ("vpce_s3", "s3_be", "", "#43A047", True),
    ("vpce_ecr", "ecr", "", "#43A047", True),
    ("vpce_sm", "sm", "", "#43A047", True),

    ("kms", "s3_in", "encrypt", "#9CA3AF", True),
    ("kms", "sqs_fan", "encrypt", "#9CA3AF", True),
    ("rds_p", "backup", "snapshot", "#9CA3AF", True),
    ("async_w", "nat", "egress", "#FB8C00", True),
    ("svc_auth", "cw", "logs/metrics", "#6B7280", True),
    ("lb_media", "cw", "", "#6B7280", True),
    ("eks_cp", "ing", "", "#9CA3AF", True),
]


def build_svg_edges() -> str:
    parts = []
    parts.append("""
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill="#4B5563"/>
          </marker>
        </defs>
    """)
    for src, dst, label, color, dashed in E:
        x1, y1 = node_center(src)
        x2, y2 = node_center(dst)
        dash = ' stroke-dasharray="6 4"' if dashed else ""
        parts.append(
            f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" '
            f'stroke="{color}" stroke-width="1.8"{dash} '
            f'marker-end="url(#arr)" opacity="0.75"/>'
        )
        if label:
            mx, my = (x1 + x2) // 2, (y1 + y2) // 2
            parts.append(
                f'<text x="{mx}" y="{my - 4}" font-size="11" '
                f'fill="{color}" text-anchor="middle" '
                f'paint-order="stroke" stroke="white" stroke-width="3">{label}</text>'
            )
    return "\n".join(parts)


def build_html() -> str:
    cluster_html = []
    for c in CLUSTERS:
        style = (
            f"position:absolute;left:{c['x']}px;top:{c['y']}px;"
            f"width:{c['w']}px;height:{c['h']}px;"
            f"background:{c['bg']};border:{'2.5' if c.get('thick') else '1.5'}px "
            f"{'dashed' if c.get('dashed') else 'solid'} {c['border']};"
            f"border-radius:8px;box-sizing:border-box;"
        )
        cluster_html.append(
            f'<div style="{style}"><div class="ctitle" '
            f'style="color:{c["border"]}">{c["label"]}</div></div>'
        )

    node_html = []
    for n in N:
        ic = ICONS[n["icon"]]
        node_html.append(
            f'<div class="node" style="left:{n["x"]}px;top:{n["y"]}px">'
            f'<img src="{ic}" />'
            f'<div class="nlabel">{n["label"]}</div>'
            f"</div>"
        )

    return f"""<!doctype html>
<html><head><meta charset="utf-8"><style>
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
body {{
  width: {CANVAS_W}px;
  height: {CANVAS_H}px;
  font-family: -apple-system, "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif;
  background: #FFFFFF;
  position: relative;
  overflow: hidden;
}}
.canvas {{ position: relative; width: 100%; height: 100%; }}
.ctitle {{
  position: absolute;
  top: 4px; left: 10px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.2px;
  background: rgba(255,255,255,0.85);
  padding: 1px 6px;
  border-radius: 3px;
}}
.node {{
  position: absolute;
  width: 90px;
  text-align: center;
  z-index: 5;
}}
.node img {{
  display: block;
  margin: 0 auto;
  width: 56px;
  height: 56px;
  object-fit: contain;
}}
.nlabel {{
  margin-top: 2px;
  font-size: 11px;
  line-height: 1.15;
  color: #1F2937;
  font-weight: 500;
  background: rgba(255,255,255,0.92);
  border-radius: 3px;
  padding: 1px 3px;
  display: inline-block;
  max-width: 100px;
}}
svg.edges {{
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  pointer-events: none;
  z-index: 3;
}}
.title {{
  position: absolute;
  bottom: 8px; right: 16px;
  font-size: 14px;
  font-weight: 700;
  color: #6B7280;
}}
</style></head>
<body>
<div class="canvas">
  {"".join(cluster_html)}
  <svg class="edges" viewBox="0 0 {CANVAS_W} {CANVAS_H}" preserveAspectRatio="none">
    {build_svg_edges()}
  </svg>
  {"".join(node_html)}
  <div class="title">MeFit Full Infrastructure (To-Be) · PPT 16:9</div>
</div>
</body></html>
"""


async def capture():
    html = build_html()
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(
            viewport={"width": CANVAS_W, "height": CANVAS_H},
            device_scale_factor=2,
        )
        page = await ctx.new_page()
        await page.set_content(html, wait_until="load")
        await page.screenshot(
            path=str(OUTPUT_PNG),
            clip={"x": 0, "y": 0, "width": CANVAS_W, "height": CANVAS_H},
            omit_background=False,
        )
        await browser.close()
    print(f"Wrote {OUTPUT_PNG} ({OUTPUT_PNG.stat().st_size:,} bytes)")


if __name__ == "__main__":
    asyncio.run(capture())
