"""마일스톤 빠른 추가 Unfold CustomPage 뷰."""

from achievements.admin.forms import MilestoneQuickAddForm
from django.contrib import messages
from django.http import HttpResponseRedirect
from django.urls import reverse
from django.views.generic import TemplateView
from unfold.views import UnfoldModelAdminViewMixin


class MilestoneQuickAddView(UnfoldModelAdminViewMixin, TemplateView):
  """마일스톤 빠른 추가 Unfold CustomPage."""

  title = "마일스톤 빠른 추가"
  permission_required = ()
  template_name = "admin/achievements/milestone_quick_add.html"

  def get_context_data(self, **kwargs):
    context = super().get_context_data(**kwargs)
    context["form"] = MilestoneQuickAddForm(self.request.POST or None)
    return context

  def post(self, request, *args, **kwargs):
    form = MilestoneQuickAddForm(request.POST)
    if form.is_valid():
      milestone, created = form.save()
      if created:
        messages.success(request, f"마일스톤 '{milestone.name}'이 생성되었습니다.")
      else:
        messages.info(request, f"마일스톤 '{milestone.name}'이 이미 존재합니다.")
      return HttpResponseRedirect(reverse("admin:achievements_milestone_changelist"))
    return self.get(request, *args, **kwargs)
