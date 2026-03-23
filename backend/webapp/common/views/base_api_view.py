from common.permissions import IsAuthenticated
from rest_framework.generics import GenericAPIView


class BaseAPIView(GenericAPIView):
  """인증 필수 API 뷰의 공통 베이스 클래스. current_user 프로퍼티를 제공한다."""
  permission_classes = [IsAuthenticated]

  @property
  def current_user(self):
    return self.request.user
