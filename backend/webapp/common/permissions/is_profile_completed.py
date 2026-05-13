from common.exceptions import PermissionDeniedException
from rest_framework.permissions import BasePermission


class IsProfileCompleted(BasePermission):
  """이메일 인증 및 프로필 작성을 완료한 사용자만 접근 허용"""

  def has_permission(self, request, view):
    if not request.user or not request.user.is_authenticated:
      return False

    if not request.user.is_email_confirmed:
      raise PermissionDeniedException("이메일 인증이 필요합니다.")

    if not request.user.is_profile_completed:
      raise PermissionDeniedException("프로필 작성이 필요합니다.")

    return True
