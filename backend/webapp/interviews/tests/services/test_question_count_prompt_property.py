"""Property 5: 질문 수 요청 정확성 속성 테스트.

Hypothesis로 랜덤 ChunkItem 리스트로 _build_prompt() 호출 후
질문 수 지시가 청크 수와 일치하는지 검증한다.

Validates: Requirements 4.3, 6.4
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


class Property5QuestionCountPromptTests(unittest.TestCase):
  """Property 5: 질문 수 요청 정확성."""

  @given(chunks=st.lists(chunk_item_strategy, min_size=1, max_size=20))
  @settings(max_examples=100, deadline=None)
  def test_prompt_question_count_matches_chunk_count(self, chunks):
    """Feature: chunk-based-question-generation, Property 5: 질문 수 요청 정확성

        For any ChunkItem 리스트에 대해, _build_prompt()가 생성하는 프롬프트 문자열은
        정확히 {len(chunks)}개 생성 형태의 질문 수 지시를 포함해야 한다.

        **Validates: Requirements 4.3, 6.4**
        """
    questions_count = len(chunks)
    input_data = QuestionGeneratorInput(
      resume_chunks=chunks,
      questions_count=questions_count,
      question_difficulty_level="normal",
    )
    system_prompt = "테스트 시스템 프롬프트"

    generator = QuestionGenerator()
    messages = generator._build_messages(system_prompt, input_data, questions_count)
    # HumanMessage의 content에서 질문 수 지시 검증
    prompt = messages[1].content

    expected_instruction = f"정확히 {questions_count}개 생성"
    self.assertIn(
      expected_instruction,
      prompt,
      f"프롬프트에 '{expected_instruction}' 지시가 포함되어야 합니다 (청크 수: {questions_count})",
    )
