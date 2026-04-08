# Unfold Admin Actions 가이드

## 개요

Django Unfold는 Django Admin을 위한 모던한 UI 라이브러리입니다. 이 문서는 Unfold에서 제공하는 다양한 액션 타입을 활용하는 방법을 정리합니다.

## Unfold Actions의 종류

Unfold는 3가지 타입의 액션을 제공합니다:

1. **actions** (Django 기본): 체크박스로 선택한 객체들에 대한 일괄 작업
2. **actions_list**: 목록 페이지 상단에 표시되는 버튼 (전체 대상 작업)
3. **actions_row**: 각 행에 표시되는 버튼 (개별 객체 작업)

## 1. Django 기본 Actions (Checkbox 선택)

### 특징
- Django의 표준 action 방식
- 체크박스로 여러 객체 선택
- queryset을 파라미터로 받음
- 이미 존재하는 객체만 선택 가능

### 구현 예시

```python
from django.contrib import admin
from unfold.admin import ModelAdmin

@admin.register(StreakStatistics)
class StreakStatisticsAdmin(ModelAdmin):
    actions = ["recalculate_selected_statistics"]

    @admin.action(description="선택한 사용자 통계 재계산")
    def recalculate_selected_statistics(self, request, queryset):
        """선택한 사용자들의 스트릭 통계를 재계산한다"""
        user_ids = list(queryset.values_list("user_id", flat=True))

        result = RecalculateStreakStatisticsService(user_ids=user_ids).perform()

        message = f"{result['success_count']}명의 사용자에 대해 스트릭 통계가 재계산되었습니다."
        if result["error_count"] > 0:
            message += f" ({result['error_count']}명 실패)"

        self.message_user(request, message)
```

### 사용 시나리오
- 목록에서 여러 객체를 선택하여 일괄 처리
- 이미 존재하는 레코드에 대한 작업
- 빠른 일괄 작업이 필요한 경우

## 2. Actions List (목록 상단 버튼)

### 특징
- 목록 페이지 상단에 버튼으로 표시
- queryset을 받지 않음 (전체 대상 작업)
- 폼을 사용하여 사용자 입력 받을 수 있음
- 존재하지 않는 객체도 선택 가능 (폼 사용 시)

### 2-1. 단순 액션 (폼 없음)

```python
from unfold.admin import ModelAdmin
from unfold.decorators import action

@admin.register(JobCategory)
class JobCategoryAdmin(ModelAdmin):
    actions_list = ["seed_default_data"]

    @action(description="기본 데이터 생성", url_path="seed-data")
    def seed_default_data(self, request: HttpRequest):
        """기본 직군 및 직업 데이터 생성"""
        result = SeedService.seed_all()

        self.message_user(
            request,
            f"직군 {result['categories_created']}개, "
            f"직업 {result['jobs_created']}개가 생성되었습니다."
        )

        return redirect(reverse_lazy("admin:profiles_jobcategory_changelist"))

    def has_seed_default_data_permission(self, request: HttpRequest):
        """기본 데이터 생성 권한"""
        return request.user.is_superuser
```

### 2-2. 폼을 사용하는 액션

#### Step 1: 폼 클래스 정의

```python
from django import forms
from django.contrib.auth import get_user_model
from unfold.widgets import UnfoldAdminSelectMultipleWidget

User = get_user_model()

class RecalculateStatisticsForm(forms.Form):
    """스트릭 통계 재계산 폼"""

    users = forms.ModelMultipleChoiceField(
        label="사용자 선택",
        queryset=User.objects.all().order_by("email"),
        required=True,
        widget=UnfoldAdminSelectMultipleWidget,
        help_text="통계를 재계산할 사용자를 선택하세요.",
    )
```

**Unfold 위젯 종류:**
- `UnfoldAdminTextInputWidget`: 텍스트 입력
- `UnfoldAdminSelectMultipleWidget`: 다중 선택
- `UnfoldAdminSplitDateTimeWidget`: 날짜/시간 선택

#### Step 2: 액션 메서드 구현

