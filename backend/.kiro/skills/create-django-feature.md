# Django 기능 생성 Skill

새로운 Django 기능(모델 + 서비스 + API + 테스트)을 프로젝트 규칙에 맞게 일괄 생성합니다.

## 절차

### 1단계: 도메인 레이어 생성

1. 모델 파일: `webapp/{앱명}/models/{모델명}.py`
   - 적절한 BaseModel 계열 상속
   - db_table, verbose_name, related_name 설정
2. enum 파일: `webapp/{앱명}/enums/{enum명}.py` (필요 시)
   - TextChoices 상속
3. 서비스 파일: `webapp/{앱명}/services/{서비스명}.py`
   - BaseService (쓰기) 또는 BaseQueryService (읽기)
   - required_kwargs / required_value_kwargs 설정
4. Factory 파일: `webapp/{앱명}/factories/{모델명}_factory.py`
5. 각 `__init__.py`에 `__all__` export 추가

### 2단계: API 레이어 생성

1. Serializer: `webapp/api/v1/{앱명}/serializers/{시리얼라이저명}.py`
   - 액션별 분리 (Create, Detail, List)
   - read_only_fields 명시
2. View: `webapp/api/v1/{앱명}/views/{뷰명}.py`
   - 적절한 베이스 뷰 상속
   - @extend_schema 데코레이터
   - 서비스 위임
3. URL: `webapp/api/v1/{앱명}/urls.py` 업데이트
4. 각 `__init__.py`에 export 추가

### 3단계: 검증

1. getDiagnostics로 구문/타입 오류 확인
2. 아키텍처 규칙 준수 확인
3. QuerySet 최적화 확인 (select_related, prefetch_related)

## 참조

#[[file:docs/ai-code-generation-guidelines.md]]
