"""꼬리질문형 면접의 초기 질문 생성기.

FOLLOWUP 세션 타입에서 사용한다. 이력서·채용공고 기반으로 1개의 초기 질문을 생성한다.
"""

from interviews.constants import FOLLOWUP_ANCHOR_COUNT
from interviews.schemas.question_generator_input import QuestionGeneratorInput
from interviews.services.llm.prompt_registry import PromptRegistry
from interviews.services.llm.question_generator import QuestionGenerator

_registry = PromptRegistry()


class FollowupInterviewQuestionGenerator(QuestionGenerator):
  """꼬리질문형 면접 초기 질문 생성기 (FOLLOWUP 세션 타입).

    난이도별 면접관 페르소나 프롬프트를 사용하여 FOLLOWUP_ANCHOR_COUNT개의 앵커 질문을 생성한다.
    """

  def _get_system_prompt(self, input_data: QuestionGeneratorInput) -> str:
    return _registry.get_question_prompt(
      input_data.question_difficulty_level,
      company_name=input_data.company_name,
      job_title=input_data.job_title,
    )

  def _get_questions_count(self, input_data: QuestionGeneratorInput) -> int:
    return FOLLOWUP_ANCHOR_COUNT
