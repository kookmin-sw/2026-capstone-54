import json
import logging
import re

import requests
from common.exceptions import NotFoundException
from django.http import HttpResponse
from interviews.enums import RecordingStatus
from interviews.models import InterviewRecording
from interviews.services import UpdateRecordingStatusService
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

logger = logging.getLogger(__name__)

SNS_URL_PATTERN = re.compile(r"^https://sns\.[a-z0-9-]+\.amazonaws\.com/")


@api_view(["POST"])
@permission_classes([AllowAny])
def video_processing_webhook(request):
  sns_type = request.headers.get("x-amz-sns-message-type", "")

  if sns_type == "SubscriptionConfirmation":
    body = json.loads(request.body)
    subscribe_url = body.get("SubscribeURL", "")
    if subscribe_url and SNS_URL_PATTERN.match(subscribe_url):
      requests.get(subscribe_url, timeout=10)
    return HttpResponse("OK", status=200)

  if sns_type == "Notification":
    body = json.loads(request.body)
    message = json.loads(body.get("Message", "{}"))

    if message.get("type") == "video_processing_complete":
      session_uuid = message.get("sessionUuid")
      turn_id = message.get("turnId")

      if session_uuid and turn_id:
        recording = InterviewRecording.objects.filter(
          interview_session_id=session_uuid,
          interview_turn_id=turn_id,
          status=RecordingStatus.COMPLETED,
        ).first()

        if not recording:
          return HttpResponse("OK", status=200)

        try:
          UpdateRecordingStatusService(
            session_uuid=session_uuid,
            turn_id=turn_id,
            status="ready",
            scaled_video_key=message.get("scaledVideoKey", ""),
            audio_key=message.get("audioKey", ""),
            scaled_audio_key=message.get("scaledAudioKey", ""),
            frame_prefix=message.get("framePrefix", ""),
          ).perform()
        except NotFoundException:
          logger.warning("Recording not found: session=%s turn=%s", session_uuid, turn_id)
        except Exception as e:
          logger.error("Video processing webhook failed: %s", e, exc_info=True)
          return HttpResponse("Error", status=500)

    return HttpResponse("OK", status=200)

  return HttpResponse("OK", status=200)
