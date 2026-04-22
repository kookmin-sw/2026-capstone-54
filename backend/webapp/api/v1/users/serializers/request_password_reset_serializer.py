from rest_framework import serializers  # # DRF 시리얼라이저 모듈


class RequestPasswordResetSerializer(serializers.Serializer):
  email = serializers.EmailField()  # 이메일 형식인지 자동 검증
