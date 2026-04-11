"""전체 프로세스 면접 질문 생성기.

FULL_PROCESS 세션 타입에서 사용한다. 자기소개부터 마무리까지 10개 질문을 한 번에 생성한다.
"""

from interviews.schemas.question_generator_input import QuestionGeneratorInput
from interviews.services.llm.prompt_registry import PromptRegistry
from interviews.services.llm.question_generator import QuestionGenerator

_registry = PromptRegistry()

_FULL_PROCESS_QUESTION_COUNT = 10


class FullProcessInterviewQuestionGenerator(QuestionGenerator):
  """전체 프로세스 면접 질문 생성기 (FULL_PROCESS 세션 타입).

    자기소개 → 이력서 기반 → 직무 적합성 → 역량 검증 → 마무리 순서로
    10개 질문을 일괄 생성한다.
    """

  def _get_system_prompt(self, difficulty_level: str) -> str:
    return _registry.get_full_process_prompt()

  def _get_questions_count(self, input_data: QuestionGeneratorInput) -> int:
    return _FULL_PROCESS_QUESTION_COUNT
