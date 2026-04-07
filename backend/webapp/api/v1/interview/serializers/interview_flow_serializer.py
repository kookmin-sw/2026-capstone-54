"""면접 진행 흐름 API용 Serializer."""

from rest_framework import serializers


class InterviewStartRequestSerializer(serializers.Serializer):
  """면접 시작 요청: 파일 경로, 난이도를 받아 질문 생성."""

  file_paths = serializers.ListField(
    child=serializers.CharField(max_length=500),
    min_length=1,
    help_text="이력서/채용공고 파일 경로 리스트",
  )
  difficulty_level = serializers.ChoiceField(
    choices=["friendly", "normal", "pressure"],
    default="normal",
    help_text="면접 난이도",
  )
  num_questions = serializers.IntegerField(default=3, min_value=1, max_value=10, help_text="생성할 질문 수")
  model_name = serializers.CharField(max_length=50, default="gpt-4o-mini")
  is_auto = serializers.BooleanField(default=False)


class InterviewQuestionResponseSerializer(serializers.Serializer):
  """생성된 면접 질문 1개."""

  question = serializers.CharField()
  source = serializers.CharField()


class InterviewStartResponseSerializer(serializers.Serializer):
  """면접 시작 응답: 세션 정보 + 생성된 질문 목록."""

  session_id = serializers.IntegerField()
  questions = InterviewQuestionResponseSerializer(many=True)
  total_chunks_retrieved = serializers.IntegerField()
  token_usage = serializers.DictField(allow_null=True)


class InterviewAnswerRequestSerializer(serializers.Serializer):
  """답변 제출 + 꼬리질문 요청."""

  question = serializers.CharField(help_text="현재 질문 텍스트")
  answer = serializers.CharField(help_text="사용자 답변")
  exchange_type = serializers.ChoiceField(choices=["initial", "followup"], default="initial")
  depth = serializers.IntegerField(default=0, min_value=0)
  anchor_question = serializers.CharField(required=False, allow_blank=True, default="", help_text="원래 메인 질문")
  history = serializers.ListField(
    child=serializers.DictField(),
    required=False,
    default=list,
    help_text="이전 대화 히스토리 [{question, answer}, ...]",
  )
  generate_followup = serializers.BooleanField(default=True, help_text="꼬리질문 생성 여부")
  num_followups = serializers.IntegerField(default=1, min_value=1, max_value=5)
  question_source = serializers.CharField(
    required=False, allow_blank=True, default="", help_text="질문 출처 (resume, job_posting)"
  )
  question_purpose = serializers.CharField(
    required=False, allow_blank=True, default="", help_text="질문 출제 목적 (꼬리질문의 rationale)"
  )


class FollowUpQuestionResponseSerializer(serializers.Serializer):
  """꼬리질문 1개."""

  question = serializers.CharField()
  rationale = serializers.CharField()


class InterviewAnswerResponseSerializer(serializers.Serializer):
  """답변 제출 응답: 저장된 exchange + 꼬리질문."""

  exchange_id = serializers.IntegerField()
  followup_questions = FollowUpQuestionResponseSerializer(many=True, required=False)
  token_usage = serializers.DictField(allow_null=True, required=False)


class InterviewFinishResponseSerializer(serializers.Serializer):
  """면접 종료 응답."""

  session_id = serializers.IntegerField()
  status = serializers.CharField()
  duration_seconds = serializers.IntegerField(allow_null=True)
  total_input_tokens = serializers.IntegerField()
  total_output_tokens = serializers.IntegerField()
  total_tokens = serializers.IntegerField()
  total_cost_usd = serializers.DecimalField(max_digits=10, decimal_places=6)
