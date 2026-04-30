"""Property 4: 프롬프트 청크 포맷 정확성 속성 테스트.

Hypothesis로 랜덤 ChunkItem 리스트로 _build_prompt() 호출 후
모든 청크의 라벨과 텍스트가 프롬프트에 포함되는지 검증한다.

Validates: Requirements 4.1, 4.2
"""

import unittest

from hypothesis import given, settings
from hypothesis import strategies as st
from interviews.schemas.chunk_item import ChunkItem
from interviews.schemas.question_generator_input import QuestionGeneratorInput
from interviews.services.llm.question_generator import QuestionGenerator

safe_text = st.text(
  min_size=1,
  max_size=100,
  alphabet=st.characters(whitelist_categories=("Lu", "Ll", "Nd", "Lo")),
)

chunk_item_strategy = st.builds(
  ChunkItem,
  source_label=st.sampled_from(["이력서", "채용공고"]),
  type_label=st.sampled_from(["경력", "스킬", "학력", "담당업무", "자격요건", "우대사항", "기본 정보", "프로젝트"]),
  text=safe_text,
)


class Property4PromptChunkFormatTests(unittest.TestCase):
  """Property 4: 프롬프트 청크 포맷 정확성."""

  @given(chunks=st.lists(chunk_item_strategy, min_size=1, max_size=10))
  @settings(max_examples=100, deadline=None)
  def test_all_chunk_labels_and_texts_appear_in_prompt(self, chunks):
    """Feature: chunk-based-question-generation, Property 4: 프롬프트 청크 포맷 정확성

        For any ChunkItem 리스트에 대해, _build_prompt()가 생성하는 프롬프트 문자열은
        모든 ChunkItem의 [{source_label} - {type_label}] 라벨과 text 내용을 포함해야 한다.

        **Validates: Requirements 4.1, 4.2**
        """
    input_data = QuestionGeneratorInput(
      chunks=chunks,
      questions_count=len(chunks),
      question_difficulty_level="normal",
    )
    system_prompt = "테스트 시스템 프롬프트"
    questions_count = len(chunks)

    generator = QuestionGenerator()
    prompt = generator._build_prompt(system_prompt, input_data, questions_count)

    for chunk in chunks:
      expected_label = f"[{chunk.source_label} - {chunk.type_label}]"
      self.assertIn(
        expected_label,
        prompt,
        f"프롬프트에 청크 라벨 '{expected_label}'이 포함되어야 합니다",
      )
      self.assertIn(
        chunk.text,
        prompt,
        f"프롬프트에 청크 텍스트 '{chunk.text[:50]}...'이 포함되어야 합니다",
      )
