# Unfold Admin Autocomplete 구현

## 개요

Django Unfold에서 AJAX 자동완성(Autocomplete)을 구현하는 방법을 정리합니다.

## Autocomplete View 구현

### BaseAutocompleteView 상속

```python
from unfold.views import BaseAutocompleteView
from django.contrib.auth import get_user_model

User = get_user_model()

class UserAutocompleteView(BaseAutocompleteView):
    model = User

    def get_queryset(self):
        term = self.request.GET.get("term")
        qs = super().get_queryset().filter(is_active=True)

        if term:
            qs = qs.filter(email__icontains=term)

        return qs.order_by("email")
```

**핵심:**
- `BaseAutocompleteView`는 Django의 `ListView`를 상속
- `term` GET 파라미터로 검색어 전달
- JSON 응답 형식: `{"results": [{"id": "pk", "text": "표시텍스트"}]}`

## Autocomplete Field

### UnfoldAdminAutocompleteModelChoiceField

```python
from unfold.fields import UnfoldAdminAutocompleteModelChoiceField

class MyForm(forms.Form):
    user = UnfoldAdminAutocompleteModelChoiceField(
        label="사용자",
        queryset=User.objects.filter(is_active=True),
        url_path="admin:custom_autocomplete_url",
    )
```

**파라미터:**
- `queryset`: 선택 가능한 객체 목록
- `url_path`: autocomplete URL 패턴 이름

## URL 등록

### get_urls에서 커스텀 URL 등록

```python
def get_urls(self):
    urls = super().get_urls()
    custom_urls = [
        path(
            "autocomplete/",
            self.admin_site.admin_view(UserAutocompleteView.as_view()),
            name="app_model_autocomplete",
        ),
    ]
    return custom_urls + urls
```

**주의:**
- `self.admin_site.admin_view()`로 래핑하여 관리자 권한 보호
- `BaseAutocompleteView` (standalone)는 `model_admin` 인자를 받지 않음
- `UnfoldModelAdminViewMixin` 사용 시에는 `model_admin=self` 전달 필요

## Queryset 일관성

Autocomplete View와 Form 필드의 Queryset을 동일하게 유지:

```python
# Form 필드
queryset=User.objects.filter(is_active=True),

# Autocomplete View
qs = super().get_queryset().filter(is_active=True)
```

## 관련 문서

- [Unfold Autocomplete Fields](https://unfoldadmin.com/docs/fields/autocomplete/)
