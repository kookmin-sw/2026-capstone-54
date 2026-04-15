"""file 모드 이력서 생성 요청 serializer."""

from rest_framework import serializers


class ResumeFileCreateRequestSerializer(serializers.Serializer):
  """PDF 파일 업로드로 이력서를 만든다 (PDF 추출 후 LLM 분석 대상)."""

  title = serializers.CharField(max_length=255)
  file = serializers.FileField()
