from rest_framework import serializers


class AuthResponseSerializer(serializers.Serializer):
  """로그인/회원가입 공통 응답"""
  access = serializers.CharField()
  refresh = serializers.CharField()
  is_email_confirmed = serializers.BooleanField()
  is_profile_completed = serializers.BooleanField()


class UserMeSerializer(serializers.Serializer):
  """GET /api/v1/users/me 응답"""
  name = serializers.CharField()
  email = serializers.EmailField()
  is_email_confirmed = serializers.BooleanField()
  is_profile_completed = serializers.BooleanField()
