"""면접 진행 흐름 API용 Serializer."""

from rest_framework import serializers


class InterviewSessionCreateRequestSerializer(serializers.Serializer):
  """세션 생성 요청: 파일 경로, 난이도 등 세션 기본 정보."""

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
  model_name = serializers.CharField(max_length=50, default="gpt-4o-mini")
  is_auto = serializers.BooleanField(default=False)


class InterviewSessionCreateResponseSerializer(serializers.Serializer):
  """세션 생성 응답."""

  session_id = serializers.IntegerField()
  status = serializers.CharField()


class InterviewGenerateQuestionsRequestSerializer(serializers.Serializer):
  """질문 생성 요청."""

  num_questions = serializers.IntegerField(default=3, min_value=1, max_value=10, help_text="생성할 질문 수")


class InterviewQuestionResponseSerializer(serializers.Serializer):
  """생성된 면접 질문 1개."""

  question = serializers.CharField()
  source = serializers.CharField()


class InterviewGenerateQuestionsResponseSerializer(serializers.Serializer):
  """질문 생성 응답."""

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
