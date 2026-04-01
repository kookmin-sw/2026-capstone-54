"""Chunker 모듈 - 문서 청킹."""

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter


class Chunker:

  def __init__(self, chunk_size: int = 500, chunk_overlap: int = 50):
    self.chunk_size = chunk_size
    self.chunk_overlap = chunk_overlap
    self._splitter = RecursiveCharacterTextSplitter(
      chunk_size=chunk_size,
      chunk_overlap=chunk_overlap,
    )

  def split(self, document: Document) -> list[Document]:
    return self._splitter.split_documents([document])

  def split_multiple(self, documents: list[Document]) -> list[Document]:
    return self._splitter.split_documents(documents)
