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
