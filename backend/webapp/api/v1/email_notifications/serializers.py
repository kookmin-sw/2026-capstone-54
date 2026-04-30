from rest_framework import serializers


class EmailNotificationSettingsResponseSerializer(serializers.Serializer):
  """프론트엔드 응답용. UserEmailNotificationSettings.to_consent_dict() 의 결과를 camelCase 로 직렬화."""

  streakReminder = serializers.BooleanField()
  streakExpire = serializers.BooleanField()
  reportReady = serializers.BooleanField()
  serviceNotice = serializers.BooleanField()
  marketing = serializers.BooleanField()


class UpdateEmailNotificationSettingsRequestSerializer(serializers.Serializer):
  """프론트엔드 요청용. PUT body 에서 camelCase boolean 을 받는다.

  모든 필드는 optional 이며, 전달된 키만 처리된다 (부분 업데이트 허용).
  """

  streakReminder = serializers.BooleanField(required=False)
  streakExpire = serializers.BooleanField(required=False)
  reportReady = serializers.BooleanField(required=False)
  serviceNotice = serializers.BooleanField(required=False)
  marketing = serializers.BooleanField(required=False)
