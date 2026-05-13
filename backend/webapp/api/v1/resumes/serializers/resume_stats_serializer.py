"""이력서 통계 API 응답 직렬화.

서비스가 반환한 snake_case dict 를 시리얼라이저로 한번 통과시켜 필드 계약을 명시한다.
실제 프론트 응답은 `CamelCaseJSONRenderer` 가 camelCase 로 렌더한다.
"""

from rest_framework import serializers


class ResumeCountStatsSerializer(serializers.Serializer):
  total = serializers.IntegerField()
  processing = serializers.IntegerField()
  pending = serializers.IntegerField()
  completed = serializers.IntegerField()
  failed = serializers.IntegerField()


class ResumeTypeStatsSerializer(serializers.Serializer):
  file_count = serializers.IntegerField()
  text_count = serializers.IntegerField()


class _TopSkillItemSerializer(serializers.Serializer):
  name = serializers.CharField()
  count = serializers.IntegerField()


class ResumeTopSkillsStatsSerializer(serializers.Serializer):
  top_skills = _TopSkillItemSerializer(many=True)
  total_unique_skills = serializers.IntegerField()


class ResumeRecentActivityStatsSerializer(serializers.Serializer):
  days = serializers.IntegerField()
  recently_analyzed_count = serializers.IntegerField()
