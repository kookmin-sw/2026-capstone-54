"""N:M 전체 교체 섹션 ViewSet 베이스.

`PUT /sections/<name>/` → 전체 교체. URL 매핑: `as_view({"put": "replace"})`.
서브클래스는 `request_serializer`, `replace_service`, 그리고
`build_service_kwargs(validated_data)` 를 정의한다.
"""

from rest_framework.response import Response

from .resume_section_viewset_base import ResumeSectionViewSetBase


class ResumeReplaceSectionViewSetBase(ResumeSectionViewSetBase):
  """N:M 섹션 전체 교체 ViewSet 베이스."""

  request_serializer = None
  replace_service = None

  def build_service_kwargs(self, validated_data: dict) -> dict:
    """replace_service 에 넘길 kwargs 를 구성한다. 서브클래스에서 override."""
    raise NotImplementedError

  def replace(self, request, resume_uuid: str):
    """섹션 전체 교체."""
    resume = self.get_resume()
    serializer = self.request_serializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    kwargs = self.build_service_kwargs(serializer.validated_data)
    self.replace_service(resume=resume, **kwargs).perform()
    return Response({"ok": True})
