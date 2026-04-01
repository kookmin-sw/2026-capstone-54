"""키워드 기반 문서 검색 모듈."""

import logging

from interview.services.rag_pipeline.vector_store import VectorStoreManager
from langchain_core.documents import Document


class KeywordRetriever:

  def __init__(self, vector_store_manager: VectorStoreManager, top_k: int = 4):
    self.vector_store_manager = vector_store_manager
    self.top_k = top_k
    self.logger = logging.getLogger(__name__)

  def retrieve(self, keyword: str) -> list[Document]:
    results = self.vector_store_manager.search(keyword, k=self.top_k)
    if not results:
      self.logger.warning("키워드 '%s'에 대한 검색 결과가 없습니다.", keyword)
    return results

  def retrieve_multiple(self, keywords: list[str]) -> list[Document]:
    all_documents: list[Document] = []
    for keyword in keywords:
      all_documents.extend(self.retrieve(keyword))
    seen: set[str] = set()
    unique: list[Document] = []
    for doc in all_documents:
      if doc.page_content not in seen:
        seen.add(doc.page_content)
        unique.append(doc)
    return unique
