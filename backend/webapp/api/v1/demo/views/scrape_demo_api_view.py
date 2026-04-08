from celery import current_app
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from job_descriptions.models import JobDescription
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
    url = serializer.validated_data["url"]

    # 이미 수집된 URL이면 태스크를 발행하지 않는다.
    if JobDescription.objects.filter(url=url).exists():
      return Response({"detail": "이미 수집된 공고입니다."}, status=status.HTTP_409_CONFLICT)

    # pending 상태의 레코드를 생성한 뒤 스크래핑 태스크를 발행한다.
    # mark_in_progress()는 scraping/ 프로젝트의 태스크 시작 시점에서 처리한다.
    job_description = JobDescription.objects.create(url=url, collection_status="pending")

    task = current_app.send_task(
      "scraping.tasks.scrape_job_posting",
      args=[job_description.id, url],
      queue="scraping",
    )
    return Response({"task_id": task.id}, status=status.HTTP_202_ACCEPTED)
