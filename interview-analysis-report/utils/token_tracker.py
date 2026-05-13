"""LLM 토큰 사용량 추적 콜백 핸들러."""

from __future__ import annotations

import logging
from dataclasses import dataclass

from langchain_core.callbacks import BaseCallbackHandler
from langchain_core.outputs import LLMResult

# 모델별 요금표 (USD / 1M tokens)
MODEL_PRICING: dict[str, dict[str, float]] = {
    "gpt-4o-mini": {
        "input": 0.15,
        "output": 0.60,
    },
    "gpt-4o": {
        "input": 2.50,
        "output": 10.00,
    },
}
_DEFAULT_MODEL = "gpt-4o-mini"


@dataclass
class TokenUsageStats:
    """토큰 사용량 통계 데이터."""

    input_tokens: int = 0
    output_tokens: int = 0
    total_tokens: int = 0
    call_count: int = 0


def calculate_cost(
    input_tokens: int, output_tokens: int, model_name: str = _DEFAULT_MODEL
) -> float:
    """토큰 수와 모델명으로 USD 비용을 계산한다."""
    pricing = MODEL_PRICING.get(model_name, MODEL_PRICING[_DEFAULT_MODEL])
    return (
        input_tokens / 1_000_000 * pricing["input"]
        + output_tokens / 1_000_000 * pricing["output"]
    )


logger = logging.getLogger(__name__)


class TokenUsageCallback(BaseCallbackHandler):

    def __init__(self) -> None:
        super().__init__()
        self._input_tokens: int = 0
        self._output_tokens: int = 0
        self._total_tokens: int = 0
        self._call_count: int = 0

    def on_llm_end(self, response: LLMResult, **kwargs) -> None:
        try:
            self._call_count += 1
            usage = self._extract_usage(response)
            if usage:
                self._input_tokens += max(0, usage.get("input_tokens", 0))
                self._output_tokens += max(0, usage.get("output_tokens", 0))
                self._total_tokens += max(0, usage.get("total_tokens", 0))
        except Exception:
            logger.warning("토큰 사용량 추출 중 오류 발생", exc_info=True)

    def _extract_usage(self, response: LLMResult) -> dict | None:
        llm_output = response.llm_output
        if not llm_output:
            return None
        if "token_usage" in llm_output:
            token_usage = llm_output["token_usage"]
            if token_usage:
                return {
                    "input_tokens": token_usage.get("prompt_tokens", 0),
                    "output_tokens": token_usage.get("completion_tokens", 0),
                    "total_tokens": token_usage.get("total_tokens", 0),
                }
        if "usage" in llm_output:
            usage = llm_output["usage"]
            if usage:
                input_tokens = usage.get("input_tokens", 0)
                output_tokens = usage.get("output_tokens", 0)
                return {
                    "input_tokens": input_tokens,
                    "output_tokens": output_tokens,
                    "total_tokens": input_tokens + output_tokens,
                }
        return None

    def reset(self) -> None:
        self._input_tokens = 0
        self._output_tokens = 0
        self._total_tokens = 0
        self._call_count = 0

    def get_usage(self) -> TokenUsageStats:
        return TokenUsageStats(
            input_tokens=self._input_tokens,
            output_tokens=self._output_tokens,
            total_tokens=self._total_tokens,
            call_count=self._call_count,
        )
