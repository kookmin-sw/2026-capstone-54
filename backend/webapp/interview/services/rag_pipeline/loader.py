"""Document_Loader 모듈 - 마크다운 문서 로더."""

import os

from langchain_core.documents import Document


class DocumentLoader:
  """마크다운 문서 로더."""

  SUPPORTED_EXTENSIONS: set[str] = {".md", ".markdown"}

  def _validate_file(self, file_path: str) -> None:
    if not os.path.exists(file_path):
      raise FileNotFoundError(f"파일을 찾을 수 없습니다: {file_path}")
    ext = os.path.splitext(file_path)[1].lower()
    if ext not in self.SUPPORTED_EXTENSIONS:
      raise ValueError(f"지원하지 않는 파일 형식입니다: {ext} "
                       f"(지원 형식: {', '.join(sorted(self.SUPPORTED_EXTENSIONS))})")

  def load(self, file_path: str) -> Document:
    self._validate_file(file_path)
    with open(file_path, "r", encoding="utf-8") as f:
      content = f.read()
    return Document(page_content=content, metadata={"source": file_path})

  def load_multiple(self, file_paths: list[str]) -> list[Document]:
    return [self.load(fp) for fp in file_paths]
