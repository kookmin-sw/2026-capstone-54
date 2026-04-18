"""면접 녹화 시리얼라이저."""

from rest_framework import serializers


class InitiateRecordingSerializer(serializers.Serializer):
  turn_id = serializers.IntegerField()
  media_type = serializers.ChoiceField(choices=["video", "audio"])


class CompleteRecordingPartSerializer(serializers.Serializer):
  part_number = serializers.IntegerField()
  etag = serializers.CharField()


class CompleteRecordingSerializer(serializers.Serializer):
  parts = CompleteRecordingPartSerializer(many=True)
  end_timestamp = serializers.DateTimeField()
  duration_ms = serializers.IntegerField()


class PresignedUrlItemSerializer(serializers.Serializer):
  part_number = serializers.IntegerField(source="partNumber")
  url = serializers.URLField()


class InitiateRecordingResponseSerializer(serializers.Serializer):
  recording_id = serializers.UUIDField(source="recordingId")
  upload_id = serializers.CharField(source="uploadId")
  s3_key = serializers.CharField(source="s3Key")
  presigned_urls = PresignedUrlItemSerializer(many=True, source="presignedUrls")


class RecordingListSerializer(serializers.Serializer):
  recording_id = serializers.UUIDField(source="pk")
  turn_id = serializers.IntegerField(source="interview_turn_id")
  media_type = serializers.CharField()
  status = serializers.CharField()
  duration_ms = serializers.IntegerField(allow_null=True)
  created_at = serializers.DateTimeField()


class PlaybackUrlResponseSerializer(serializers.Serializer):
  url = serializers.CharField()
  scaled_url = serializers.CharField(source="scaledUrl", allow_null=True)
  audio_url = serializers.CharField(source="audioUrl", allow_null=True)
  expires_in = serializers.IntegerField(source="expiresIn")
  media_type = serializers.CharField(source="mediaType")
