from __future__ import annotations

import json
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed

import boto3

import os

from config import LAMBDA_ENDPOINT_URL, S3_REGION_NAME

SCALED_AUDIO_BUCKET = os.getenv(
    "SCALED_AUDIO_S3_BUCKET", "pj-kmucd1-04-mefit-scaled-audio-files"
)
from db.connection import get_session
from db.models import InterviewRecordingTable, InterviewBehaviorAnalysisTable

logger = logging.getLogger(__name__)

VOICE_ANALYZER_FUNCTION = "pj-kmucd1-04-mefit-voice-analyzer"
MAX_PARALLEL_INVOCATIONS = 4


class VoiceAnalysisInvoker:
    def __init__(self) -> None:
        kwargs = {"region_name": S3_REGION_NAME}
        if LAMBDA_ENDPOINT_URL:
            kwargs["endpoint_url"] = LAMBDA_ENDPOINT_URL
        self._lambda_client = boto3.client("lambda", **kwargs)

    def analyze_all_turns(self, session_id: str) -> dict[int, dict]:
        """세션의 모든 턴에 대해 voice-analyzer Lambda를 병렬 호출하고 결과를 반환한다.

        Returns:
            {turn_id: {"summary": {...}, "timeline": [...]}} 매핑.
            실패한 턴은 빈 dict.
        """
        with get_session() as db:
            rows = (
                db.query(
                    InterviewRecordingTable.interview_turn_id,
                    InterviewRecordingTable.interview_session_id,
                    InterviewRecordingTable.scaled_audio_key,
                    InterviewRecordingTable.uuid,
                )
                .filter(
                    InterviewRecordingTable.interview_session_id == session_id,
                    InterviewRecordingTable.scaled_audio_key != "",
                    InterviewRecordingTable.scaled_audio_key.isnot(None),
                )
                .all()
            )

        rec_dicts = [
            {
                "turn_id": r.interview_turn_id,
                "session_id": str(r.interview_session_id),
                "scaled_audio_key": r.scaled_audio_key,
                "uuid": str(r.uuid),
            }
            for r in rows
        ]

        if not rec_dicts:
            logger.info(
                "No recordings with scaled_audio_key for session=%s", session_id
            )
            return {}

        results: dict[int, dict] = {}

        with ThreadPoolExecutor(max_workers=MAX_PARALLEL_INVOCATIONS) as executor:
            futures = {executor.submit(self._invoke_single, rd): rd for rd in rec_dicts}
            for future in as_completed(futures):
                rd = futures[future]
                turn_id = rd["turn_id"]
                try:
                    voice_data = future.result()
                    results[turn_id] = voice_data
                    self._save_speech_data(session_id, turn_id, rd["uuid"], voice_data)
                except Exception:
                    logger.exception(
                        "Voice analysis failed: session=%s turn=%s",
                        session_id,
                        turn_id,
                    )
                    results[turn_id] = {}

        return results

    def _invoke_single(self, rec_dict: dict) -> dict:
        payload = {
            "audioBucket": SCALED_AUDIO_BUCKET,
            "audioKey": rec_dict["scaled_audio_key"],
            "sessionUuid": rec_dict["session_id"],
            "turnId": str(rec_dict["turn_id"]),
        }

        response = self._lambda_client.invoke(
            FunctionName=VOICE_ANALYZER_FUNCTION,
            InvocationType="RequestResponse",
            Payload=json.dumps(payload),
        )

        response_payload = json.loads(response["Payload"].read())
        if response_payload.get("statusCode") != 200:
            raise RuntimeError(f"voice-analyzer error: {response_payload}")

        return json.loads(response_payload["body"])

    def _save_speech_data(
        self, session_id: str, turn_id: int, recording_uuid: str, voice_data: dict
    ) -> None:
        with get_session() as db:
            behavior = (
                db.query(InterviewBehaviorAnalysisTable)
                .filter(
                    InterviewBehaviorAnalysisTable.interview_session_id == session_id,
                    InterviewBehaviorAnalysisTable.interview_turn_id == turn_id,
                )
                .first()
            )
            if behavior:
                behavior.speech_data = voice_data
                behavior.status = "completed"
            else:
                logger.warning(
                    "No BehaviorAnalysis found: session=%s turn=%s, skipping speech_data save",
                    session_id,
                    turn_id,
                )
