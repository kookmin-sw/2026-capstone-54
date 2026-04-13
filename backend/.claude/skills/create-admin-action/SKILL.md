---
name: create-admin-action
description: Django Unfold 어드민에 액션(action)을 추가합니다. 선택 행 대상 bulk 액션, 단일 행 row 액션, 그리고 선택 없이 동작하는 changelist 전역 액션(actions_list) 생성 요청 시 사용합니다.
---

# 어드민 액션 추가 Skill

## 목적
MeFit 백엔드(Django + DRF + Unfold) 프로젝트의 어드민 패널에
운영자가 직접 실행할 수 있는 액션 버튼을 추가한다.

비즈니스 로직은 반드시 `services/` 의 서비스 클래스로 위임하고,
어드민에서는 서비스 호출 + 사용자 메시지 + 리다이렉트만 담당한다.

## 액션 3가지 유형

| 유형 | 용도 | 어디에 노출 | 속성 |
|------|------|-------------|------|
| 1. Bulk actions | 체크박스로 여러 행을 선택 후 일괄 처리 | 목록 상단 드롭다운 | `actions = [...]` + `@admin.action` |
| 2. Row actions | 행 1개에 대해 동작 | 각 행의 오른쪽 | `actions_row = [...]` + `@unfold.decorators.action` |
| 3. Changelist actions | 선택 없이 전역적으로 1번 동작 (seed, 일괄 재계산 등) | 목록 페이지 헤더 | `actions_list = [...]` + `@unfold.decorators.action` |

참고 파일:
- Bulk + Row: `webapp/profiles/admin/job_admin.py`
- Changelist (seed): `webapp/streaks/admin/daily_interview_reward_policy_admin.py`
- Changelist (seed, resumes): `webapp/resumes/admin/resume_text_content_template_admin.py`

## 절차

### 1. 서비스 선 작성
액션이 호출할 로직은 먼저 `{app}/services/{이름}_service.py` 에 서비스로 작성한다.
idempotent(멱등)하게 설계한다 — 같은 액션을 여러 번 눌러도 상태가 망가지지 않아야 한다.

### 2. 어드민 파일 수정

#### 공통 import
```python
from django.contrib import admin
from django.http import HttpRequest
from django.shortcuts import redirect
from django.urls import reverse_lazy
from unfold.admin import ModelAdmin
from unfold.decorators import action
```

#### (A) Bulk 액션
```python
class SomethingAdmin(ModelAdmin):
  actions = ["bulk_do_something"]

  @admin.action(description="선택한 항목 처리")
  def bulk_do_something(self, request, queryset):
    updated = queryset.update(is_active=True)
    self.message_user(request, f"{updated}개가 처리되었습니다.")
```

#### (B) Row 액션
```python
class SomethingAdmin(ModelAdmin):
  actions_row = ["do_single"]

  @action(description="단건 처리", url_path="do-single")
  def do_single(self, request: HttpRequest, object_id: int):
    obj = get_object_or_404(Something, pk=object_id)
    # 서비스 호출
    self.message_user(request, f"'{obj}' 처리 완료")
    return redirect(reverse_lazy("admin:{app_label}_{model}_changelist"))

  def has_do_single_permission(self, request: HttpRequest):
    return request.user.is_staff
```

#### (C) Changelist 전역 액션 (seed 등)
```python
class SomethingAdmin(ModelAdmin):
  actions_list = ["seed_defaults"]

  @action(description="기본 데이터 시드", url_path="seed-defaults")
  def seed_defaults(self, request: HttpRequest):
    created = SeedSomethingService.perform()
    self.message_user(request, f"{created}개가 생성되었습니다.")
    return redirect(reverse_lazy("admin:{app_label}_{model}_changelist"))

  def has_seed_defaults_permission(self, request: HttpRequest):
    return request.user.is_superuser
```

### 3. 권한 메서드 (필수)
Unfold 액션(@action)은 `has_{method_name}_permission(self, request)` 을 반드시 정의해야
버튼이 렌더링된다. 위험도에 맞춰 적절히 구분한다.

- 조회/토글 수준 → `request.user.is_staff`
- 시드/대량 데이터 생성 → `request.user.is_superuser`

### 4. 리다이렉트 URL 컨벤션
`reverse_lazy("admin:{app_label}_{model_name_lower}_changelist")` 로 changelist 로 돌려보낸다.
예: `"admin:resumes_resumetextcontenttemplate_changelist"`

### 5. 메시지 사용자에게 노출
성공/실패 모두 `self.message_user(request, "...")` 로 알린다.
실패 시에는 `level=messages.ERROR` 를 함께 전달한다:
```python
from django.contrib import messages
self.message_user(request, "실패했습니다.", level=messages.ERROR)
```

### 6. 테스트
어드민 액션도 테스트 작성을 권장한다.
- Bulk/Row: `self.client.post(changelist_url, {"action": "bulk_...", "_selected_action": [pk]})`
- Changelist action(Unfold @action): 액션의 `url_path` 로 직접 GET 호출.
  예: `/admin/{app}/{model}/seed-defaults/`

## 체크리스트
- [ ] 비즈니스 로직이 `services/` 서비스로 분리되어 있다
- [ ] 어드민 파일 상단에 필요한 import 추가 (`action`, `redirect`, `reverse_lazy`, …)
- [ ] 올바른 속성 선택: `actions` / `actions_row` / `actions_list`
- [ ] 액션 데코레이터 일치: bulk=`@admin.action`, row/list=`@unfold.decorators.action`
- [ ] `has_{액션}_permission` 메서드 정의
- [ ] 성공/실패 메시지를 `message_user()` 로 전달
- [ ] row/list 액션은 `redirect(reverse_lazy(...))` 로 changelist 복귀
- [ ] 멱등성 확보 (시드/토글은 중복 실행 시 안전해야 함)
- [ ] 테스트 추가
