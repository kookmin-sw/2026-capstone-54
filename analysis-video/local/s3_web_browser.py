#!/usr/bin/env python3
"""S3 Web Browser for MeFit analysis-video LocalStack development."""

import http.server
import json
import os
import urllib.parse
from datetime import datetime

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

ENDPOINT = os.environ.get("S3_ENDPOINT_URL", "http://localhost:4566")
PUBLIC_ENDPOINT = os.environ.get("S3_PUBLIC_ENDPOINT_URL", "http://localhost:4566")
REGION = os.environ.get("REGION", "us-east-1")
PORT = int(os.environ.get("S3_BROWSER_PORT", "9999"))

BUCKETS = [
    "pj-kmucd1-04-mefit-video-files",
    "pj-kmucd1-04-mefit-scaled-video-files",
    "pj-kmucd1-04-mefit-video-frame-files",
    "pj-kmucd1-04-mefit-audio-files",
    "pj-kmucd1-04-mefit-scaled-audio-files",
]

_s3_config = Config(s3={"addressing_style": "path"}, signature_version="s3v4")

s3 = boto3.client(
    "s3",
    endpoint_url=ENDPOINT,
    region_name=REGION,
    aws_access_key_id="dummy",
    aws_secret_access_key="dummy",
    config=_s3_config,
)

s3_public = boto3.client(
    "s3",
    endpoint_url=PUBLIC_ENDPOINT,
    region_name=REGION,
    aws_access_key_id="dummy",
    aws_secret_access_key="dummy",
    config=_s3_config,
)


def human_size(size_bytes):
    if size_bytes == 0:
        return "0.0 B"
    for unit in ["B", "KB", "MB", "GB"]:
        if size_bytes < 1024:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024
    return f"{size_bytes:.1f} TB"


HTML_TEMPLATE = """<!DOCTYPE html>
<html>
<head>
    <title>S3 Browser</title>
    <meta http-equiv="refresh" content="30">
    <style>
        body { background: #1a1a2e; color: #e0e0e0; font-family: monospace; margin: 2rem; }
        .card { background: #16213e; padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem; }
        a { color: #0991B2; text-decoration: none; }
        a:hover { text-decoration: underline; }
        button, .btn { background: #0f3460; color: white; border: none; padding: 4px 8px; cursor: pointer; border-radius: 4px; font-family: monospace; font-size: 0.9rem; text-decoration: none; display: inline-block; }
        button:hover, .btn:hover { background: #0991B2; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #0f3460; padding-bottom: 1rem; margin-bottom: 1rem; }
        .bucket-title { font-size: 1.2rem; font-weight: bold; margin-bottom: 0.5rem; }
        table { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.95rem; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #0f3460; }
        th { color: #0991B2; }
        .actions { display: flex; gap: 8px; }
        .media-container { margin-top: 1rem; background: #0f3460; padding: 1rem; border-radius: 8px; text-align: center; }
        video, audio, img { max-width: 100%; max-height: 70vh; }
        form { margin: 0; padding: 0; display: inline; }
        .empty { color: #a0a0a0; font-style: italic; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📦 LocalStack S3 Browser</h1>
        <a href="/" class="btn">[Home]</a>
    </div>
    {content}
</body>
</html>"""


