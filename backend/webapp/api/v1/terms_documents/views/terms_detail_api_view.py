from common.permissions import AllowAny
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from rest_framework.exceptions import NotFound
from rest_framework.response import Response

from api.v1.terms_documents.serializers import TermsDetailSerializer
from terms_documents.models import TermsDocument


@extend_schema(tags=["약관"])
class TermsDetailAPIView(BaseAPIView):
  """공개된 약관 상세를 반환한다."""

  permission_classes = [AllowAny]
  serializer_class = TermsDetailSerializer

  @extend_schema(
    summary="약관 상세 조회",
    responses={200: TermsDetailSerializer},
  )
  def get(self, request, pk):
    try:
      terms_document = TermsDocument.objects.published().get(id=pk)
    except TermsDocument.DoesNotExist:
      raise NotFound(detail="존재하지 않거나 공개되지 않은 약관입니다.")

    serializer = TermsDetailSerializer(terms_document)
    return Response(serializer.data)