```python
from django.shortcuts import render, redirect
from django.http import HttpRequest, HttpResponse

@admin.register(StreakStatistics)
class StreakStatisticsAdmin(ModelAdmin):
    actions_list = ["recalculate_multiple_statistics"]

    @action(description="통계 재계산 (다중)", url_path="recalculate-multiple")
    def recalculate_multiple_statistics(self, request: HttpRequest) -> HttpResponse:
        """사용자를 선택하여 스트릭 통계를 재계산한다"""
        form = RecalculateStatisticsForm(request.POST or None)

        if request.method == "POST" and form.is_valid():
            selected_users = form.cleaned_data["users"]

            # User 객체를 직접 전달하여 중복 조회 방지
            result = RecalculateStreakStatisticsService(
                users=list(selected_users)
            ).perform()

            message = f"{result['success_count']}명의 사용자에 대해 스트릭 통계가 재계산되었습니다."
            if result["error_count"] > 0:
                message += f" ({result['error_count']}명 실패)"

            self.message_user(request, message)
            return redirect(reverse_lazy("admin:streaks_streakstatistics_changelist"))

        return render(
            request,
            "admin/streaks/recalculate_statistics_action.html",
            {
                "form": form,
                "title": "스트릭 통계 재계산",
                **self.admin_site.each_context(request),
            },
        )

    def has_recalculate_multiple_statistics_permission(self, request: HttpRequest):
        """다중 통계 재계산 권한"""
        return request.user.is_staff
```

#### Step 3: 템플릿 생성

`templates/admin/streaks/recalculate_statistics_action.html`:

```django
{% extends "admin/base_site.html" %}

{% load i18n unfold %}

{% block extrahead %}
    {{ block.super }}
    <script src="{% url 'admin:jsi18n' %}"></script>
    {{ form.media }}
{% endblock %}

{% block content %}
    <form action="" method="post" novalidate>
        <div class="aligned border border-base-200 mb-8 rounded-default pt-3 px-3 shadow-sm dark:border-base-800">
            {% csrf_token %}

            {% for field in form %}
                {% include "unfold/helpers/field.html" with field=field %}
            {% endfor %}
        </div>

        <div class="flex justify-end">
            {% component "unfold/components/button.html" with submit=1 %}
                {% trans "재계산 실행" %}
            {% endcomponent %}
        </div>
    </form>
{% endblock %}
```

**템플릿 구조:**
- `admin/base_site.html` 상속
- `unfold` 템플릿 태그 로드
- `form.media`로 필요한 JS/CSS 로드
- `unfold/helpers/field.html`로 필드 렌더링
- `unfold/components/button.html`로 버튼 렌더링

### 사용 시나리오
- 전체 데이터에 대한 작업
- 사용자 입력이 필요한 복잡한 작업
- 존재하지 않는 객체도 선택해야 하는 경우 (예: StreakStatistics가 없는 User 선택)

## 3. Actions Row (개별 행 버튼)

### 특징
- 각 행의 끝에 버튼으로 표시
- 개별 객체의 ID를 파라미터로 받음
- 단일 객체에 대한 작업

### 구현 예시

```python
from unfold.admin import ModelAdmin
from unfold.decorators import action

@admin.register(StreakStatistics)
class StreakStatisticsAdmin(ModelAdmin):
    actions_row = ["recalculate_statistics"]

    @action(description="통계 재계산", url_path="recalculate")
    def recalculate_statistics(self, request: HttpRequest, object_id: int):
        """StreakLog 데이터를 기반으로 스트릭 통계를 재계산한다"""
        statistics = StreakStatistics.objects.get(pk=object_id)
        user = statistics.user

        # 서비스를 통해 재계산
        updated_statistics = RecalculateStreakStatisticsService(user=user).perform()

        self.message_user(
            request,
            f"'{user.email}' 사용자의 스트릭 통계가 재계산되었습니다. "
            f"(현재: {updated_statistics.current_streak}일, "
            f"최장: {updated_statistics.longest_streak}일)"
        )
        return redirect(reverse_lazy("admin:streaks_streakstatistics_changelist"))

    def has_recalculate_statistics_permission(self, request: HttpRequest):
        """통계 재계산 권한"""
        return request.user.is_staff
```

### 사용 시나리오
- 특정 객체 하나에 대한 작업
- 빠른 개별 작업이 필요한 경우
- 상세 정보를 확인하면서 작업하는 경우

## 권한 관리

각 액션에 대한 권한은 `has_{action_name}_permission` 메서드로 제어:

```python
def has_recalculate_statistics_permission(self, request: HttpRequest):
    """통계 재계산 권한"""
    return request.user.is_staff

def has_seed_default_data_permission(self, request: HttpRequest):
    """기본 데이터 생성 권한"""
    return request.user.is_superuser
```

## 실전 예시: 3가지 액션 조합

