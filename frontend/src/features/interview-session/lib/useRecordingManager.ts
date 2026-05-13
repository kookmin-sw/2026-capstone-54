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
  uploadedBytes: number;
  uploadedPartsCount: number;
  error: string | null;
  prepareRecording: (turnId: number) => Promise<void>;
  startRecording: (turnId: number) => Promise<void>;
  stopRecording: () => Promise<void>;
  abortRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
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
  const pendingUploadsRef = useRef<Promise<UploadedPart | null>[]>([]);
  const preparedTurnIdRef = useRef<number | null>(null);
  const preparePromiseRef = useRef<Promise<string | null> | null>(null);
  const preparingTurnIdRef = useRef<number | null>(null);
  const pausedDurationAccumRef = useRef<number>(0);
  const pauseStartedAtRef = useRef<number | null>(null);

  const chunkUploader = useChunkUploader();

  const handleChunk = useCallback(
    (blob: Blob) => {
      const promise = chunkUploader.uploadChunk(blob).then((part) => {
        if (part) {
          collectedPartsRef.current = [...collectedPartsRef.current, part];
        }
        return part;
      }).catch((err) => {
        setManagerError(err instanceof Error ? err.message : "청크 업로드 실패");
        return null;
      });
      pendingUploadsRef.current = [...pendingUploadsRef.current, promise];
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

  const resetRefs = useCallback(() => {
    recordingIdRef.current = null;
    startTimeRef.current = null;
    isInitializedRef.current = false;
    collectedPartsRef.current = [];
    pendingUploadsRef.current = [];
    preparePromiseRef.current = null;
    preparingTurnIdRef.current = null;
    preparedTurnIdRef.current = null;
    pausedDurationAccumRef.current = 0;
    pauseStartedAtRef.current = null;
    chunkUploader.reset();
  }, [chunkUploader]);

  const abortRecording = useCallback(async () => {
    if (recordingIdRef.current) {
      await recordingApi.abort(recordingIdRef.current).catch(() => {});
    }
    if (mediaRecorder.isRecording) {
      await mediaRecorder.stop();
    }
    resetRefs();
  }, [mediaRecorder, resetRefs]);

  const pauseRecording = useCallback(() => {
    if (!recordingEnabled) return;
    if (pauseStartedAtRef.current === null) {
      pauseStartedAtRef.current = Date.now();
    }
    mediaRecorder.pause();
  }, [recordingEnabled, mediaRecorder]);

  const resumeRecording = useCallback(() => {
    if (!recordingEnabled) return;
    if (pauseStartedAtRef.current !== null) {
      pausedDurationAccumRef.current += Date.now() - pauseStartedAtRef.current;
      pauseStartedAtRef.current = null;
    }
    mediaRecorder.resume();
  }, [recordingEnabled, mediaRecorder]);

  const prepareRecording = useCallback(
    async (turnId: number) => {
      if (!recordingEnabled) return;
      if (preparedTurnIdRef.current === turnId && recordingIdRef.current) return;
      if (preparingTurnIdRef.current === turnId && preparePromiseRef.current) {
        await preparePromiseRef.current;
        return;
      }

      preparingTurnIdRef.current = turnId;
      preparePromiseRef.current = (async () => {
        try {
          const initRes = await recordingApi.initiate(sessionUuid, turnId, "video");
          recordingIdRef.current = initRes.recordingId;
          chunkUploader.init(initRes.recordingId);
          preparedTurnIdRef.current = turnId;
          console.info("[RecordingManager] prepared for turnId=%d", turnId);
          return initRes.recordingId;
        } catch (err) {
          console.warn("[RecordingManager] prepare failed:", err);
          preparedTurnIdRef.current = null;
          recordingIdRef.current = null;
          return null;
        } finally {
          preparingTurnIdRef.current = null;
        }
      })();

      try {
        await preparePromiseRef.current;
      } finally {
        preparePromiseRef.current = null;
      }
    },
    [sessionUuid, recordingEnabled, chunkUploader],
  );

  const startRecording = useCallback(
    async (turnId: number) => {
      if (!recordingEnabled) return;
      setManagerError(null);
      isInitializedRef.current = false;
      collectedPartsRef.current = [];
      pendingUploadsRef.current = [];

      try {
        if (preparePromiseRef.current && preparingTurnIdRef.current === turnId) {
          await preparePromiseRef.current;
        }

        if (preparedTurnIdRef.current !== turnId || !recordingIdRef.current) {
          const initRes = await recordingApi.initiate(sessionUuid, turnId, "video");
          recordingIdRef.current = initRes.recordingId;
          chunkUploader.init(initRes.recordingId);
          preparedTurnIdRef.current = turnId;
        }

        try {
          await mediaRecorder.start();
          startTimeRef.current = Date.now();
          isInitializedRef.current = true;
          console.info("[RecordingManager] recording started, turnId=%d", turnId);
        } catch (innerErr) {
          console.warn("[RecordingManager] start failed, aborting:", innerErr);
          setRecordingEnabled(false);
          if (recordingIdRef.current) {
            await recordingApi.abort(recordingIdRef.current).catch(() => {});
          }
          recordingIdRef.current = null;
          preparedTurnIdRef.current = null;
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

      await Promise.all(pendingUploadsRef.current);
      pendingUploadsRef.current = [];

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
        resetRefs();
        return;
      }

      const endTime = Date.now();
      if (pauseStartedAtRef.current !== null) {
        pausedDurationAccumRef.current += endTime - pauseStartedAtRef.current;
        pauseStartedAtRef.current = null;
      }
      const durationMs = endTime - startTimeRef.current - pausedDurationAccumRef.current;
      const endTimestamp = new Date(endTime).toISOString();

      const sortedParts = [...parts].sort((a, b) => a.partNumber - b.partNumber);
      await recordingApi.complete(
        recordingIdRef.current,
        sortedParts,
        endTimestamp,
        durationMs,
      );

      console.info("[RecordingManager] recording completed, parts=%d", parts.length);

      resetRefs();
      isInitializedRef.current = false;
    } catch (err) {
      setManagerError(
        err instanceof Error ? err.message : "녹화 완료 실패",
      );
      resetRefs();
      isInitializedRef.current = false;
    }
  }, [recordingEnabled, mediaRecorder, chunkUploader, resetRefs]);

  const combinedError = managerError || chunkUploader.error || mediaRecorder.error;

  return {
    stream: mediaRecorder.stream,
    isRecording: mediaRecorder.isRecording,
    uploadedBytes: chunkUploader.uploadedBytes,
    uploadedPartsCount: chunkUploader.uploadedParts.length,
    error: combinedError,
    prepareRecording,
    startRecording,
    stopRecording,
    abortRecording,
    pauseRecording,
    resumeRecording,
    recordingEnabled,
  };
}
