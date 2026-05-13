"""Resume bundle JSON 을 storage(S3/S3Mock/media)에 저장하고 URL 을 반환한다.

면접/리포트 등 downstream 태스크에 'bundle URL' 만 넘기는 패턴의 진입점.
storage 는 Django default_storage 를 사용 → 개발은 S3Mock, 운영은 AWS S3.
"""

from __future__ import annotations

import json

from common.services import BaseService
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from resumes.models import Resume
from resumes.services.resume_parsed_data_bundle_service import ResumeParsedDataBundleService


class UploadResumeBundleService(BaseService):
  """Resume 정규화 정보를 JSON 으로 직렬화해 storage 에 저장하고 URL 을 반환."""

  required_value_kwargs = ["resume"]

  def execute(self) -> str:
    resume: Resume = self.kwargs["resume"]
    bundle = ResumeParsedDataBundleService(resume).build_dict()

    payload = json.dumps(bundle, ensure_ascii=False, default=str).encode("utf-8")
    key = f"resume_bundles/{resume.pk}.json"

    # 같은 이름이 있으면 덮어쓰기 위해 먼저 삭제
    if default_storage.exists(key):
      default_storage.delete(key)

    saved_key = default_storage.save(key, ContentFile(payload))
    return default_storage.url(saved_key)
