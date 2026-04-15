from rest_framework import serializers

from .resume_skills_group_serializer import ResumeSkillsGroupSerializer


class ResumeSkillsRequestSerializer(serializers.Serializer):
  skills = ResumeSkillsGroupSerializer()
