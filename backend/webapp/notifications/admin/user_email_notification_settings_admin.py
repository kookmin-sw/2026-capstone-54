from django import forms
from django.contrib import admin, messages
from django.http import HttpRequest, HttpResponse, HttpResponseRedirect
from django.urls import path, reverse
from django.views.generic import TemplateView
from unfold.admin import ModelAdmin
from unfold.decorators import action
from unfold.views import UnfoldModelAdminViewMixin
from unfold.widgets import UnfoldAdminTextInputWidget

from ..enums import EmailNotificationType
from ..models import UserEmailNotificationSettings


class BroadcastEmailAdminForm(forms.Form):
  """관리자용 단체 발송 폼.

  - subject:        메일 헤더 제목.
  - title:          본문 상단 제목.
  - body_html:      본문 영역에 HTML 그대로 삽입된다 (관리자 입력 신뢰 가정).
  - target_user_ids: 비어있으면 동의자 전체 발송, 입력 시 콤마 구분 ID 목록만 발송.
  """

  subject = forms.CharField(
    label="이메일 제목",
    max_length=200,
    widget=UnfoldAdminTextInputWidget,
    help_text="이메일 헤더에 표시되는 제목입니다.",
  )
  title = forms.CharField(
    label="본문 제목",
    max_length=200,
    widget=UnfoldAdminTextInputWidget,
    help_text="이메일 본문 상단에 표시되는 제목입니다.",
  )
  body_html = forms.CharField(
    label="본문 (HTML 허용)",
    widget=forms.Textarea(attrs={
      "rows": 10,
      "class": "border-base-200 dark:border-base-800"
    }),
    help_text="HTML 태그가 그대로 렌더링됩니다. 관리자 입력 신뢰를 가정합니다.",
  )
  target_user_ids = forms.CharField(
    label="대상 사용자 ID",
    required=False,
    widget=UnfoldAdminTextInputWidget(attrs={"placeholder": "예: 1,2,3"}),
    help_text="콤마 구분 ID 목록. 비어있으면 동의 상태인 모든 사용자에게 발송됩니다.",
  )


class _BaseBroadcastEmailAdminView(UnfoldModelAdminViewMixin, TemplateView):
  """이메일 단체 발송 페이지 베이스.

  서브클래스가 `notification_type`, `title` 을 지정하고 `get_register_task()` 를 구현한다.
  """

  permission_required = ()
  template_name = "admin/notifications/user_email_notification_settings/broadcast.html"
  notification_type: EmailNotificationType
  title: str = ""

  def get_register_task(self):
    raise NotImplementedError

  def get_context_data(self, **kwargs):
    context = super().get_context_data(**kwargs)
    form = kwargs.get("form") or BroadcastEmailAdminForm(self.request.POST or None)
    context.update({
      "form": form,
      "notification_label": self.notification_type.label,
    })
    return context

  def post(self, request, *args, **kwargs):
    form = BroadcastEmailAdminForm(request.POST)
    if not form.is_valid():
      context = self.get_context_data(form=form)
      return self.render_to_response(context)

    opted_in_field = EmailNotificationType.opted_in_field(self.notification_type.value)
    raw = form.cleaned_data.get("target_user_ids", "").strip()

    base_qs = UserEmailNotificationSettings.objects.filter(
      **{
        f"{opted_in_field}__isnull": False
      },
      user__is_active=True,
    ).exclude(user__email="")
    if raw:
      try:
        ids = [int(x.strip()) for x in raw.split(",") if x.strip()]
      except ValueError:
        messages.error(request, "사용자 ID는 콤마 구분 정수여야 합니다.")
        context = self.get_context_data(form=form)
        return self.render_to_response(context)
      base_qs = base_qs.filter(user_id__in=ids)

    user_ids = list(base_qs.values_list("user_id", flat=True))

    register_task = self.get_register_task()
    for user_id in user_ids:
      register_task.delay(
        user_id=user_id,
        subject=form.cleaned_data["subject"],
        title=form.cleaned_data["title"],
        body_html=form.cleaned_data["body_html"],
      )

    messages.success(
      request,
      f"{len(user_ids)}명에게 {self.notification_type.label} 발송 요청을 큐에 등록했습니다.",
    )
    return HttpResponseRedirect(reverse("admin:notifications_useremailnotificationsettings_changelist"))


