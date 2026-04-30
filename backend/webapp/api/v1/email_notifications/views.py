from common.permissions import IsAuthenticated
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from notifications.enums import EmailNotificationType
from notifications.services import (
  GetUserEmailNotificationSettingsService,
  UpdateUserEmailNotificationSettingsService,
)
from rest_framework.response import Response

from .serializers import (
  EmailNotificationSettingsResponseSerializer,
  UpdateEmailNotificationSettingsRequestSerializer,
)


@extend_schema(tags=["이메일 알림 설정"])
class EmailNotificationSettingsAPIView(BaseAPIView):
  """현재 사용자의 이메일 알림 동의 설정 조회/수정.

  Endpoint: `/api/v1/email-notifications/`
  - GET: 현재 동의 상태를 camelCase boolean 으로 반환.
  - PUT: 변경할 키만 전달 (부분 업데이트). 알 수 없는 키는 무시된다.
  """

  permission_classes = [IsAuthenticated]

  def _to_camel_response(self, settings) -> dict:
    consent_dict = settings.to_consent_dict()
    return {EmailNotificationType.camel_case_key(k): v for k, v in consent_dict.items()}

  @extend_schema(
    summary="이메일 알림 설정 조회",
    responses={200: EmailNotificationSettingsResponseSerializer},
  )
  def get(self, request):
    settings = GetUserEmailNotificationSettingsService(user=self.current_user).perform()
    payload = self._to_camel_response(settings)
    serializer = EmailNotificationSettingsResponseSerializer(payload)
    return Response(serializer.data)

  @extend_schema(
    summary="이메일 알림 설정 수정",
    request=UpdateEmailNotificationSettingsRequestSerializer,
    responses={200: EmailNotificationSettingsResponseSerializer},
  )
  def put(self, request):
    request_serializer = UpdateEmailNotificationSettingsRequestSerializer(data=request.data)
    request_serializer.is_valid(raise_exception=True)

    consents: dict[str, bool] = {}
    for camel_key, value in request_serializer.validated_data.items():
      member = EmailNotificationType.from_camel_case(camel_key)
      if member is None:
        continue
      consents[member.value] = value

    settings = UpdateUserEmailNotificationSettingsService(
      user=self.current_user,
      consents=consents,
    ).perform()

    payload = self._to_camel_response(settings)
    response_serializer = EmailNotificationSettingsResponseSerializer(payload)
    return Response(response_serializer.data)
