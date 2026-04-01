"""RAG 파이프라인 예외를 DRF 에러 응답으로 변환하는 모듈."""

from rest_framework.exceptions import APIException


class PipelineAPIError(APIException):
  """PipelineStepError를 DRF APIException으로 변환."""

  status_code = 500
  default_detail = "파이프라인 처리 중 오류가 발생했습니다."

  def __init__(self, pipeline_error):
    detail = {
      "error": "pipeline_step_error",
      "step": pipeline_error.step_name,
      "message": str(pipeline_error.original_error),
    }
    super().__init__(detail=detail)
