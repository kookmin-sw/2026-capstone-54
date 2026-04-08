from celery import current_app
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from rest_framework import serializers, status
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response


class ScrapeDemoRequestSerializer(serializers.Serializer):
  url = serializers.URLField()


@extend_schema(tags=["데모"])
class ScrapeDemoAPIView(BaseAPIView):
  """채용공고 스크래핑 태스크를 scraping worker에 발행한다. admin 전용."""

  permission_classes = [IsAdminUser]
  serializer_class = ScrapeDemoRequestSerializer

  @extend_schema(
    summary="채용공고 스크래핑 태스크 발행",
    request=ScrapeDemoRequestSerializer,
    responses={202: {
      "type": "object",
      "properties": {
        "task_id": {
          "type": "string"
        }
      }
    }},
  )
  def post(self, request):
    serializer = ScrapeDemoRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    task = current_app.send_task(
      "scraping.tasks.scrape_job_posting",
      args=[serializer.validated_data["url"]],
      queue="scraping",
    )
    return Response({"task_id": task.id}, status=status.HTTP_202_ACCEPTED)
