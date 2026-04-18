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
  const singleUploadUrlRef = useRef<string | null>(null);
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

  const resetRefs = useCallback(() => {
    recordingIdRef.current = null;
    singleUploadUrlRef.current = null;
    startTimeRef.current = null;
    isInitializedRef.current = false;
    collectedPartsRef.current = [];
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

  const startRecording = useCallback(
    async (turnId: number) => {
      if (!recordingEnabled) return;
      setManagerError(null);
      isInitializedRef.current = false;
      collectedPartsRef.current = [];

      try {
        const initRes = await recordingApi.initiate(sessionUuid, turnId, "video");
        recordingIdRef.current = initRes.recordingId;
        singleUploadUrlRef.current = initRes.singleUploadUrl;

        try {
          chunkUploader.init(initRes.presignedUrls);
          await mediaRecorder.start();
          startTimeRef.current = Date.now();
          isInitializedRef.current = true;
          console.info("[RecordingManager] recording started, turnId=%d", turnId);
        } catch (innerErr) {
          console.warn("[RecordingManager] start failed, aborting:", innerErr);
          setRecordingEnabled(false);
          await recordingApi.abort(recordingIdRef.current).catch(() => {});
          recordingIdRef.current = null;
          singleUploadUrlRef.current = null;
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

      const hasParts = collectedPartsRef.current.length > 0;

      if (hasParts && finalBlob && finalBlob.size > 0) {
        const finalPart = await chunkUploader.uploadChunk(finalBlob);
        if (finalPart) {
          collectedPartsRef.current = [...collectedPartsRef.current, finalPart];
        }
      }

      const parts = collectedPartsRef.current;
      const useSingleUpload = parts.length === 0 && finalBlob && finalBlob.size > 0;

      if (parts.length === 0 && !useSingleUpload) {
        setManagerError("업로드된 청크가 없습니다.");
        await recordingApi.abort(recordingIdRef.current).catch(() => {});
        resetRefs();
        return;
      }

      console.info("[RecordingManager] decision: hasParts=%s useSingleUpload=%s", hasParts, useSingleUpload);

      if (useSingleUpload) {
        console.info("[RecordingManager] proxy upload via backend, blob size=%d", finalBlob.size);
        await recordingApi.upload(recordingIdRef.current, finalBlob);
        console.info("[RecordingManager] proxy upload complete");
      }

      const endTime = Date.now();
      const durationMs = endTime - startTimeRef.current;
      const endTimestamp = new Date(endTime).toISOString();

      await recordingApi.complete(
        recordingIdRef.current,
        parts,
        endTimestamp,
        durationMs,
        useSingleUpload ?? false,
      );

      console.info("[RecordingManager] recording completed, mode=%s, parts=%d",
        useSingleUpload ? "single" : "multipart", parts.length);

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
    uploadProgress: chunkUploader.progress,
    error: combinedError,
    startRecording,
    stopRecording,
    abortRecording,
    recordingEnabled,
  };
}
