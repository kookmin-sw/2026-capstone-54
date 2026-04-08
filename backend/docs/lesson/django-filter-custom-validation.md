# django-filter 커스텀 검증 (Custom Validation)

## 개요

django-filter를 사용할 때 여러 필드 간의 교차 검증(cross-field validation)이 필요한 경우가 있습니다. 예를 들어 날짜 범위 필터에서 `start_date`가 `end_date`보다 늦지 않아야 하는 경우입니다.

이 문서는 django-filter에서 커스텀 검증을 구현하는 표준 방법을 설명합니다.

## 문제 상황

다음과 같은 날짜 범위 필터가 있다고 가정합니다:

```python
class StreakLogFilter(filters.FilterSet):
    start_date = filters.DateFilter(field_name='date', lookup_expr='gte')
    end_date = filters.DateFilter(field_name='date', lookup_expr='lte')

    class Meta:
        model = StreakLog
        fields = ['start_date', 'end_date']
```

이 필터는 다음과 같은 문제가 있습니다:
- `start_date > end_date`인 경우에도 에러 없이 처리됨
- 논리적으로 잘못된 범위를 허용함

## 해결 방법: 커스텀 Form 사용

django-filter의 표준 방식은 **커스텀 Form 클래스를 만들어서 `clean()` 메서드를 오버라이드**하는 것입니다.

### 1. 커스텀 Form 클래스 생성

```python
from django import forms
from django_filters import rest_framework as filters
from streaks.models import StreakLog


class StreakLogFilterForm(forms.Form):
    """StreakLogFilter의 커스텀 폼"""

    def clean(self):
        """날짜 범위 교차 검증"""
        cleaned_data = super().clean()
        start_date = cleaned_data.get('start_date')
        end_date = cleaned_data.get('end_date')

        if start_date and end_date and start_date > end_date:
            raise forms.ValidationError(
                "start_date는 end_date보다 이전이어야 합니다."
            )

        return cleaned_data
```

### 2. FilterSet에 커스텀 Form 지정

```python
class StreakLogFilter(filters.FilterSet):
    start_date = filters.DateFilter(field_name='date', lookup_expr='gte')
    end_date = filters.DateFilter(field_name='date', lookup_expr='lte')

    class Meta:
        model = StreakLog
        fields = ['start_date', 'end_date']
        form = StreakLogFilterForm  # 커스텀 폼 지정
```

### 3. View는 단순하게 유지

```python
class StreakLogsAPIView(BaseAPIView):
    permission_classes = [IsEmailVerified]
    serializer_class = StreakLogSerializer
    filter_backends = [filters.DjangoFilterBackend]
    filterset_class = StreakLogFilter

    def get(self, request):
        queryset = StreakLog.objects.filter(user=self.current_user)
        queryset = self.filter_queryset(queryset)  # 필터가 자동으로 검증 처리
        queryset = queryset.order_by("date")
        # ...
```

## 동작 원리

1. **DjangoFilterBackend가 자동 처리**
   - `filter_queryset()` 호출 시 자동으로 `filterset.form.is_valid()` 체크
   - 폼이 유효하지 않으면 자동으로 400 응답 반환

2. **Django Form의 표준 검증 흐름**
   - 각 필드의 `clean_<fieldname>()` 실행
   - 전체 폼의 `clean()` 실행 (교차 검증)
   - `ValidationError` 발생 시 자동으로 에러 메시지 수집

3. **DRF의 에러 처리**
   - `forms.ValidationError`를 자동으로 400 BAD REQUEST로 변환
   - 에러 메시지를 JSON 응답으로 반환

## 검증 시나리오

### 1. 잘못된 날짜 형식
```
GET /api/v1/streaks/logs/?start_date=2025/03/01&end_date=2025-03-31
```
→ 400 BAD REQUEST (DateFilter가 자동 검증)

### 2. start_date > end_date
```
GET /api/v1/streaks/logs/?start_date=2025-04-01&end_date=2025-03-31
```
→ 400 BAD REQUEST (커스텀 clean() 메서드가 검증)

### 3. 정상 범위
```
GET /api/v1/streaks/logs/?start_date=2025-03-01&end_date=2025-03-31
```
→ 200 OK

## 장점

1. **Django의 표준 패턴 사용**
   - Django Form의 `clean()` 메서드 활용
   - 익숙한 검증 패턴

2. **책임 분리**
   - 필터 클래스: 필터 정의와 검증 로직
   - View: 필터 사용만 담당
   - 각 컴포넌트가 자신의 책임만 가짐

3. **자동 에러 처리**
   - DjangoFilterBackend가 자동으로 검증
   - 별도의 try-catch 불필요
   - 일관된 에러 응답 형식

4. **테스트 용이성**
   - 폼 단위로 검증 로직 테스트 가능
   - 필터 단위로 통합 테스트 가능

## 잘못된 방법들

### ❌ View에서 직접 검증
```python
# 안티패턴: View가 필터의 검증 로직을 알아야 함
def get(self, request):
    filterset = self.filterset_class(request.query_params, queryset=queryset)
    if not filterset.form.is_valid():
        return Response({"error": "..."}, status=400)
    # ...
```

### ❌ FilterSet의 qs 프로퍼티 오버라이드
```python
# 비표준: django-filter의 권장 방식이 아님
class StreakLogFilter(filters.FilterSet):
    @property
    def qs(self):
        if not self.form.is_valid():
            raise ValidationError("...")
        return super().qs
```

## 참고 자료

- [Django Form Validation](https://docs.djangoproject.com/en/stable/ref/forms/validation/)
- [django-filter Documentation](https://django-filter.readthedocs.io/en/stable/)
- [DRF Filtering](https://www.django-rest-framework.org/api-guide/filtering/)

## 실제 적용 사례

이 패턴은 다음과 같은 상황에서 유용합니다:

- 날짜/시간 범위 검증 (시작 < 종료)
- 숫자 범위 검증 (최소값 < 최대값)
- 상호 배타적 필터 검증 (둘 중 하나만 선택)
- 조건부 필수 필드 검증 (A를 선택하면 B도 필수)
