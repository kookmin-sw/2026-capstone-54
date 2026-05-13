from profiles.models import JobCategory
from rest_framework import serializers


class JobCategorySerializer(serializers.ModelSerializer):
  """직군 직렬화"""

  class Meta:
    model = JobCategory
    fields = [
      "id",
      "emoji",
      "name",
    ]
