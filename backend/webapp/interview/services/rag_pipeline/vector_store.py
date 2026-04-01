"""벡터 저장소 관리 모듈."""

from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings
from langchain_core.vectorstores import VectorStore as LCVectorStore


class VectorStoreManager:

  def __init__(self, embeddings: Embeddings, store_type: str = "faiss"):
    self.embeddings = embeddings
    self.store_type = store_type
    self._store: LCVectorStore | None = None

  def build_from_documents(self, documents: list[Document]) -> None:
    if self.store_type == "faiss":
      from langchain_community.vectorstores import FAISS
      self._store = FAISS.from_documents(documents, self.embeddings)
    else:
      raise ValueError(f"지원하지 않는 벡터 저장소 타입: {self.store_type}")

  def search(self, query: str, k: int = 4) -> list[Document]:
    store = self.get_store()
    return store.similarity_search(query, k=k)

  def get_store(self) -> LCVectorStore:
    if self._store is None:
      raise RuntimeError("벡터 인덱스가 구축되지 않았습니다. 먼저 build_from_documents()를 호출하세요.")
    return self._store
