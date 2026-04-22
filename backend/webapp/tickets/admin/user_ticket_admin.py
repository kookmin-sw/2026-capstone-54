from django import forms
from django.contrib import admin, messages
from django.contrib.auth import get_user_model
from django.http import HttpRequest, HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import path, reverse
from django.views.generic import TemplateView
from tickets.models import UserTicket
from tickets.services import (
  ExpireTicketsService,
  GrantTicketsService,
  RefundTicketsService,
  UseTicketsService,
)
from unfold.admin import ModelAdmin
from unfold.decorators import action
from unfold.fields import (
  UnfoldAdminAutocompleteModelChoiceField,
)
from unfold.views import BaseAutocompleteView, UnfoldModelAdminViewMixin
from unfold.widgets import (
  UnfoldAdminIntegerFieldWidget,
  UnfoldAdminTextInputWidget,
)

User = get_user_model()


class UserAutocompleteView(BaseAutocompleteView):
  model = User

  def get_queryset(self):
    term = self.request.GET.get("term")
    qs = super().get_queryset().filter(is_active=True)

    if term:
      qs = qs.filter(email__icontains=term)

    return qs.order_by("email")


class TicketActionForm(forms.Form):
  amount = forms.IntegerField(
    label="수량",
    min_value=1,
    widget=UnfoldAdminIntegerFieldWidget,
  )
  reason = forms.CharField(
    label="사유",
    required=False,
    widget=UnfoldAdminTextInputWidget,
  )


class TicketActionAdminForm(forms.Form):
  ACTION_GRANT = "grant"
  ACTION_USE = "use"
  ACTION_EXPIRE = "expire"
  ACTION_REFUND = "refund"
  ACTION_CHOICES = [
    (ACTION_GRANT, "티켓 발급"),
    (ACTION_USE, "티켓 사용"),
    (ACTION_EXPIRE, "티켓 만료"),
    (ACTION_REFUND, "티켓 환불"),
  ]

  action_type = forms.ChoiceField(
    choices=ACTION_CHOICES,
    label="액션 유형",
    widget=forms.RadioSelect,
    initial=ACTION_GRANT,
  )
  user = UnfoldAdminAutocompleteModelChoiceField(
    label="사용자",
    queryset=User.objects.all(),
    url_path="admin:tickets_userticket_autocomplete",
    help_text="작업할 사용자를 선택하세요.",
  )
  amount = forms.IntegerField(
    label="수량",
    min_value=1,
    initial=1,
    widget=UnfoldAdminIntegerFieldWidget,
    help_text="발급/사용/만료/환불할 티켓 수량",
  )
  reason = forms.CharField(
    label="사유",
    required=False,
    widget=UnfoldAdminTextInputWidget,
    help_text="작업 사유 (로그에 기록됨)",
  )


class TicketActionAdminView(UnfoldModelAdminViewMixin, TemplateView):
  title = "티켓 관리"
  permission_required = ()
  template_name = "admin/tickets/ticket_action_admin.html"

  def get_context_data(self, **kwargs):
    context = super().get_context_data(**kwargs)
    form = TicketActionAdminForm(self.request.POST or None)
    context.update({"form": form})
    return context

  def post(self, request, *args, **kwargs):
    form = TicketActionAdminForm(request.POST)
    if not form.is_valid():
      return self.get(request, *args, **kwargs)

    action_type = form.cleaned_data["action_type"]
    user = form.cleaned_data["user"]
    amount = form.cleaned_data["amount"]
    reason = form.cleaned_data["reason"]

    service_map = {
      TicketActionAdminForm.ACTION_GRANT: GrantTicketsService,
      TicketActionAdminForm.ACTION_USE: UseTicketsService,
      TicketActionAdminForm.ACTION_EXPIRE: ExpireTicketsService,
      TicketActionAdminForm.ACTION_REFUND: RefundTicketsService,
    }
    action_labels = dict(TicketActionAdminForm.ACTION_CHOICES)

    service_class = service_map[action_type]
    try:
      service_class(user=user, amount=amount, reason=reason).perform()
      messages.success(
        request,
        f"{user.email}에게 {action_labels[action_type]} 완료 (수량: {amount})",
      )
    except (ValueError, Exception) as e:
      messages.error(request, f"오류: {e}")
      return self.get(request, *args, **kwargs)

    return HttpResponseRedirect(reverse("admin:tickets_userticket_changelist"))


