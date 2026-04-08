"""면접 분석 리포트 API: 생성(POST) 및 조회(GET)."""

import logging

from api.v1.interview.serializers import (
  ReportCreateResponseSerializer,
  ReportDetailSerializer,
  ReportStatusSerializer,
)
from celery import current_app
from common.permissions import AllowAny
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from interview.enums import AnalysisReportStatus, InterviewSessionStatus
from interview.models import AnalysisReport, InterviewExchange, InterviewSession
from rest_framework import status
from rest_framework.response import Response

logger = logging.getLogger(__name__)


@extend_schema(tags=["면접 분석 리포트"])
class ReportAPIView(BaseAPIView):
  """면접 분석 리포트 생성 및 조회 API."""

  permission_classes = [AllowAny]

  @extend_schema(
    summary="리포트 생성 요청",
    responses={202: ReportCreateResponseSerializer},
  )
  def post(self, request, session_id):
    # 세션 존재 검증
    try:
      session = InterviewSession.objects.get(id=session_id)
    except InterviewSession.DoesNotExist:
      return Response(
        {"detail": "세션을 찾을 수 없습니다."},
        status=status.HTTP_404_NOT_FOUND,
      )

    # 세션 상태 검증 (completed 여부)
    if session.status != InterviewSessionStatus.COMPLETED:
      return Response(
        {"detail": "면접이 완료되지 않은 세션입니다."},
        status=status.HTTP_400_BAD_REQUEST,
      )

    # Exchange 존재 검증
    if not InterviewExchange.objects.filter(session=session).exists():
      return Response(
        {"detail": "답변 데이터가 없어 리포트를 생성할 수 없습니다."},
        status=status.HTTP_400_BAD_REQUEST,
      )

    # 기존 리포트 존재 시 삭제 후 재생성
    AnalysisReport.objects.filter(session=session).delete()

    # AnalysisReport 생성 (status=generating)
    report = AnalysisReport.objects.create(
      session=session,
      status=AnalysisReportStatus.GENERATING,
    )

    # Celery 태스크 발행 (analysis 큐 라우팅)
    try:
      current_app.send_task(
        "analysis.tasks.generate_report.generate_analysis_report",
        args=[report.id],
        queue="analysis",
      )
    except Exception:
      logger.exception("Failed to send analysis task for report %s", report.id)
      report.status = AnalysisReportStatus.FAILED
      report.error_message = "태스크 발행에 실패했습니다."
      report.save(update_fields=["status", "error_message"])
      return Response(
        {"detail": "리포트 생성 태스크 발행에 실패했습니다."},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
      )

    return Response(
      {
        "report_id": report.id,
        "status": report.status
      },
      status=status.HTTP_202_ACCEPTED,
    )

  @extend_schema(
    summary="리포트 조회",
    responses={200: ReportDetailSerializer},
  )
  def get(self, request, session_id):
    # 세션 존재 검증
    try:
      session = InterviewSession.objects.get(id=session_id)
    except InterviewSession.DoesNotExist:
      return Response(
        {"detail": "세션을 찾을 수 없습니다."},
        status=status.HTTP_404_NOT_FOUND,
      )

    # 리포트 존재 검증
    try:
      report = AnalysisReport.objects.select_related("session").get(session=session)
    except AnalysisReport.DoesNotExist:
      return Response(
        {"detail": "해당 세션의 분석 리포트가 존재하지 않습니다."},
        status=status.HTTP_404_NOT_FOUND,
      )

    # generating 상태면 상태만 반환
    if report.status == AnalysisReportStatus.GENERATING:
      serializer = ReportStatusSerializer(report)
      return Response(serializer.data)

    # completed 또는 failed면 전체 데이터 반환
    serializer = ReportDetailSerializer(report)
    return Response(serializer.data)
