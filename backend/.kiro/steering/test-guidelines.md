---
inclusion: fileMatch
fileMatchPattern: "**/tests/**/*.py"
---

# Django 테스트 작성 가이드

## 테스트 위치

| 대상 | 위치 |
|---|---|
| 모델 | `webapp/{앱명}/tests/models/test_{모델명}.py` |
| 서비스 | `webapp/{앱명}/tests/services/test_{서비스명}.py` |
| Admin | `webapp/{앱명}/tests/admin/test_{모델명}_admin.py` |
| Serializer | `webapp/api/v1/{앱명}/tests/serializers/test_{시리얼라이저명}.py` |
| View | `webapp/api/v1/{앱명}/tests/views/test_{뷰명}.py` |

## 필수 규칙

- `django.test.TestCase` 사용 (트랜잭션 자동 롤백)
- Factory Boy로 테스트 데이터 생성 (`UserFactory` 등)
- 외부 의존성 (LLM, S3, Celery)은 `@patch`로 모킹
- 테스트 메서드명: 한국어 서술형 (`test_이력서_생성`)
- 정상 케이스 + 예외 케이스 모두 작성
- 각 tests/ 디렉토리에 `__init__.py` 필수

## 서비스 테스트 패턴

```python
from django.test import TestCase
from users.factories import UserFactory

class CreateXxxServiceTests(TestCase):
  def setUp(self):
    self.user = UserFactory()

  def test_정상_생성(self):
    result = CreateXxxService(user=self.user, title="테스트").perform()
    self.assertIsNotNone(result.pk)

  def test_필수값_누락_시_에러(self):
    from django.core.exceptions import ValidationError
    with self.assertRaises(ValidationError):
      CreateXxxService(user=self.user).perform()
```

## 뷰 테스트 패턴

```python
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken

class XxxViewTests(TestCase):
  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(is_email_confirmed=True)
    token = AccessToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
```