@admin.register(UserTicket)
class UserTicketAdmin(ModelAdmin):
  list_display = (
    "user",
    "daily_count",
    "purchased_count",
    "display_total",
    "updated_at",
  )
  search_fields = ("user__email", )
  ordering = ("-purchased_count", )
  readonly_fields = ("created_at", "updated_at")
  autocomplete_fields = ("user", )
  actions = ["grant_tickets", "refund_tickets", "expire_tickets"]
  actions_list = ["open_ticket_action_form"]

  @admin.display(description="총 티켓")
  def display_total(self, obj):
    return obj.total_count

  @action(description="티켓 관리 (발급/사용/만료/환불)", url_path="ticket-action")
  def open_ticket_action_form(self, request: HttpRequest) -> HttpResponse:
    return HttpResponseRedirect(reverse("admin:tickets_userticket_action_form"))

  def has_open_ticket_action_form_permission(self, request: HttpRequest) -> bool:
    return request.user.is_staff

  def get_urls(self):
    urls = super().get_urls()
    custom_urls = [
      path(
        "ticket-action/",
        TicketActionAdminView.as_view(model_admin=self),
        name="tickets_userticket_action_form",
      ),
      path(
        "autocomplete/",
        UserAutocompleteView.as_view(),
        name="tickets_userticket_autocomplete",
      ),
    ]
    return custom_urls + urls

  def _ticket_action(self, request, queryset, *, service_class, action_name, submit_label):
    """공통 티켓 액션 처리: intermediate 폼 → 서비스 호출."""
    form = TicketActionForm(request.POST or None)

    if "confirmed" in request.POST and form.is_valid():
      amount = form.cleaned_data["amount"]
      reason = form.cleaned_data["reason"]
      success, errors = 0, []

      for ticket in queryset.select_related("user"):
        try:
          service_class(user=ticket.user, amount=amount, reason=reason).perform()
          success += 1
        except (ValueError, Exception) as e:
          errors.append(f"{ticket.user.email}: {e}")

      msg = f"{success}명에게 {action_name} 완료 (수량: {amount})"
      if errors:
        msg += f" / {len(errors)}명 실패: {'; '.join(errors)}"
      self.message_user(request, msg)
      return None

    target_users = ", ".join(queryset.select_related("user").values_list("user__email", flat=True))
    return render(
      request,
      "admin/tickets/ticket_action.html",
      {
        "form": form,
        "action_name": action_name,
        "submit_label": submit_label,
        "selected_pks": queryset.values_list("pk", flat=True),
        "target_users": target_users,
        "title": submit_label,
        **self.admin_site.each_context(request),
      },
    )

  @admin.action(description="선택한 사용자에게 티켓 지급")
  def grant_tickets(self, request, queryset):
    return self._ticket_action(
      request,
      queryset,
      service_class=GrantTicketsService,
      action_name="grant_tickets",
      submit_label="티켓 지급",
    )

  @admin.action(description="선택한 사용자에게 티켓 환불")
  def refund_tickets(self, request, queryset):
    return self._ticket_action(
      request,
      queryset,
      service_class=RefundTicketsService,
      action_name="refund_tickets",
      submit_label="티켓 환불",
    )

  @admin.action(description="선택한 사용자의 티켓 만료")
  def expire_tickets(self, request, queryset):
    return self._ticket_action(
      request,
      queryset,
      service_class=ExpireTicketsService,
      action_name="expire_tickets",
      submit_label="티켓 만료",
    )
