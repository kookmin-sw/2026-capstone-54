from rest_framework import serializers


class AvatarSerializer(serializers.Serializer):
  avatar_url = serializers.SerializerMethodField()

  def get_avatar_url(self, obj):
    return obj.avatar.url if obj.avatar else None
