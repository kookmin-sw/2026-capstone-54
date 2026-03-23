from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardPagination(PageNumberPagination):
  page_size_query_param = "per_page"
  max_page_size = 100
  page_size = 10

  def get_paginated_response(self, data):
    """페이지네이션 응답을 커스텀 형식으로 반환"""
    return Response(
      {
        "count": self.page.paginator.count,
        "totalPagesCount": self.page.paginator.num_pages,
        "nextPage": self.get_next_page_number(),
        "previousPage": self.get_previous_page_number(),
        "results": data,
      },
    )

  def get_paginated_response_schema(self, schema):
    """drf-spectacular용 페이지네이션 응답 스키마 정의"""
    return {
      "type": "object",
      "required": ["count", "totalPagesCount", "results"],
      "properties": {
        "count": {
          "type": "integer",
          "description": "전체 항목 수",
          "example": 100,
        },
        "totalPagesCount": {
          "type": "integer",
          "description": "전체 페이지 수",
          "example": 10,
        },
        "nextPage": {
          "type": "integer",
          "nullable": True,
          "description": "다음 페이지 번호",
          "example": 2,
        },
        "previousPage": {
          "type": "integer",
          "nullable": True,
          "description": "이전 페이지 번호",
          "example": None,
        },
        "results": schema,
      },
    }

  def get_next_page_number(self):
    """다음 페이지 번호 반환"""
    if self.page.has_next():
      return self.page.next_page_number()
    return None

  def get_previous_page_number(self):
    """이전 페이지 번호 반환"""
    if self.page.has_previous():
      return self.page.previous_page_number()
    return None
