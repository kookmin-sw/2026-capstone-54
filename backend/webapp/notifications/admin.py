from django import forms
from django.contrib import admin, messages
from django.contrib.auth import get_user_model
from django.http import HttpResponseRedirect
from django.template.response import TemplateResponse
from django.urls import path, reverse

from .models import Notification
from .services import CreateNotificationService

User = get_user_model()


class SendTestNotificationForm(forms.Form):
  user = forms.ModelChoiceField(
    queryset=User.objects.all().order_by("email"),
    label="수신 사용자",
  )
  category = forms.ChoiceField(
    choices=Notification.Category.choices,
    label="카테고리",
  )
  message = forms.CharField(
    widget=forms.Textarea(attrs={"rows": 3}),
    label="메시지",
    max_length=500,
  )


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
  list_display = (
    "id",
    "user",
    "category",
    "is_read",
    "notifiable_type",
    "notifiable_id",
    "created_at",
  )
  list_filter = ("category", "is_read", "notifiable_type")
  search_fields = ("user__email", "message", "notifiable_id")
  readonly_fields = (
    "id",
    "created_at",
    "updated_at",
    "notifiable_type",
    "notifiable_id",
  )
  list_select_related = ("user", "notifiable_type")
  ordering = ("-created_at", )
  change_list_template = "admin/notifications/notification/change_list.html"

  def get_urls(self):
    urls = super().get_urls()
    custom_urls = [
      path(
        "send-test/",
        self.admin_site.admin_view(self.send_test_notification_view),
        name="notifications_notification_send_test",
      ),
    ]
    return custom_urls + urls

  def send_test_notification_view(self, request):
    if request.method == "POST":
      form = SendTestNotificationForm(request.POST)
      if form.is_valid():
        user = form.cleaned_data["user"]
        category = form.cleaned_data["category"]
        message = form.cleaned_data["message"]
        CreateNotificationService(
          user=user,
          message=message,
          category=category,
        ).perform()
        self.message_user(
          request,
          f"테스트 알림이 {user}에게 발송되었습니다. (카테고리: {category})",
          messages.SUCCESS,
        )
        return HttpResponseRedirect(reverse("admin:notifications_notification_changelist"))
    else:
      form = SendTestNotificationForm()

    context = {
      **self.admin_site.each_context(request),
      "title": "테스트 알림 발송",
      "form": form,
      "opts": self.model._meta,
    }
    return TemplateResponse(
      request,
      "admin/notifications/notification/send_test.html",
      context,
    )
