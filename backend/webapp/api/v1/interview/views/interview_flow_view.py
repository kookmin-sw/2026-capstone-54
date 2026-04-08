"""면접 진행 흐름 API: 세션 생성 → 질문 생성 → 답변/꼬리질문 → 종료."""

from api.v1.interview.serializers.interview_flow_serializer import (
  InterviewAnswerRequestSerializer,
  InterviewAnswerResponseSerializer,
  InterviewFinishResponseSerializer,
  InterviewGenerateQuestionsRequestSerializer,
  InterviewGenerateQuestionsResponseSerializer,
  InterviewSessionCreateRequestSerializer,
  InterviewSessionCreateResponseSerializer,
)
from common.permissions import AllowAny
from common.views import BaseAPIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from interview.enums import InterviewSessionStatus
from interview.models import InterviewExchange, InterviewSession
from interview.services.interview_service import InterviewService
from interview.services.rag_pipeline.token_tracker import calculate_cost
from rest_framework import status
from rest_framework.response import Response


@extend_schema(tags=["면접 진행"])
class InterviewSessionCreateAPIView(BaseAPIView):
  """면접 세션 생성."""

  permission_classes = [AllowAny]

  @extend_schema(
    summary="면접 세션 생성",
    request=InterviewSessionCreateRequestSerializer,
    responses={201: InterviewSessionCreateResponseSerializer},
  )
  def post(self, request):
    serializer = InterviewSessionCreateRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    session = InterviewSession.objects.create(
      model_name=data["model_name"],
      is_auto=data["is_auto"],
      difficulty_level=data["difficulty_level"],
      status=InterviewSessionStatus.IN_PROGRESS,
      started_at=timezone.now(),
      resume_file=data["file_paths"][0] if data["file_paths"] else "",
      job_posting_file=data["file_paths"][1] if len(data["file_paths"]) > 1 else "",
    )

    return Response(
      {
        "session_id": session.id,
        "status": session.status
      },
      status=status.HTTP_201_CREATED,
    )


@extend_schema(tags=["면접 진행"])
class InterviewGenerateQuestionsAPIView(BaseAPIView):
  """면접 질문 생성."""

  permission_classes = [AllowAny]

  @staticmethod
  def _resolve_source(file_path: str, file_paths: list[str]) -> str:
    """RAG 파이프라인의 source 파일 경로를 resume/job_posting으로 변환한다."""
    if not file_path:
      return ""
    resume_file = file_paths[0] if file_paths else ""
    job_posting_file = file_paths[1] if len(file_paths) > 1 else ""
    if resume_file and file_path == resume_file:
      return "resume"
    if job_posting_file and file_path == job_posting_file:
      return "job_posting"
    lower = file_path.lower()
    if "resume" in lower or "이력서" in lower:
      return "resume"
    if "job" in lower or "채용" in lower or "posting" in lower:
      return "job_posting"
    return ""

  @extend_schema(
    summary="면접 질문 생성",
    request=InterviewGenerateQuestionsRequestSerializer,
    responses={201: InterviewGenerateQuestionsResponseSerializer},
  )
  def post(self, request, session_id):
    session = get_object_or_404(InterviewSession, id=session_id)

    if session.status != InterviewSessionStatus.IN_PROGRESS:
      return Response(
        {"detail": "진행 중인 세션에서만 질문을 생성할 수 있습니다."},
        status=status.HTTP_400_BAD_REQUEST,
      )

    # 이미 질문이 생성된 세션인지 확인
    if session.total_initial_questions > 0:
      return Response(
        {"detail": "이미 질문이 생성된 세션입니다."},
        status=status.HTTP_409_CONFLICT,
      )

    serializer = InterviewGenerateQuestionsRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    file_paths = [f for f in [session.resume_file, session.job_posting_file] if f]

    service = InterviewService()
    output = service.generate_questions(
      file_paths=file_paths,
      difficulty_level=session.difficulty_level,
    )

    # 세션 업데이트
    session.total_initial_questions = len(output.questions)
    session.total_chunks_retrieved = output.total_chunks_retrieved
    session.question_sources = {q.question: self._resolve_source(q.source, file_paths) for q in output.questions}
    update_fields = ["total_initial_questions", "total_chunks_retrieved", "question_sources"]

    if output.token_usage:
      session.total_input_tokens = output.token_usage.input_tokens
      session.total_output_tokens = output.token_usage.output_tokens
      session.total_tokens = output.token_usage.total_tokens
      cost = calculate_cost(
        output.token_usage.input_tokens,
        output.token_usage.output_tokens,
        model_name=session.model_name,
      )
      session.total_cost_usd = round(cost, 6)
      update_fields += ["total_input_tokens", "total_output_tokens", "total_tokens", "total_cost_usd"]

    session.save(update_fields=update_fields)

    response_data = {
      "session_id": session.id,
      "questions": [{
        "question": q.question,
        "source": q.source
      } for q in output.questions],
      "total_chunks_retrieved": output.total_chunks_retrieved,
      "token_usage": output.token_usage.model_dump() if output.token_usage else None,
    }
    return Response(response_data, status=status.HTTP_201_CREATED)