class S3BrowserHandler(http.server.BaseHTTPRequestHandler):
    def send_html(self, content):
        self.send_response(200)
        self.send_header("Content-type", "text/html; charset=utf-8")
        self.end_headers()
        html = HTML_TEMPLATE.replace("{content}", content)
        self.wfile.write(html.encode("utf-8"))

    def send_redirect(self, location):
        self.send_response(302)
        self.send_header("Location", location)
        self.end_headers()

    def get_presigned_url(self, bucket, key):
        return s3_public.generate_presigned_url(
            "get_object", Params={"Bucket": bucket, "Key": key}, ExpiresIn=3600
        )

    def render_home(self):
        content = ""
        for bucket in BUCKETS:
            try:
                s3.head_bucket(Bucket=bucket)
            except ClientError as e:
                error_code = int(e.response.get("Error", {}).get("Code", 0))
                if error_code == 404:
                    try:
                        s3.create_bucket(Bucket=bucket)
                    except Exception:
                        pass

            try:
                paginator = s3.get_paginator("list_objects_v2")
                pages = paginator.paginate(Bucket=bucket)
                count = 0
                size = 0
                for page in pages:
                    if "Contents" in page:
                        count += len(page["Contents"])
                        size += sum(obj["Size"] for obj in page["Contents"])

                content += f"""
                <div class="card">
                    <div class="bucket-title">
                        <a href="/bucket/{bucket}">🪣 {bucket}</a>
                    </div>
                    <div>{count} files, {human_size(size)} total</div>
                </div>
                """
            except Exception as e:
                content += f"""
                <div class="card">
                    <div class="bucket-title">🪣 {bucket}</div>
                    <div style="color: #ff6b6b;">Error accessing bucket: {e}</div>
                </div>
                """
        self.send_html(content)

    def render_bucket(self, bucket):
        try:
            paginator = s3.get_paginator("list_objects_v2")
            pages = paginator.paginate(Bucket=bucket)

            rows = ""
            count = 0
            total_size = 0
            for page in pages:
                if "Contents" in page:
                    for obj in page["Contents"]:
                        count += 1
                        total_size += obj["Size"]
                        key = obj["Key"]
                        size = human_size(obj["Size"])
                        last_mod = obj["LastModified"].strftime("%Y-%m-%d %H:%M:%S")
                        safe_key = urllib.parse.quote(key, safe="")

                        rows += f"""
                        <tr>
                            <td>{key}</td>
                            <td>{size}</td>
                            <td>{last_mod}</td>
                            <td class="actions">
                                <a href="/preview/{bucket}/{safe_key}" class="btn">Preview</a>
                                <a href="/download/{bucket}/{safe_key}" class="btn">Download</a>
                                <form method="POST" action="/delete/{bucket}/{safe_key}" onsubmit="return confirm('Are you sure you want to delete {key}?');">
                                    <button style="background: #e94560;">Delete</button>
                                </form>
                            </td>
                        </tr>
                        """

            header = f"""
            <div class="card">
                <div class="bucket-title">🪣 {bucket}</div>
                <div>{count} files, {human_size(total_size)} total</div>
            </div>
            """

            if rows:
                content = (
                    header
                    + f"""
                <div class="card">
                    <table>
                        <tr>
                            <th>Key</th>
                            <th>Size</th>
                            <th>Last Modified</th>
                            <th>Actions</th>
                        </tr>
                        {rows}
                    </table>
                </div>
                """
                )
            else:
                content = (
                    header
                    + '<div class="card"><span class="empty">Bucket is empty.</span></div>'
                )
            self.send_html(content)
        except Exception as e:
            self.send_html(
                f'<div class="card" style="color: #ff6b6b;">Error: {e}</div>'
            )

    def render_preview(self, bucket, key):
        url = self.get_presigned_url(bucket, key)
        ext = key.lower().split(".")[-1] if "." in key else ""

        if ext in ["webm", "mp4"]:
            media_html = f'<video src="{url}" controls autoplay></video>'
        elif ext in ["wav", "mp3", "ogg", "m4a", "aac"]:
            media_html = f'<audio src="{url}" controls autoplay></audio>'
        elif ext in ["jpg", "jpeg", "png", "gif", "webp", "svg"]:
            media_html = f'<img src="{url}" />'
        else:
            media_html = f'<p>No preview available for .{ext} files.</p><br><a href="{url}" class="btn">Download File</a>'

        content = f'''
        <div class="card">
            <h2>Preview: {key}</h2>
            <div>Bucket: <a href="/bucket/{bucket}">{bucket}</a></div>
            <div class="media-container">
                {media_html}
            </div>
            <div style="margin-top: 1rem;">
                <a href="/bucket/{bucket}" class="btn">← Back to Bucket</a>
                <a href="{url}" class="btn">Download</a>
            </div>
        </div>
        '''
        self.send_html(content)

    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path

        if path == "/":
            self.render_home()
            return

        parts = path.strip("/").split("/")
        if len(parts) >= 2:
            action = parts[0]
            bucket = parts[1]
            key = urllib.parse.unquote("/".join(parts[2:]))

            if action == "bucket":
                self.render_bucket(bucket)
                return
            elif action == "preview" and key:
                self.render_preview(bucket, key)
                return
            elif action == "download" and key:
                url = self.get_presigned_url(bucket, key)
                self.send_redirect(url)
                return

        self.send_html('<div class="card">404 Not Found</div>')

    def do_POST(self):
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        parts = path.strip("/").split("/")

        if len(parts) >= 3 and parts[0] == "delete":
            bucket = parts[1]
            key = urllib.parse.unquote("/".join(parts[2:]))
            try:
                s3.delete_object(Bucket=bucket, Key=key)
            except Exception as e:
                print(f"Delete failed: {e}")

            self.send_redirect(f"/bucket/{bucket}")
            return

        self.send_redirect("/")


if __name__ == "__main__":
    server_address = ("", PORT)
    httpd = http.server.HTTPServer(server_address, S3BrowserHandler)
    print(f"🚀 Starting S3 Web Browser on http://localhost:{PORT}")
    print(f"📡 LocalStack Endpoint: {ENDPOINT}")
    print(f"🔗 Access via web browser: http://localhost:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\\nStopping server...")
        httpd.server_close()
