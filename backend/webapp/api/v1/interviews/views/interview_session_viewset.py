"""면접 세션 ViewSet — 목록 조회(GET) / 생성(POST) / 단건 조회(GET /:uuid/)."""

from api.v1.interviews.serializers import (
  CreateInterviewSessionSerializer,
  InterviewSessionSerializer,
)
from api.v1.interviews.serializers.interview_session_list_serializer import (
  InterviewSessionListSerializer,
)
from common.exceptions import ValidationException
from common.pagination import StandardPagination
from common.permissions import IsEmailVerified
from common.views import BaseGenericViewSet
from django.db.models import Prefetch
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from interviews.enums import InterviewExchangeType
from interviews.models import InterviewSession, InterviewTurn
from interviews.services import create_interview_session, get_interview_session_for_user
from job_descriptions.enums import CollectionStatus
from job_descriptions.models import UserJobDescription
from rest_framework import status
from rest_framework.generics import get_object_or_404
from rest_framework.mixins import CreateModelMixin, ListModelMixin, RetrieveModelMixin
from rest_framework.response import Response
from resumes.models import Resume
from subscriptions.enums import PlanType
from subscriptions.services import (
  GetCurrentSubscriptionService,
  PlanFeaturePolicyService,
)


@extend_schema(tags=["면접"])
class InterviewSessionViewSet(
  CreateModelMixin,
  ListModelMixin,
  RetrieveModelMixin,
  BaseGenericViewSet,
):
  permission_classes = [IsEmailVerified]
  pagination_class = StandardPagination
  lookup_field = "pk"

  # ── serializer 분기 ──────────────────────────────────────────────────

  def get_serializer_class(self):
    if self.action == "create":
      return CreateInterviewSessionSerializer
    if self.action == "list":
      return InterviewSessionListSerializer
    return InterviewSessionSerializer

  # ── queryset ─────────────────────────────────────────────────────────

  def get_queryset(self):
    initial_turns_qs = InterviewTurn.objects.filter(turn_type=InterviewExchangeType.INITIAL, ).order_by("turn_number")

    queryset = (
      InterviewSession.objects.filter(
        user=self.current_user
      ).select_related("resume", "user_job_description__job_description", "analysis_report").prefetch_related(
        Prefetch(
          "turns",
          queryset=initial_turns_qs,
          to_attr="_prefetched_initial_turns",
        )
      ).order_by("-created_at")
    )

    subscription = GetCurrentSubscriptionService(user=self.current_user).perform()
    plan_type = subscription.plan_type if subscription else PlanType.FREE
    history_days = PlanFeaturePolicyService.get_interview_session_history_days(plan_type)
    self._has_hidden_older_sessions = False

    if history_days is None:
      return queryset

    cutoff = timezone.now() - timezone.timedelta(days=history_days)
    self._has_hidden_older_sessions = queryset.filter(created_at__lt=cutoff).exists()
    return queryset.filter(created_at__gte=cutoff)

  # ── actions ──────────────────────────────────────────────────────────

  @extend_schema(summary="면접 세션 목록 조회")
  def list(self, request, *args, **kwargs):
    response = super().list(request, *args, **kwargs)
    if isinstance(response.data, dict):
      response.data["has_hidden_older_sessions"] = getattr(self, "_has_hidden_older_sessions", False)
    return response

  @extend_schema(
    summary="면접 세션 생성",
    request=CreateInterviewSessionSerializer,
    responses=InterviewSessionSerializer,
  )
  def create(self, request, *args, **kwargs):
    serializer = CreateInterviewSessionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    resume = get_object_or_404(Resume, pk=data["resume_uuid"], user=self.current_user)
    user_job_description = get_object_or_404(
      UserJobDescription.objects.select_related("job_description"),
      pk=data["user_job_description_uuid"],
      user=self.current_user,
    )

    # 수집이 완료되지 않은 채용공고로는 면접을 시작할 수 없다.
    if (user_job_description.job_description.collection_status != CollectionStatus.DONE):
      raise ValidationException("채용공고 수집이 완료된 후 면접을 시작할 수 있습니다.")

    session = create_interview_session(
      user=self.current_user,
      resume=resume,
      user_job_description=user_job_description,
      interview_session_type=data["interview_session_type"],
      interview_difficulty_level=data["interview_difficulty_level"],
      interview_practice_mode=data["interview_practice_mode"],
    )
    return Response(InterviewSessionSerializer(session).data, status=status.HTTP_201_CREATED)

  @extend_schema(summary="면접 세션 조회")
  def retrieve(self, request, *args, **kwargs):
    session = get_interview_session_for_user(self.kwargs["pk"], self.current_user)
    return Response(InterviewSessionSerializer(session).data)
