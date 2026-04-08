"""RAG 파이프라인 커스텀 예외."""
from common.exceptions import BaseException


class PipelineStepException(BaseException):
  """파이프라인 특정 단계에서 발생한 오류."""

  default_detail = "파이프라인 처리 중 오류가 발생했습니다."
