---
inclusion: fileMatch
fileMatchPattern: "**/serializers/**/*.py"
---

# DRF Serializer 작성 가이드

## 액션별 분리 원칙

- `CreateXxxSerializer` — 생성 요청용 (입력 필드만)
- `XxxSerializer` — 상세 조회 응답용
- `XxxListSerializer` — 목록 조회 응답용 (경량)

## 필수 규칙

```python
from rest_framework import serializers
from {앱명}.models import 모델

class 모델Serializer(serializers.ModelSerializer):
  class Meta:
    model = 모델
    fields = ("uuid", "title", "created_at", "updated_at")
    read_only_fields = fields  # 읽기 전용 필드 명시 필수

class Create모델Serializer(serializers.Serializer):
  title = serializers.CharField(max_length=200)
```

## ViewSet에서 분기

```python
def get_serializer_class(self):
  if self.action == "create":
    return Create모델Serializer
  if self.action == "list":
    return 모델ListSerializer
  return 모델Serializer
```

## 체크리스트

- read_only_fields 명시
- 액션별 Serializer 분리
- 중첩 시리얼라이저 사용 시 N+1 쿼리 유발 여부 확인
- CamelCase 변환은 자동 (djangorestframework-camel-case)
