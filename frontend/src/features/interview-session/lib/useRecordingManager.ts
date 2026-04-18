import { useState, useRef, useEffect, useCallback } from "react";
import { useMediaRecorder } from "./useMediaRecorder";
import { useChunkUploader, type UploadedPart } from "./useChunkUploader";
import { recordingApi } from "../api/recordingApi";

export interface UseRecordingManagerOptions {
  sessionUuid: string;
  enabled?: boolean;
  externalStream?: MediaStream | null;
}

export interface UseRecordingManagerReturn {
  stream: MediaStream | null;
  isRecording: boolean;
  uploadProgress: number;
  error: string | null;
  startRecording: (turnId: number) => Promise<void>;
  stopRecording: () => Promise<void>;
  abortRecording: () => Promise<void>;
  recordingEnabled: boolean;
}

export function useRecordingManager({
  sessionUuid,
  enabled = true,
  externalStream,
}: UseRecordingManagerOptions): UseRecordingManagerReturn {
  const [recordingEnabled, setRecordingEnabled] = useState(enabled);
  const [managerError, setManagerError] = useState<string | null>(null);

  const recordingIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const isInitializedRef = useRef(false);
  const collectedPartsRef = useRef<UploadedPart[]>([]);

  const chunkUploader = useChunkUploader();

  const handleChunk = useCallback(
    (blob: Blob) => {
      chunkUploader.uploadChunk(blob).then((part) => {
        if (part) {
          collectedPartsRef.current = [...collectedPartsRef.current, part];
        }
      }).catch((err) => {
        setManagerError(err instanceof Error ? err.message : "청크 업로드 실패");
      });
    },
    [chunkUploader],
  );

  const mediaRecorder = useMediaRecorder({
    onChunk: handleChunk,
    externalStream,
  });

  useEffect(() => {
    setRecordingEnabled(enabled);
  }, [enabled]);

  useEffect(() => {
    if (mediaRecorder.error) {
      setRecordingEnabled(false);
    }
  }, [mediaRecorder.error]);

  const abortRecording = useCallback(async () => {
    if (recordingIdRef.current) {
      await recordingApi.abort(recordingIdRef.current).catch(() => {});
    }
    if (mediaRecorder.isRecording) {
      await mediaRecorder.stop();
    }
    recordingIdRef.current = null;
    startTimeRef.current = null;
    isInitializedRef.current = false;
    collectedPartsRef.current = [];
    chunkUploader.reset();
  }, [mediaRecorder, chunkUploader]);

  const startRecording = useCallback(
    async (turnId: number) => {
      if (!recordingEnabled) return;
      setManagerError(null);
      isInitializedRef.current = false;
      collectedPartsRef.current = [];

      try {
        const initRes = await recordingApi.initiate(sessionUuid, turnId, "video");
        recordingIdRef.current = initRes.recordingId;

        try {
          chunkUploader.init(initRes.presignedUrls);
          await mediaRecorder.start();

          if (mediaRecorder.error) {
            setRecordingEnabled(false);
            throw new Error(mediaRecorder.error);
          }

          startTimeRef.current = Date.now();
          isInitializedRef.current = true;
        } catch (innerErr) {
          await recordingApi.abort(recordingIdRef.current).catch(() => {});
          recordingIdRef.current = null;
          throw innerErr;
        }
      } catch (err) {
        setManagerError(
          err instanceof Error ? err.message : "녹화 시작 실패",
        );
      }
    },
    [sessionUuid, recordingEnabled, chunkUploader, mediaRecorder],
  );

  const stopRecording = useCallback(async () => {
    if (!recordingEnabled || !recordingIdRef.current || !startTimeRef.current) {
      return;
    }

    if (!isInitializedRef.current) {
      await mediaRecorder.stop();
      return;
    }

    try {
      const finalBlob = await mediaRecorder.stop();

      if (finalBlob && finalBlob.size > 0) {
        const finalPart = await chunkUploader.uploadChunk(finalBlob);
        if (finalPart) {
          collectedPartsRef.current = [...collectedPartsRef.current, finalPart];
        }
      }

      const parts = collectedPartsRef.current;
      if (parts.length === 0) {
        setManagerError("업로드된 청크가 없습니다.");
        await recordingApi.abort(recordingIdRef.current).catch(() => {});
        recordingIdRef.current = null;
        startTimeRef.current = null;
        collectedPartsRef.current = [];
        chunkUploader.reset();
        return;
      }

      const endTime = Date.now();
      const durationMs = endTime - startTimeRef.current;
      const endTimestamp = new Date(endTime).toISOString();

      await recordingApi.complete(
        recordingIdRef.current,
        parts,
        endTimestamp,
        durationMs,
      );

      chunkUploader.reset();
      recordingIdRef.current = null;
      startTimeRef.current = null;
      collectedPartsRef.current = [];
      isInitializedRef.current = false;
    } catch (err) {
      setManagerError(
        err instanceof Error ? err.message : "녹화 완료 실패",
      );
      recordingIdRef.current = null;
      startTimeRef.current = null;
      collectedPartsRef.current = [];
      isInitializedRef.current = false;
      chunkUploader.reset();
    }
  }, [recordingEnabled, mediaRecorder, chunkUploader]);

  const combinedError = managerError || chunkUploader.error || mediaRecorder.error;

  return {
    stream: mediaRecorder.stream,
    isRecording: mediaRecorder.isRecording,
    uploadProgress: chunkUploader.progress,
    error: combinedError,
    startRecording,
    stopRecording,
    abortRecording,
    recordingEnabled,
  };
}