```python
from django.contrib import admin
from django.http import HttpRequest, HttpResponse
from unfold.admin import ModelAdmin
from unfold.decorators import action

@admin.register(StreakStatistics)
class StreakStatisticsAdmin(ModelAdmin):
    list_display = ("user", "current_streak", "longest_streak", "updated_at")

    # 3가지 액션 타입 모두 사용
    actions = ["recalculate_selected_statistics"]  # 체크박스 선택
    actions_list = ["recalculate_multiple_statistics"]  # 상단 버튼 (폼 사용)
    actions_row = ["recalculate_statistics"]  # 개별 행 버튼

    # 1. Django 기본 action (체크박스)
    @admin.action(description="선택한 사용자 통계 재계산")
    def recalculate_selected_statistics(self, request, queryset):
        user_ids = list(queryset.values_list("user_id", flat=True))
        result = RecalculateStreakStatisticsService(user_ids=user_ids).perform()
        self.message_user(request, f"{result['success_count']}명 재계산 완료")

    # 2. Unfold changelist action (상단 버튼, 폼 사용)
    @action(description="통계 재계산 (다중)", url_path="recalculate-multiple")
    def recalculate_multiple_statistics(self, request: HttpRequest) -> HttpResponse:
        form = RecalculateStatisticsForm(request.POST or None)

        if request.method == "POST" and form.is_valid():
            selected_users = form.cleaned_data["users"]
            result = RecalculateStreakStatisticsService(
                users=list(selected_users)
            ).perform()
            self.message_user(request, f"{result['success_count']}명 재계산 완료")
            return redirect(reverse_lazy("admin:streaks_streakstatistics_changelist"))

        return render(request, "admin/streaks/recalculate_statistics_action.html", {
            "form": form,
            "title": "스트릭 통계 재계산",
            **self.admin_site.each_context(request),
        })

    # 3. Unfold row action (개별 행 버튼)
    @action(description="통계 재계산", url_path="recalculate")
    def recalculate_statistics(self, request: HttpRequest, object_id: int):
        statistics = StreakStatistics.objects.get(pk=object_id)
        updated = RecalculateStreakStatisticsService(user=statistics.user).perform()
        self.message_user(
            request,
            f"'{statistics.user.email}' 재계산 완료 "
            f"(현재: {updated.current_streak}일)"
        )
        return redirect(reverse_lazy("admin:streaks_streakstatistics_changelist"))

    # 권한 설정
    def has_recalculate_statistics_permission(self, request: HttpRequest):
        return request.user.is_staff

    def has_recalculate_multiple_statistics_permission(self, request: HttpRequest):
        return request.user.is_staff
```

## 액션 선택 가이드

| 상황 | 추천 액션 타입 | 이유 |
|------|---------------|------|
| 목록에서 여러 개 선택하여 일괄 처리 | `actions` (체크박스) | 빠르고 직관적 |
| 존재하지 않는 객체도 선택 필요 | `actions_list` (폼) | 폼으로 모든 객체 선택 가능 |
| 전체 데이터 초기화/시딩 | `actions_list` (단순) | 선택 불필요한 전체 작업 |
| 개별 객체 하나만 처리 | `actions_row` | 빠른 개별 작업 |
| 복잡한 입력이 필요한 작업 | `actions_list` (폼) | 다양한 입력 필드 제공 |

## 주의사항

### 1. 중복 쿼리 방지

폼에서 이미 조회한 객체를 서비스에 전달할 때:

```python
# 나쁜 예: ID만 전달하여 재조회
selected_users = form.cleaned_data["users"]
user_ids = [user.id for user in selected_users]
RecalculateStreakStatisticsService(user_ids=user_ids).perform()  # 재조회 발생

# 좋은 예: 객체 직접 전달
selected_users = form.cleaned_data["users"]
RecalculateStreakStatisticsService(users=list(selected_users)).perform()  # 재조회 없음
```

### 2. 권한 메서드 네이밍

권한 메서드는 반드시 `has_{action_name}_permission` 형식:

```python
@action(description="통계 재계산", url_path="recalculate")
def recalculate_statistics(self, request, object_id):
    ...

# 메서드명이 정확히 일치해야 함
def has_recalculate_statistics_permission(self, request):
    return request.user.is_staff
```

### 3. 템플릿 위치

템플릿은 `templates/admin/{app_name}/{template_name}.html` 경로에 위치:

```
backend/webapp/streaks/templates/admin/streaks/recalculate_statistics_action.html
```

### 4. 폼 위젯

Unfold 스타일을 유지하려면 Unfold 위젯 사용:

```python
from unfold.widgets import (
    UnfoldAdminTextInputWidget,
    UnfoldAdminSelectMultipleWidget,
    UnfoldAdminSplitDateTimeWidget,
)
```

## 참고 자료

- [Unfold 공식 문서: Actions](https://unfoldadmin.com/docs/actions/)
- [Unfold 공식 문서: Action Form Example](https://unfoldadmin.com/docs/actions/action-form-example/)
- [Unfold 공식 문서: Changelist Actions](https://unfoldadmin.com/docs/actions/changelist/)
- [Django 공식 문서: Admin Actions](https://docs.djangoproject.com/en/stable/ref/contrib/admin/actions/)
