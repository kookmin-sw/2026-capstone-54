"""1:1 섹션 ViewSet 베이스.

`PUT /sections/<name>/` → upsert. URL 매핑: `as_view({"put": "upsert"})`.
서브클래스는 `request_serializer`, `response_serializer`, `upsert_service` 를 정의한다.
"""

from rest_framework.response import Response

from .resume_section_viewset_base import ResumeSectionViewSetBase


class ResumeSingletonSectionViewSetBase(ResumeSectionViewSetBase):
  """1:1 섹션 upsert ViewSet 베이스."""

  request_serializer = None
  response_serializer = None
  upsert_service = None

  def upsert(self, request, resume_uuid: str):
    """1:1 섹션 upsert (존재하면 갱신, 없으면 생성)."""
    resume = self.get_resume()
    serializer = self.request_serializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    instance = self.upsert_service(resume=resume, **serializer.validated_data).perform()
    return Response(self.response_serializer(instance).data)
