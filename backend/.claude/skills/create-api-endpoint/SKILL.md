---
name: create-api-endpoint
description: DRF API 엔드포인트를 생성합니다. API 추가, 뷰 생성, 엔드포인트 만들기, REST API 구현 등의 요청 시 사용합니다. ViewSet/APIView, Serializer, URL 패턴을 프로젝트 규칙에 맞게 생성합니다.
---

# API 엔드포인트 생성 Skill

## 목적
MeFit 프로젝트 규칙에 맞는 DRF API 엔드포인트를 생성한다.

## 절차

### 1. 뷰 베이스 클래스 선택

| 용도 | 베이스 클래스 | 인증 |
|---|---|---|
| CRUD ViewSet | `BaseViewSet` | 필수 |
| 커스텀 액션 ViewSet | `BaseGenericViewSet` + Mixin | 필수 |
| 단일 엔드포인트 | `BaseAPIView` | 필수 |
| 비인증 읽기 전용 | `BaseReadOnlyViewSet` | 불필요 |
| 비인증 목록 조회 | `BaseListAPIView` | 불필요 |

### 2. 뷰 파일 생성

위치: `webapp/api/v1/{앱명}/views/{뷰명_snake_case}.py`

```python
"""뷰 설명 (한국어)."""

from api.v1.{앱명}.serializers import (
  Create모델Serializer,
  모델Serializer,
)
from common.permissions import IsEmailVerified
from common.views import BaseGenericViewSet
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.mixins import CreateModelMixin, ListModelMixin, RetrieveModelMixin
from rest_framework.response import Response
from {앱명}.services import Create모델Service


@extend_schema(tags=["태그명"])
class 모델ViewSet(
  CreateModelMixin,
  ListModelMixin,
  RetrieveModelMixin,
  BaseGenericViewSet,
):
  permission_classes = [IsEmailVerified]

  def get_serializer_class(self):
    if self.action == "create":
      return Create모델Serializer
    return 모델Serializer

  def get_queryset(self):
    return 모델.objects.filter(
      user=self.current_user
    ).select_related("관련모델").order_by("-created_at")

  @extend_schema(summary="목록 조회")
  def list(self, request, *args, **kwargs):
    return super().list(request, *args, **kwargs)

  @extend_schema(summary="생성", request=Create모델Serializer, responses=모델Serializer)
  def create(self, request, *args, **kwargs):
    serializer = Create모델Serializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    result = create_모델(user=self.current_user, **serializer.validated_data)
    return Response(모델Serializer(result).data, status=status.HTTP_201_CREATED)
```

### 3. Serializer 생성

위치: `webapp/api/v1/{앱명}/serializers/{시리얼라이저명_snake_case}.py`

```python
"""시리얼라이저 설명 (한국어)."""

from rest_framework import serializers
from {앱명}.models import 모델


class 모델Serializer(serializers.ModelSerializer):
  class Meta:
    model = 모델
    fields = ("uuid", "title", "created_at", "updated_at")
    read_only_fields = fields


class Create모델Serializer(serializers.Serializer):
  title = serializers.CharField(max_length=200)
```

### 4. URL 등록

위치: `webapp/api/v1/{앱명}/urls.py`

```python
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from api.v1.{앱명}.views import 모델ViewSet

router = DefaultRouter(trailing_slash=True)
router.register("모델-복수형-kebab", 모델ViewSet, basename="모델-단수형")

urlpatterns = [
  path("", include(router.urls)),
]
```

### 5. __init__.py 업데이트
- `views/__init__.py`에 뷰 export
- `serializers/__init__.py`에 시리얼라이저 export

### 6. 상위 URL 등록 확인
`webapp/api/v1/urls.py`에 앱 URL이 포함되어 있는지 확인.

## 체크리스트
- [ ] 적절한 베이스 뷰 상속
- [ ] permission_classes 설정
- [ ] @extend_schema 데코레이터 적용
- [ ] get_serializer_class()로 액션별 분기
- [ ] select_related/prefetch_related 적용
- [ ] read_only_fields 명시
- [ ] URL kebab-case 사용
- [ ] 비즈니스 로직은 서비스에 위임
