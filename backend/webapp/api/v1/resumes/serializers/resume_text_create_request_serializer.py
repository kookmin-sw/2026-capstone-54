"""text 모드 이력서 생성 요청 serializer."""

from rest_framework import serializers


class ResumeTextCreateRequestSerializer(serializers.Serializer):
  """사용자가 직접 작성한 원문 텍스트로 이력서를 만든다 (LLM 분석 대상)."""

  title = serializers.CharField(max_length=255)
  content = serializers.CharField()
