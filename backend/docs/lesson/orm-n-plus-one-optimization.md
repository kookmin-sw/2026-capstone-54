# Django ORM N+1 쿼리 최적화 가이드

## 개요

N+1 쿼리 문제는 ORM을 사용할 때 가장 흔하게 발생하는 성능 문제입니다. 이 문서는 실제 프로젝트에서 N+1 문제를 발견하고 해결한 과정을 정리합니다.

## N+1 쿼리 문제란?

N+1 쿼리는 다음과 같은 상황에서 발생합니다:

1. N개의 객체를 조회하는 쿼리 1개 실행
2. 각 객체의 관련 데이터를 조회하는 쿼리 N개 실행
3. 총 N+1개의 쿼리 발생

### 예시

```python
# 나쁜 예: N+1 쿼리 발생
users = User.objects.all()  # 쿼리 1개
for user in users:
    print(user.streak_statistic.current_streak)  # 각 user마다 쿼리 1개 (N개)
```

## 실제 사례: StreakStatistics 재계산 서비스

### 문제 상황

Admin에서 여러 사용자의 스트릭 통계를 재계산하는 기능을 구현할 때 다음과 같은 문제가 발생했습니다:

```python
# Admin 코드
selected_users = form.cleaned_data["users"]  # User 조회 (쿼리 1)
user_ids = [user.id for user in selected_users]
RecalculateStreakStatisticsService(user_ids=user_ids).perform()

# 서비스 코드
users = User.objects.filter(id__in=user_ids)  # User 다시 조회 (쿼리 2) ← 중복!
```

**문제점:**
1. Admin에서 이미 User 객체를 조회했는데
2. 서비스에서 ID만 받아서 다시 조회
3. 불필요한 중복 쿼리 발생

### 해결 과정

#### 1단계: 문제 인식

nplusone 라이브러리가 다음과 같은 경고를 발생:

```
Potential unnecessary eager load detected on `User.streak_statistic`
```

SQL 로그 확인:
```sql
SELECT * FROM users WHERE id = ?  -- 현재 로그인 사용자
SELECT * FROM users WHERE id IN (?, ?) ORDER BY email  -- 폼에서 선택한 사용자
SELECT * FROM users WHERE id IN (?, ?)  -- 서비스에서 다시 조회 ← 중복!
```

#### 2단계: 서비스 API 개선

User 객체를 직접 받을 수 있도록 서비스 수정:

```python
class RecalculateStreakStatisticsService(BaseService):
  """
  Usage:
    # 단일 사용자
    RecalculateStreakStatisticsService(user=user).perform()

    # 다중 사용자 (User 객체 직접 전달)
    RecalculateStreakStatisticsService(users=[user1, user2]).perform()

    # 다중 사용자 (user_ids 전달)
    RecalculateStreakStatisticsService(user_ids=[1, 2, 3]).perform()
  """

  def execute(self):
    if self.user:
      # 단일 사용자 처리
      ...

    users = self.kwargs.get("users")
    user_ids = self.kwargs.get("user_ids")

    if users is not None:
      # User 객체가 직접 전달된 경우
      users_with_prefetch = self._add_prefetch_to_users(users)
    elif user_ids is not None:
      # user_ids가 전달된 경우
      users_with_prefetch = self._get_users_with_prefetch(user_ids)
    else:
      raise ValueError("Either 'users' or 'user_ids' must be provided")

    return self._recalculate_multiple_users(users_with_prefetch)
```

#### 3단계: prefetch_related_objects 활용

이미 조회된 객체에 prefetch를 추가하는 핵심 기법:

```python
def _add_prefetch_to_users(self, users):
  """이미 조회된 User 객체들에 prefetch를 추가한다"""
  from django.db.models import prefetch_related_objects

  # 기존 User 객체들에 prefetch 적용 (User 재조회 없음!)
  prefetch_related_objects(
    users,
    Prefetch(
      "streak_logs",
      queryset=StreakLog.objects.order_by("date")
    ),
    "streak_statistic"
  )

  return users
```

**핵심 포인트:**
- `prefetch_related_objects`는 이미 메모리에 있는 객체에 prefetch 적용
- User 객체를 다시 조회하지 않음
- 관련 데이터(StreakLog, StreakStatistics)만 추가로 조회

