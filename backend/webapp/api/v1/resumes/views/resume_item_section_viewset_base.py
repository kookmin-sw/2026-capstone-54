"""1:N 섹션 ViewSet 베이스.

서브클래스는 `model`, `request_serializer`, `response_serializer`,
`upsert_service`, `delete_service` 를 정의하면 list/create/update/destroy 가 자동 작동한다.
"""

from rest_framework import status
from rest_framework.response import Response

from .resume_section_viewset_base import ResumeSectionViewSetBase


class ResumeItemSectionViewSetBase(ResumeSectionViewSetBase):
  """1:N 섹션 CRUD ViewSet 베이스 (섹션당 한 클래스)."""

  model = None
  request_serializer = None
  response_serializer = None
  upsert_service = None
  delete_service = None

  def get_queryset(self):
    return self.model.objects.filter(resume=self.get_resume())

  def list(self, request, resume_uuid: str):
    """섹션 목록. Meta.ordering / display_order 순."""
    return Response(self.response_serializer(self.get_queryset(), many=True).data)

  def create(self, request, resume_uuid: str):
    """섹션 아이템 추가."""
    resume = self.get_resume()
    serializer = self.request_serializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    instance = self.upsert_service(resume=resume, **serializer.validated_data).perform()
    return Response(self.response_serializer(instance).data, status=status.HTTP_201_CREATED)

  def update(self, request, resume_uuid: str, uuid: str):
    """섹션 아이템 수정."""
    resume = self.get_resume()
    serializer = self.request_serializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    instance = self.upsert_service(resume=resume, uuid=uuid, **serializer.validated_data).perform()
    return Response(self.response_serializer(instance).data)

  def destroy(self, request, resume_uuid: str, uuid: str):
    """섹션 아이템 삭제."""
    resume = self.get_resume()
    self.delete_service(resume=resume, uuid=uuid).perform()
    return Response(status=status.HTTP_204_NO_CONTENT)
