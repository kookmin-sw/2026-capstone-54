from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from users.models import User


class SignUpSerializer(serializers.Serializer):
  name = serializers.CharField(max_length=50, required=False, default="")
  email = serializers.EmailField()
  password1 = serializers.CharField(write_only=True)
  password2 = serializers.CharField(write_only=True)
  terms_document_ids = serializers.ListField(
    child=serializers.IntegerField(),
    required=False,
    default=list,
    write_only=True,
  )

  def validate_email(self, value):
    if User.objects.filter(email=value).exists():
      raise serializers.ValidationError("이미 사용 중인 이메일입니다.")
    return value

  def validate(self, attrs):
    if attrs["password1"] != attrs["password2"]:
      raise serializers.ValidationError({"password2": "비밀번호가 일치하지 않습니다."})
    try:
      validate_password(attrs["password1"])
    except DjangoValidationError as e:
      raise serializers.ValidationError({"password1": list(e.messages)})
    return attrs
