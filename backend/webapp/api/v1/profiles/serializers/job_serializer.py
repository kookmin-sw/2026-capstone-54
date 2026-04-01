from profiles.models import Job
from rest_framework import serializers


class JobSerializer(serializers.ModelSerializer):
  """직업 직렬화"""

  class Meta:
    model = Job
    fields = [
      "id",
      "name",
    ]
