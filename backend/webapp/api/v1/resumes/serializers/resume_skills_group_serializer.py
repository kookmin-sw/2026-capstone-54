from rest_framework import serializers


class ResumeSkillsGroupSerializer(serializers.Serializer):
  technical = serializers.ListField(child=serializers.CharField(allow_blank=True), required=False)
  soft = serializers.ListField(child=serializers.CharField(allow_blank=True), required=False)
  tools = serializers.ListField(child=serializers.CharField(allow_blank=True), required=False)
  languages = serializers.ListField(child=serializers.CharField(allow_blank=True), required=False)
