from profiles.models import Job, JobCategory, Profile
from rest_framework import serializers

from .job_category_serializer import JobCategorySerializer
from .job_serializer import JobSerializer


class ProfileSerializer(serializers.ModelSerializer):
  """프로필 직렬화 (쓰기: job_category_id / job_ids, 읽기: 중첩 객체)"""

  job_category_id = serializers.PrimaryKeyRelatedField(
    queryset=JobCategory.objects.all(),
    source="job_category",
    write_only=True,
  )
  job_ids = serializers.PrimaryKeyRelatedField(
    queryset=Job.objects.all(),
    many=True,
    source="jobs",
    write_only=True,
  )

  job_category = JobCategorySerializer(read_only=True)
  jobs = JobSerializer(many=True, read_only=True)

  class Meta:
    model = Profile
    fields = [
      "id",
      "user",
      "job_category_id",
      "job_ids",
      "job_category",
      "jobs",
      "created_at",
      "updated_at",
    ]
    read_only_fields = [
      "id",
      "user",
      "created_at",
      "updated_at",
    ]

  def validate(self, attrs):
    if not attrs.get("job_category"):
      raise serializers.ValidationError({"job_category_id": "희망 직군을 선택해주세요."})
    if not attrs.get("jobs"):
      raise serializers.ValidationError({"job_ids": "최소 1개 이상의 희망 직업을 선택해주세요."})
    return attrs

  def create(self, validated_data):
    jobs = validated_data.pop("jobs", [])
    profile = Profile.objects.create(**validated_data)
    profile.jobs.set(jobs)
    return profile

  def update(self, instance, validated_data):
    jobs = validated_data.pop("jobs", None)
    instance.job_category = validated_data.get("job_category", instance.job_category)
    instance.save()
    if jobs is not None:
      instance.jobs.set(jobs)
    return instance