#### 4단계: Admin 코드 수정

```python
@action(description="통계 재계산 (다중)", url_path="recalculate-multiple")
def recalculate_multiple_statistics(self, request: HttpRequest) -> HttpResponse:
  form = RecalculateStatisticsForm(request.POST or None)

  if request.method == "POST" and form.is_valid():
    selected_users = form.cleaned_data["users"]

    # User 객체를 직접 전달하여 중복 조회 방지
    result = RecalculateStreakStatisticsService(users=list(selected_users)).perform()

    message = f"{result['success_count']}명의 사용자에 대해 스트릭 통계가 재계산되었습니다."
    self.message_user(request, message)
    return redirect(reverse_lazy("admin:streaks_streakstatistics_changelist"))

  return render(request, "admin/streaks/recalculate_statistics_action.html", {...})
```

### 최종 쿼리 흐름

**최적화 전:**
1. 현재 로그인 사용자 조회 (1번)
2. 폼에서 선택한 사용자 조회 (1번)
3. 서비스에서 사용자 다시 조회 (1번) ← 중복
4. 각 사용자의 StreakLog 조회 (N번) ← N+1
5. 각 사용자의 StreakStatistics 조회 (N번) ← N+1

**최적화 후:**
1. 현재 로그인 사용자 조회 (1번)
2. 폼에서 선택한 사용자 조회 (1번)
3. StreakLog prefetch (1번)
4. StreakStatistics prefetch (1번)
5. Bulk create/update (최대 2번)

**총 3-6번의 쿼리**로 최적화!

## 일반적인 최적화 기법

### 1. select_related (ForeignKey, OneToOneField)

단일 관계에 대해 JOIN을 사용하여 한 번에 조회:

```python
# 나쁜 예
users = User.objects.all()
for user in users:
    print(user.profile.bio)  # N+1 쿼리

# 좋은 예
users = User.objects.select_related('profile')
for user in users:
    print(user.profile.bio)  # 추가 쿼리 없음
```

### 2. prefetch_related (ManyToMany, Reverse ForeignKey)

다중 관계에 대해 별도 쿼리로 조회 후 Python에서 조합:

```python
# 나쁜 예
users = User.objects.all()
for user in users:
    for log in user.streak_logs.all():  # N+1 쿼리
        print(log.date)

# 좋은 예
users = User.objects.prefetch_related('streak_logs')
for user in users:
    for log in user.streak_logs.all():  # 추가 쿼리 없음
        print(log.date)
```

### 3. Prefetch 객체로 쿼리 커스터마이징

```python
from django.db.models import Prefetch

users = User.objects.prefetch_related(
    Prefetch(
        'streak_logs',
        queryset=StreakLog.objects.order_by('date')  # 정렬 조건 추가
    )
)
```

### 4. prefetch_related_objects (이미 조회된 객체에 적용)

```python
from django.db.models import prefetch_related_objects

# 이미 조회된 객체들
users = [user1, user2, user3]

# 추가 prefetch 적용 (객체 재조회 없음)
prefetch_related_objects(users, 'streak_logs', 'streak_statistic')
```

## to_attr 사용 시 주의사항

### 문제 상황

```python
# to_attr 사용
users = User.objects.prefetch_related(
    Prefetch(
        'streak_logs',
        queryset=StreakLog.objects.order_by('date'),
        to_attr='prefetched_streak_logs'  # 커스텀 속성
    )
)

for user in users:
    logs = user.prefetched_streak_logs  # nplusone이 추적 못함
```

**문제점:**
- nplusone이 커스텀 속성 접근을 추적하지 못함
- "unnecessary eager load" 오탐 발생

### 해결 방법

**to_attr 제거하고 표준 방식 사용:**

```python
# 표준 Django ORM 방식
users = User.objects.prefetch_related(
    Prefetch(
        'streak_logs',
        queryset=StreakLog.objects.order_by('date')
    )
)

for user in users:
    logs = list(user.streak_logs.all())  # nplusone이 정확히 추적
```

