---
inclusion: fileMatch
fileMatchPattern: "**/services/llm/**/*.py"
---

# LLM 서비스 작성 가이드

## 아키텍처

```
서비스 (GenerateXxxService)
  ├── get_llm() — LLM 인스턴스 팩토리 (common.llm_client)
  ├── Generator — QuestionGenerator 패턴 서브클래스
  │   ├── PromptRegistry — 프롬프트 중앙 관리
  │   └── with_structured_output() — Pydantic 스키마 파싱
  ├── TokenUsageCallback — 토큰 사용량 추적
  └── TokenUsage.log() — DB 기록
```

## 필수 규칙

1. LLM 인스턴스는 `get_llm()` 팩토리로 생성 (직접 생성 금지)
2. I/O 스키마는 Pydantic `BaseModel`로 정의 (`schemas/` 디렉토리)
3. LLM 호출은 반드시 트랜잭션 외부에서 수행
4. `TokenUsageCallback`으로 토큰 추적, `TokenUsage.log()`로 DB 기록
5. 프롬프트는 `PromptRegistry` 패턴으로 중앙 관리
6. `with_structured_output()`으로 타입 안전한 응답 파싱

## Generator 패턴

```python
from common.llm_client import get_llm
from .token_tracker import TokenUsageCallback

class XxxGenerator:
  def generate(self, input_data, callback=None):
    llm = get_llm()
    if callback:
      llm = llm.with_config(callbacks=[callback])
    structured_llm = llm.with_structured_output(OutputSchema)
    return structured_llm.invoke(prompt)
```

## 토큰 비용 기록

```python
from llm_trackers.models import TokenUsage
from interviews.services.llm import calculate_cost

TokenUsage.log(
  obj=대상_모델_인스턴스,
  operation=TokenOperation.COMPLETION,
  context=TokenUsageContext.XXX,
  model_name=model_name,
  input_tokens=usage.input_tokens,
  output_tokens=usage.output_tokens,
  cost_usd=calculate_cost(usage.input_tokens, usage.output_tokens, model_name),
)
```
