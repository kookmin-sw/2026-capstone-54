"""
drf-spectacular postprocessing hook.

모든 엔드포인트에 공통 에러 응답 스키마를 자동 주입한다.
"""

ERROR_SCHEMA = {
  "type": "object",
  "properties": {
    "errorCode": {
      "type": "string",
      "description": "에러 코드",
    },
    "message": {
      "type": "string",
      "description": "에러 메시지",
    },
  },
  "required": ["errorCode", "message"],
}

VALIDATION_ERROR_SCHEMA = {
  "type": "object",
  "properties": {
    "errorCode": {
      "type": "string",
      "description": "에러 코드",
    },
    "message": {
      "type": "string",
      "description": "에러 메시지",
    },
    "fieldErrors": {
      "type": "object",
      "additionalProperties": {
        "type": "array",
        "items": {
          "type": "string"
        },
      },
      "description": "필드별 에러 목록",
    },
  },
  "required": ["errorCode", "message"],
}

ERROR_RESPONSES = {
  "400": {
    "description": "입력값이 올바르지 않습니다.",
    "content": {
      "application/json": {
        "schema": VALIDATION_ERROR_SCHEMA
      },
    },
  },
  "401": {
    "description": "인증이 필요합니다.",
    "content": {
      "application/json": {
        "schema": ERROR_SCHEMA
      },
    },
  },
  "403": {
    "description": "접근 권한이 없습니다.",
    "content": {
      "application/json": {
        "schema": ERROR_SCHEMA
      },
    },
  },
  "404": {
    "description": "요청한 리소스를 찾을 수 없습니다.",
    "content": {
      "application/json": {
        "schema": ERROR_SCHEMA
      },
    },
  },
  "500": {
    "description": "서버 내부 오류가 발생했습니다.",
    "content": {
      "application/json": {
        "schema": ERROR_SCHEMA
      },
    },
  },
}


def inject_error_responses(result, generator, **kwargs):
  """모든 엔드포인트에 공통 에러 응답을 주입한다."""
  for path_item in result.get("paths", {}).values():
    for operation in path_item.values():
      if not isinstance(operation, dict):
        continue
      responses = operation.get("responses", {})
      for status_code, error_response in ERROR_RESPONSES.items():
        if status_code not in responses:
          responses[status_code] = error_response
  return result
