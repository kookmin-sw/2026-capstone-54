"""face_analyzer 분석 결과를 S3에서 읽어 InterviewRecording에 저장하는 서비스.

책임 분리:
  - S3 읽기: get_video_s3_client() 사용
  - DB 저장: InterviewRecording.face_analysis_result 갱신

frames 배열을 포함한 전체 결과를 저장한다.
head_pose, blendshapes는 Lambda 단계에서 이미 제거되어 있으므로
프레임당 약 200B, 300프레임 기준 약 60KB로 jsonb에 적합하다.

조회 우선순위 (UpdateRecordingStepService 와 동일):
  1) source_s3_key 가 있으면 그것으로 정확히 매칭
  2) 없으면 (session, turn) + active status fallback
"""

import json
import logging

from common.services import BaseService
from interviews.enums import RecordingStatus
from interviews.models import InterviewRecording
from interviews.services.get_s3_client import get_video_s3_client

logger = logging.getLogger(__name__)

_ACTIVE_STATUSES = (
  RecordingStatus.INITIATED,
  RecordingStatus.UPLOADING,
  RecordingStatus.COMPLETED,
  RecordingStatus.PROCESSING,
  RecordingStatus.READY,
)


def _fetch_face_analysis_json(bucket: str, key: str) -> dict:
  """S3에서 face_analysis 결과 JSON을 읽어 dict로 반환한다."""
  s3 = get_video_s3_client()
  response = s3.get_object(Bucket=bucket, Key=key)
  return json.loads(response["Body"].read().decode("utf-8"))


class StoreFaceAnalysisResultService(BaseService):
  """S3에서 face_analyzer 결과를 읽어 InterviewRecording.face_analysis_result에 저장한다."""

  required_value_kwargs = ["session_uuid", "turn_id", "output_bucket", "output_key"]

  def validate(self):
    pass

  def execute(self):
    result = _fetch_face_analysis_json(
      bucket=self.kwargs["output_bucket"],
      key=self.kwargs["output_key"],
    )

    source_key = self.kwargs.get("source_s3_key", "") or ""
    qs = InterviewRecording.objects.filter(
      interview_session_id=self.kwargs["session_uuid"],
      interview_turn_id=self.kwargs["turn_id"],
    )

    if source_key:
      updated = qs.filter(s3_key=source_key, status__in=_ACTIVE_STATUSES).update(face_analysis_result=result)
      if updated == 0:
        logger.warning(
          "face_analysis_target_not_found",
          extra={
            "source_s3_key": source_key,
            "session_uuid": self.kwargs["session_uuid"],
            "turn_id": self.kwargs["turn_id"],
          },
        )
      return

    updated = qs.filter(status__in=_ACTIVE_STATUSES).update(face_analysis_result=result)
    if updated > 1:
      logger.warning(
        "face_analysis_multiple_active_recordings_updated",
        extra={
          "session_uuid": self.kwargs["session_uuid"],
          "turn_id": self.kwargs["turn_id"],
          "updated_count": updated,
        },
      )
