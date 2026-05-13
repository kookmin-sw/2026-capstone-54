---
inclusion: fileMatch
fileMatchPattern: "**/views/**/*.py"
---

# DRF View 작성 가이드

## 베이스 클래스 선택

| 용도 | 베이스 클래스 | 인증 |
|---|---|---|
| CRUD ViewSet | `BaseViewSet` | IsAuthenticated |
| 커스텀 액션 ViewSet | `BaseGenericViewSet` + Mixin | IsAuthenticated |
| 단일 엔드포인트 | `BaseAPIView` | IsAuthenticated |
| 비인증 읽기 전용 | `BaseReadOnlyViewSet` | AllowAny |
| 비인증 목록 조회 | `BaseListAPIView` | AllowAny |

## 필수 규칙

- `self.current_user`로 현재 사용자 접근
- `@extend_schema(tags=["태그"], summary="설명")` 데코레이터 필수
- 비즈니스 로직은 서비스에 위임 (뷰에 직접 작성 금지)
- `get_serializer_class()`로 액션별 Serializer 분기
- QuerySet에 `select_related()` / `prefetch_related()` 적용

## 권한 클래스

- `IsAuthenticated` — JWT 인증
- `IsEmailVerified` — 이메일 인증 완료
- `IsProfileCompleted` — 이메일 인증 + 프로필 작성 완료
- `AllowAny` — 비인증 허용

## 체크리스트

- 적절한 베이스 뷰 상속
- permission_classes 설정
- @extend_schema 데코레이터
- 서비스 위임 (뷰에 로직 금지)
- QuerySet 최적화