@extend_schema(tags=["면접 진행"])
class InterviewAnswerAPIView(BaseAPIView):
  """답변 제출 + 꼬리질문 생성."""

  permission_classes = [AllowAny]

  @extend_schema(
    summary="답변 제출 및 꼬리질문 생성",
    request=InterviewAnswerRequestSerializer,
    responses={201: InterviewAnswerResponseSerializer},
  )
  def post(self, request, session_id):
    serializer = InterviewAnswerRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    session = get_object_or_404(InterviewSession, id=session_id)

    # question_source 자동 결정: 클라이언트 값 우선, 없으면 세션 캐시에서 조회
    question_source = data.get("question_source", "")
    if not question_source and data["exchange_type"] == "initial":
      question_source = (session.question_sources or {}).get(data["question"], "")

    # question_purpose 자동 결정: 클라이언트 값 우선
    question_purpose = data.get("question_purpose", "")
    if not question_purpose and data["exchange_type"] == "followup":
      cached = (session.question_sources or {}).get(data["question"], "")
      if cached.startswith("purpose:"):
        question_purpose = cached[len("purpose:"):]

    # exchange 저장
    exchange = InterviewExchange.objects.create(
      session=session,
      exchange_type=data["exchange_type"],
      depth=data["depth"],
      question=data["question"],
      answer=data["answer"],
      question_source=question_source,
      question_purpose=question_purpose,
    )

    # 세션 통계 갱신
    from django.db.models import Avg
    from django.db.models.functions import Length

    exchanges = session.exchanges.all()
    session.total_initial_questions = exchanges.filter(exchange_type="initial").count()
    session.total_followup_questions = exchanges.filter(exchange_type="followup").count()
    avg_len = exchanges.annotate(answer_len=Length("answer")).aggregate(avg=Avg("answer_len"))["avg"]
    session.avg_answer_length = int(avg_len) if avg_len else 0
    session.save(update_fields=["total_initial_questions", "total_followup_questions", "avg_answer_length"])

    response_data = {
      "exchange_id": exchange.id,
      "followup_questions": [],
      "token_usage": None,
    }

    # 꼬리질문 생성
    if data["generate_followup"]:
      service = InterviewService()

      # DB에서 히스토리 구성: 현재 세션의 모든 exchange를 시간순 조회
      previous_exchanges = InterviewExchange.objects.filter(session=session, ).order_by("created_at")
      history = [{"question": ex.question, "answer": ex.answer} for ex in previous_exchanges]

      # anchor_question 결정: 가장 첫 번째 초기 질문 (depth=0)
      first_initial = previous_exchanges.filter(exchange_type="initial").first()
      anchor_question = first_initial.question if first_initial else data["question"]

      followup_output = service.generate_followups(
        session_id=session.id,
        original_question=data["question"],
        user_answer=data["answer"],
        num_followups=data["num_followups"],
        history=history,
        anchor_question=anchor_question,
      )

      response_data["followup_questions"] = [
        {
          "question": fq.question,
          "rationale": fq.rationale
        } for fq in followup_output.followup_questions
      ]

      # 꼬리질문의 rationale을 세션 캐시에 저장 (다음 답변 제출 시 question_purpose로 자동 매핑)
      sources = session.question_sources or {}
      for fq in followup_output.followup_questions:
        if fq.question and fq.rationale:
          sources[fq.question] = f"purpose:{fq.rationale}"
      session.question_sources = sources
      session.save(update_fields=["question_sources"])

      if followup_output.token_usage:
        usage = followup_output.token_usage
        exchange.input_tokens = usage.input_tokens
        exchange.output_tokens = usage.output_tokens
        exchange.total_tokens = usage.total_tokens
        exchange.save(update_fields=["input_tokens", "output_tokens", "total_tokens"])

        # 세션 토큰 누적
        session.total_input_tokens += usage.input_tokens
        session.total_output_tokens += usage.output_tokens
        session.total_tokens += usage.total_tokens
        cost_increment = calculate_cost(usage.input_tokens, usage.output_tokens, model_name=session.model_name)
        session.total_cost_usd += round(cost_increment, 6)
        session.save(update_fields=[
          "total_input_tokens",
          "total_output_tokens",
          "total_tokens",
          "total_cost_usd",
        ])

        response_data["token_usage"] = usage.model_dump()

    return Response(response_data, status=status.HTTP_201_CREATED)


@extend_schema(tags=["면접 진행"])
class InterviewFinishAPIView(BaseAPIView):
  """면접 종료: 상태 완료 처리 + 최종 통계."""

  permission_classes = [AllowAny]

  @extend_schema(
    summary="면접 종료",
    responses={200: InterviewFinishResponseSerializer},
  )
  def post(self, request, session_id):
    session = get_object_or_404(InterviewSession, id=session_id)

    if session.status != InterviewSessionStatus.IN_PROGRESS:
      return Response(
        {"detail": f"세션이 이미 '{session.get_status_display()}' 상태입니다."},
        status=status.HTTP_409_CONFLICT,
      )

    session.status = InterviewSessionStatus.COMPLETED
    session.finished_at = timezone.now()
    if session.started_at:
      session.duration_seconds = int((session.finished_at - session.started_at).total_seconds())

    session.save(update_fields=["status", "finished_at", "duration_seconds"])

    response_data = {
      "session_id": session.id,
      "status": session.status,
      "duration_seconds": session.duration_seconds,
      "total_input_tokens": session.total_input_tokens,
      "total_output_tokens": session.total_output_tokens,
      "total_tokens": session.total_tokens,
      "total_cost_usd": session.total_cost_usd,
    }
    return Response(response_data)