**장점:**
- Django ORM의 표준 방식
- nplusone이 정확하게 추적 가능
- 코드가 더 자연스럽고 이해하기 쉬움
- 커스텀 속성 없이 일반적인 related manager 사용

## 실제 사례: Django Admin 목록 페이지 N+1 (UserJobDescription)

### 문제 상황

`UserJobDescriptionAdmin` 목록 페이지 접근 시 각 레코드마다 `user` 를 개별 조회하는 N+1 쿼리가 발생했다.

```
SELECT "users" ... WHERE ("users"."deleted_at" IS NULL AND "users"."id" = ?) LIMIT ?
-- 레코드 수만큼 반복
```

### 잘못된 진단과 오수정 (교훈)

**오진:** admin log 의 `str(obj)` 호출에서 발생한다고 판단 → `save_model` 오버라이드로 FK 캐시 주입

```python
# 잘못된 수정 — 저장 시점의 문제가 아니었다
def save_model(self, request, obj, form, change):
    super().save_model(request, obj, form, change)
    if "user" in form.cleaned_data:
        obj.user = form.cleaned_data["user"]  # 의미 없음
```

**실제 원인:** 목록 조회(changelist) 자체에서 `select_related` 가 적용되지 않아 각 행 렌더링 시 `__str__` 호출이 개별 쿼리를 유발했다.

### `list_select_related` 만으로는 부족한 이유

`list_select_related` 는 changelist queryset 에만 `select_related` 를 추가한다. 하지만:

- `unfold.admin.ModelAdmin` 의 내부 처리 순서에 따라 적용이 보장되지 않을 수 있다
- `get_object()`, action queryset 등 changelist 외 컨텍스트에는 적용되지 않는다
- `ResumeAdmin` 등 다른 어드민이 `get_queryset` 오버라이드를 사용하는 이유가 이 때문이다

### 올바른 수정

```python
def get_queryset(self, request):
    """N+1 방지: list/detail 모든 컨텍스트에서 FK를 JOIN으로 eager load."""
    return super().get_queryset(request).select_related("user", "job_description")
```

`get_queryset` 에 `select_related` 를 명시하면 changelist·detail·action 등 모든 쿼리에 JOIN 이 적용된다.

### 결론 및 규칙

| 방법 | 적용 범위 | 권장 여부 |
|------|-----------|-----------|
| `list_select_related` | changelist 만 | 보조 수단으로만 사용 |
| `get_queryset` + `select_related` | 모든 컨텍스트 | **필수** |
| `save_model` FK 캐시 주입 | 저장 직후만 | 잘못된 접근 |

> **규칙:** Django Admin 에서 FK 관련 N+1 을 막으려면 반드시 `get_queryset` 을 오버라이드하여 `select_related` 를 적용한다. `list_select_related` 는 추가 안전망이지 주요 수단이 아니다.

## 체크리스트

N+1 쿼리를 방지하기 위한 체크리스트:

- [ ] 루프 안에서 related 객체 접근 시 prefetch 사용
- [ ] ForeignKey/OneToOneField는 `select_related` 사용
- [ ] ManyToMany/Reverse ForeignKey는 `prefetch_related` 사용
- [ ] 이미 조회된 객체에 prefetch 추가 시 `prefetch_related_objects` 사용
- [ ] 가능하면 `to_attr` 대신 표준 related manager 사용
- [ ] nplusone 라이브러리로 개발 환경에서 모니터링
- [ ] 서비스 레이어에서 객체를 받을 때 ID만 받지 말고 객체 자체도 받을 수 있게 설계
- [ ] **Django Admin FK N+1: `list_select_related` 만 설정하지 말고 `get_queryset` + `select_related` 를 반드시 추가**

## 참고 자료

- [Django 공식 문서: select_related](https://docs.djangoproject.com/en/stable/ref/models/querysets/#select-related)
- [Django 공식 문서: prefetch_related](https://docs.djangoproject.com/en/stable/ref/models/querysets/#prefetch-related)
- [Django 공식 문서: Prefetch 객체](https://docs.djangoproject.com/en/stable/ref/models/querysets/#prefetch-objects)
- [nplusone 라이브러리](https://github.com/jmcarp/nplusone)
