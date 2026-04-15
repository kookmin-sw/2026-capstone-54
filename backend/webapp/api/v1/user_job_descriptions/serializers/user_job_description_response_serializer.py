from rest_framework import serializers


class UserJobDescriptionResponseSerializer(serializers.Serializer):
  uuid = serializers.UUIDField()
  job_description_id = serializers.IntegerField()
  collection_status = serializers.CharField()
  created_at = serializers.DateTimeField()
