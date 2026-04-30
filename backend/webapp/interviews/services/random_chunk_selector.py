"""RandomChunkSelector 서비스.

청크 풀에서 순수 균등 랜덤으로 N개의 청크를 선택한다.
가중치나 우선순위 없이 random.sample()을 사용한다.
"""

from __future__ import annotations

import random

from interviews.schemas.chunk_item import ChunkItem


class RandomChunkSelector:
  """청크 풀에서 순수 균등 랜덤으로 N개의 ChunkItem을 선택한다."""

  def select(self, chunk_pool: list[ChunkItem], n: int) -> list[ChunkItem]:
    """청크 풀에서 N개의 ChunkItem을 랜덤 선택하여 반환한다.

    Args:
      chunk_pool: 선택 대상 청크 풀.
      n: 선택할 청크 수.

    Returns:
      선택된 ChunkItem 리스트.
      풀이 비어있으면 빈 리스트, 풀 크기 < N이면 전체 반환.
    """
    if not chunk_pool:
      return []
    if len(chunk_pool) <= n:
      return list(chunk_pool)
    return random.sample(chunk_pool, n)
