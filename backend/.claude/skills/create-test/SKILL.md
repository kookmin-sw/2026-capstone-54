---
name: create-test
description: Django 테스트 코드를 생성합니다. 테스트 작성, 테스트 추가, 단위 테스트 생성 등의 요청 시 사용합니다. Factory Boy, mock 패턴, 한국어 메서드명 등 프로젝트 테스트 규칙을 적용합니다.
---

# Django 테스트 생성 Skill

## 목적
MeFit 프로젝트 규칙에 맞는 테스트 코드를 생성한다.

## 테스트 위치 규칙

| 대상 | 위치 |
|---|---|
| 모델 테스트 | `webapp/{앱명}/tests/models/test_{모델명}.py` |
| 서비스 테스트 | `webapp/{앱명}/tests/services/test_{서비스명}.py` |
| Admin 테스트 | `webapp/{앱명}/tests/admin/test_{모델명}_admin.py` |
| Serializer 테스트 | `webapp/api/v1/{앱명}/tests/serializers/test_{시리얼라이저명}.py` |
| View 테스트 | `webapp/api/v1/{앱명}/tests/views/test_{뷰명}.py` |
| 속성 기반 테스트 | `webapp/{앱명}/tests/properties/test_{대상}.py` |

## 서비스 테스트 템플릿

```python
"""서비스 테스트 설명 (한국어)."""

from unittest.mock import patch

from django.test import TestCase
from {앱명}.services import CreateXxxService
from users.factories import UserFactory


class CreateXxxServiceTests(TestCase):
  """CreateXxxService 테스트."""

  def setUp(self):
    self.user = UserFactory()

  def test_정상_생성(self):
    """정상적으로 생성된다."""
    result = CreateXxxService(
      user=self.user,
      title="테스트",
    ).perform()

    self.assertIsNotNone(result.pk)
    self.assertEqual(result.title, "테스트")

  def test_필수값_누락_시_에러(self):
    """필수 kwargs 누락 시 ValidationError가 발생한다."""
    from django.core.exceptions import ValidationError

    with self.assertRaises(ValidationError):
      CreateXxxService(user=self.user).perform()

  @patch("앱명.services.외부_의존성")
  def test_외부_서비스_호출(self, mock_external):
    """외부 서비스가 올바르게 호출된다."""
    mock_external.return_value = "mocked"
    result = CreateXxxService(
      user=self.user,
      title="테스트",
    ).perform()

    mock_external.assert_called_once()
```

## 뷰 테스트 템플릿

```python
"""뷰 테스트 설명 (한국어)."""

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken
from users.factories import UserFactory


class XxxViewTests(TestCase):
  """XxxView 테스트."""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(is_email_confirmed=True)
    token = AccessToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

  def test_목록_조회(self):
    """인증된 사용자가 목록을 조회한다."""
    response = self.client.get("/api/v1/앱명/리소스/")
    self.assertEqual(response.status_code, status.HTTP_200_OK)

  def test_비인증_사용자_접근_거부(self):
    """비인증 사용자는 401을 받는다."""
    client = APIClient()
    response = client.get("/api/v1/앱명/리소스/")
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
```

## 핵심 규칙
- `django.test.TestCase` 사용 (트랜잭션 자동 롤백)
- Factory Boy로 테스트 데이터 생성
- 외부 의존성 (LLM, S3, Celery)은 `@patch`로 모킹
- 테스트 메서드명: 한국어 서술형 (`test_이력서_생성`)
- 정상 케이스 + 예외 케이스 모두 작성
- `__init__.py` 파일 생성 필수

## 체크리스트
- [ ] django.test.TestCase 사용
- [ ] Factory Boy로 데이터 생성
- [ ] 한국어 메서드명
- [ ] 정상 + 예외 케이스
- [ ] 외부 의존성 모킹
- [ ] __init__.py 생성
