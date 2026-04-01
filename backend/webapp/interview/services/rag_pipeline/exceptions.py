"""RAG 파이프라인 커스텀 예외."""


class PipelineStepError(Exception):
  """파이프라인 특정 단계에서 발생한 오류."""

  def __init__(self, step_name: str, original_error: Exception):
    self.step_name = step_name
    self.original_error = original_error
    super().__init__(f"[{step_name}] {original_error}")
