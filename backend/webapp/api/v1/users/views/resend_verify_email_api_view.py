from common.permissions import IsAuthenticated
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from rest_framework.response import Response


@extend_schema(tags=["사용자"])
class ResendVerifyEmailAPIView(BaseAPIView):
  """이메일 인증 재발송. 로그인된 미인증 유저에게 새 OTP 코드를 발송한다."""
  permission_classes = [IsAuthenticated]

  @extend_schema(
    summary="이메일 인증 재발송",
    request=None,
    responses={200: None},
  )
  def post(self, request):
    from users.services.resend_verify_email_service import ResendVerifyEmailService
    from users.tasks.resend_verify_email_task import RegisteredResendVerifyEmailTask

    # 쿨다운/이미 인증 여부는 동기적으로 검증 (예외 → HTTP 응답 변환 보장)
    ResendVerifyEmailService(user=request.user).validate()

    RegisteredResendVerifyEmailTask.delay(user_id=request.user.id)
    return Response({"detail": "인증 코드가 발송되었습니다."})
