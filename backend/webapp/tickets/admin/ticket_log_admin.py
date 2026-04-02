from django.contrib import admin
from tickets.models import TicketLog
from unfold.admin import ModelAdmin


@admin.register(TicketLog)
class TicketLogAdmin(ModelAdmin):
  list_display = (
    "user",
    "action_type",
    "amount",
    "balance_after",
    "reason",
    "created_at",
  )
  list_filter = ("action_type", "created_at")
  search_fields = ("user__email", "reason")
  ordering = ("-created_at", )
  readonly_fields = ("created_at", "updated_at")
  autocomplete_fields = ("user", )

  def has_add_permission(self, request):
    # 티켓 로그는 시스템에서 자동으로 생성되므로 수동 추가 불가
    return False

  def has_change_permission(self, request, obj=None):
    # 티켓 로그는 수정 불가 (이력 보존)
    return False

  def has_delete_permission(self, request, obj=None):
    # 티켓 로그는 삭제 불가 (이력 보존)
    return False