class BroadcastServiceNoticeAdminView(_BaseBroadcastEmailAdminView):
  title = "서비스 공지 단체 발송"
  notification_type = EmailNotificationType.SERVICE_NOTICE

  def get_register_task(self):
    from ..tasks import RegisteredSendServiceNoticeEmailTask
    return RegisteredSendServiceNoticeEmailTask


class BroadcastMarketingAdminView(_BaseBroadcastEmailAdminView):
  title = "마케팅 정보 단체 발송"
  notification_type = EmailNotificationType.MARKETING

  def get_register_task(self):
    from ..tasks import RegisteredSendMarketingEmailTask
    return RegisteredSendMarketingEmailTask


@admin.register(UserEmailNotificationSettings)
class UserEmailNotificationSettingsAdmin(ModelAdmin):
  list_display = (
    "id",
    "user",
    "streak_reminder_status",
    "streak_expire_status",
    "report_ready_status",
    "service_notice_status",
    "marketing_status",
    "updated_at",
  )
  list_select_related = ("user", )
  search_fields = ("user__email", "user__name")
  autocomplete_fields = ("user", )
  ordering = ("-updated_at", )
  readonly_fields = ("created_at", "updated_at")
  fieldsets = (
    (None, {
      "fields": ("user", )
    }),
    ("스트릭 리마인더", {
      "fields": ("streak_reminder_opted_in_at", "streak_reminder_opted_out_at")
    }),
    ("스트릭 만료 경고", {
      "fields": ("streak_expire_opted_in_at", "streak_expire_opted_out_at")
    }),
    ("면접 리포트 완성", {
      "fields": ("report_ready_opted_in_at", "report_ready_opted_out_at")
    }),
    ("서비스 공지", {
      "fields": ("service_notice_opted_in_at", "service_notice_opted_out_at")
    }),
    ("마케팅 정보", {
      "fields": ("marketing_opted_in_at", "marketing_opted_out_at")
    }),
    ("메타", {
      "fields": ("created_at", "updated_at")
    }),
  )
  actions_list = ["open_service_notice_form", "open_marketing_form"]

  @admin.display(description="스트릭 리마인더", boolean=True)
  def streak_reminder_status(self, obj):
    return obj.is_opted_in(EmailNotificationType.STREAK_REMINDER.value)

  @admin.display(description="스트릭 만료", boolean=True)
  def streak_expire_status(self, obj):
    return obj.is_opted_in(EmailNotificationType.STREAK_EXPIRE.value)

  @admin.display(description="리포트 완성", boolean=True)
  def report_ready_status(self, obj):
    return obj.is_opted_in(EmailNotificationType.REPORT_READY.value)

  @admin.display(description="서비스 공지", boolean=True)
  def service_notice_status(self, obj):
    return obj.is_opted_in(EmailNotificationType.SERVICE_NOTICE.value)

  @admin.display(description="마케팅", boolean=True)
  def marketing_status(self, obj):
    return obj.is_opted_in(EmailNotificationType.MARKETING.value)

  @action(description="서비스 공지 단체 발송", url_path="service-notice-broadcast")
  def open_service_notice_form(self, request: HttpRequest) -> HttpResponse:
    return HttpResponseRedirect(reverse("admin:notifications_broadcast_service_notice"))

  def has_open_service_notice_form_permission(self, request: HttpRequest) -> bool:
    return request.user.is_staff

  @action(description="마케팅 정보 단체 발송", url_path="marketing-broadcast")
  def open_marketing_form(self, request: HttpRequest) -> HttpResponse:
    return HttpResponseRedirect(reverse("admin:notifications_broadcast_marketing"))

  def has_open_marketing_form_permission(self, request: HttpRequest) -> bool:
    return request.user.is_staff

  def get_urls(self):
    urls = super().get_urls()
    custom_urls = [
      path(
        "service-notice-broadcast/",
        self.admin_site.admin_view(BroadcastServiceNoticeAdminView.as_view(model_admin=self)),
        name="notifications_broadcast_service_notice",
      ),
      path(
        "marketing-broadcast/",
        self.admin_site.admin_view(BroadcastMarketingAdminView.as_view(model_admin=self)),
        name="notifications_broadcast_marketing",
      ),
    ]
    return custom_urls + urls
