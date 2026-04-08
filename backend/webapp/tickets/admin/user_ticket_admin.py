from django import forms
from django.contrib import admin
from django.shortcuts import render
from tickets.models import UserTicket
from tickets.services import (
  ExpireTicketsService,
  GrantTicketsService,
  RefundTicketsService,
)
from unfold.admin import ModelAdmin
from unfold.widgets import UnfoldAdminIntegerFieldWidget, UnfoldAdminTextInputWidget


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


@admin.register(UserTicket)
class UserTicketAdmin(ModelAdmin):
  list_display = ("user", "daily_count", "purchased_count", "display_total", "updated_at")
  search_fields = ("user__email", )
  ordering = ("-purchased_count", )
  readonly_fields = ("created_at", "updated_at")
  autocomplete_fields = ("user", )
  actions = ["grant_tickets", "refund_tickets", "expire_tickets"]

  @admin.display(description="총 티켓")
  def display_total(self, obj):
    return obj.total_count

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
