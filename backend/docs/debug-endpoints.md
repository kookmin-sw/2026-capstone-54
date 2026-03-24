# 개발 전용 Slack 알림 테스트 엔드포인트

`DEBUG=True` 환경에서만 활성화되는 엔드포인트입니다.
운영 환경에서는 자동으로 비활성화됩니다.

## 엔드포인트 목록

### `GET /debug/error/`

의도적으로 500 에러를 발생시켜 **Slack 에러 알림**을 테스트합니다.

- DRF `APIView` 로 구현되어 `custom_exception_handler` 를 경유한다
- `RuntimeError`를 raise하여 `SLACK_CHANNEL_ERROR` 채널로 알림 전송
- 메인 메시지: 에러 요약 (에러 유형, 메시지, 경로, 개발자)
- 스레드 답글: 전체 traceback

> 일반 Django view 함수로 구현하면 DRF exception handler 를 거치지 않아 Slack 알림이 발송되지 않는다.

### `GET /debug/nplusone/`

N+1 쿼리를 의도적으로 발생시켜 **nplusone + Slack 알림**을 테스트합니다.

- `EmailVerificationCode.objects.all()` 조회 후 각 row에서 `.user`에 접근
- `select_related` 없이 접근하므로 row 수만큼 User 쿼리가 추가 발생
- nplusone 미들웨어가 감지 → `SLACK_CHANNEL_NPLUSONE` 채널로 알림 전송
- 메인 메시지: 감지된 모델/필드 요약
- 스레드 답글: stacktrace + SQL 쿼리 로그

> DB에 `EmailVerificationCode` 데이터가 없으면 N+1이 발생하지 않습니다.
> `python manage.py shell`에서 더미 데이터를 생성하거나 기존 데이터를 활용하세요.

## 전제 조건

`.env`에 아래 값이 설정되어 있어야 Slack 메시지가 실제로 전송됩니다.

```
SLACK_BOT_TOKEN=xoxb-...
SLACK_CHANNEL_ERROR=C0123456789
SLACK_CHANNEL_NPLUSONE=C0123456789
DEVELOPER=your-name
```

미설정 시 Slack 전송은 조용히 건너뛰고 로그만 남깁니다.

## 구현 위치

`webapp/config/urls.py` — `if settings.DEBUG:` 블록 내부에 정의되어 있습니다.
제거할 때는 해당 블록 전체를 삭제하면 됩니다.

---

## 실제 구현 코드 (`webapp/config/urls.py`)

`/debug/error/` 는 DRF `APIView` 로 구현해야 `custom_exception_handler` 를 경유하여 Slack 알림이 전송된다.
일반 Django view 함수는 DRF exception handler 를 거치지 않으므로 알림이 발송되지 않는다.

```python
if settings.DEBUG:
  from rest_framework.views import APIView
  from rest_framework.request import Request
  from rest_framework.response import Response as DRFResponse

  class DebugErrorView(APIView):
    """의도적으로 500 에러를 발생시켜 Slack 에러 알림을 테스트한다."""
    def get(self, request: Request):
      raise RuntimeError("디버그용 의도적 에러 — Slack 에러 알림 테스트")

  def debug_nplusone(request):
    from django.http import HttpResponse
    from users.models import EmailVerificationCode
    codes = list(EmailVerificationCode.objects.all())
    for code in codes:
      _ = code.user.email  # select_related 없이 접근 → N+1 발생
    return HttpResponse(f"N+1 테스트 완료 — {len(codes)}건 조회")

  urlpatterns += [
    re_path(r"^media/(?P<path>.*)$", serve, {"document_root": settings.MEDIA_ROOT}),
    re_path(r"^static/(?P<path>.*)$", serve, {"document_root": settings.STATIC_ROOT}),
    path("debug/error/", DebugErrorView.as_view()),
    path("debug/nplusone/", debug_nplusone),
  ]
```
