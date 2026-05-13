from common.exceptions import PermissionDeniedException
from rest_framework.permissions import BasePermission


class IsEmailVerified(BasePermission):
  """이메일 인증을 완료한 사용자만 접근 허용"""

  def has_permission(self, request, view):
    if not request.user or not request.user.is_authenticated:
      return False

    if not request.user.is_email_confirmed:
      raise PermissionDeniedException("이메일 인증이 필요합니다.")

    return True
