"""직군 분류 섹션 ViewSet — 응답 포맷이 다른 singleton 변형."""

from api.v1.resumes.serializers import ResumeJobCategoryRequestSerializer
from drf_spectacular.utils import extend_schema
from rest_framework.response import Response
from resumes.services import UpdateResumeJobCategoryService

from .resume_section_viewset_base import ResumeSectionViewSetBase


@extend_schema(tags=["이력서 섹션"])
class ResumeJobCategorySectionViewSet(ResumeSectionViewSetBase):
  """직군 분류 upsert. 응답은 {category: {...}} 형태."""

  def upsert(self, request, resume_uuid: str):
    resume = self.get_resume()
    serializer = ResumeJobCategoryRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    category = UpdateResumeJobCategoryService(resume=resume, name=serializer.validated_data.get("name") or "").perform()
    if category is None:
      return Response({"category": None})
    return Response({"category": {"uuid": str(category.uuid), "name": category.name, "emoji": category.emoji}})
