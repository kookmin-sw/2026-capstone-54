"""Resume 섹션 ViewSet 공통 베이스.

URL: /api/v1/resumes/<resume_uuid>/sections/<section>/...

모든 섹션 ViewSet 은 이 베이스를 상속해 resume 스코핑과 권한을 공유한다.
"""

from common.exceptions import NotFoundException
from common.permissions import IsEmailVerified
from common.views import BaseGenericViewSet
from resumes.models import Resume


class ResumeSectionViewSetBase(BaseGenericViewSet):
  """현재 사용자 소유 Resume 아래의 섹션을 다루는 ViewSet 베이스."""

  permission_classes = [IsEmailVerified]
  lookup_field = "uuid"

  def get_resume(self) -> Resume:
    try:
      return Resume.objects.get(
        pk=self.kwargs["resume_uuid"],
        user=self.current_user,
        deleted_at__isnull=True,
      )
    except Resume.DoesNotExist:
      raise NotFoundException("이력서를 찾을 수 없습니다.")
