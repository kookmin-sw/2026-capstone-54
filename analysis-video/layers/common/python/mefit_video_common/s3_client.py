import boto3
from mefit_video_common.config import REGION, S3_ENDPOINT_URL

_client = None


def get_s3_client():
    global _client
    if _client is None:
        kwargs = {"region_name": REGION}
        if S3_ENDPOINT_URL:
            kwargs["endpoint_url"] = S3_ENDPOINT_URL
        _client = boto3.client("s3", **kwargs)
    return _client


def download_to_tmp(bucket: str, key: str) -> str:
    import os, hashlib

    tmp_path = f"/tmp/{hashlib.md5(key.encode()).hexdigest()}_{os.path.basename(key)}"
    get_s3_client().download_file(bucket, key, tmp_path)
    return tmp_path


def upload_from_tmp(
    tmp_path: str, bucket: str, key: str, content_type: str = "application/octet-stream"
) -> None:
    get_s3_client().upload_file(
        tmp_path, bucket, key, ExtraArgs={"ContentType": content_type}
    )
