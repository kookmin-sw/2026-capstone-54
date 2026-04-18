import { useRef, useCallback, useState, useEffect } from "react";

interface UseMediaRecorderOptions {
  timeslice?: number;
  onChunk: (blob: Blob) => void;
  mimeType?: string;
  externalStream?: MediaStream | null;
}

interface UseMediaRecorderReturn {
  start: () => Promise<void>;
  stop: () => Promise<Blob | null>;
  stream: MediaStream | null;
  isRecording: boolean;
  error: string | null;
}

const MIN_S3_PART_SIZE = 5 * 1024 * 1024;

export function useMediaRecorder({
  timeslice = 5000,
  onChunk,
  mimeType,
  externalStream,
}: UseMediaRecorderOptions): UseMediaRecorderReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const onChunkRef = useRef(onChunk);
  const finalChunkResolveRef = useRef<((blob: Blob | null) => void) | null>(null);
  const isStartingRef = useRef(false);
  const isRecordingRef = useRef(false);
  const bufferRef = useRef<Blob[]>([]);

  useEffect(() => {
    onChunkRef.current = onChunk;
  }, [onChunk]);

  const start = useCallback(async () => {
    if (isStartingRef.current || isRecordingRef.current) {
      console.warn("[MediaRecorder] start() skipped: already starting or recording");
      return;
    }
    if (typeof navigator === "undefined" || !navigator.mediaDevices || typeof MediaRecorder === "undefined") {
      const msg = "이 브라우저에서는 녹화를 지원하지 않습니다.";
      setError(msg);
      throw new Error(msg);
    }

    isStartingRef.current = true;
    try {
      const sourceStream = externalStream ?? await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const mediaStream = sourceStream.clone();
      setStream(mediaStream);

      let selectedMimeType = mimeType;
      if (!selectedMimeType) {
        const types = ["video/webm;codecs=vp8,opus", "video/webm"];
        selectedMimeType = types.find((type) => MediaRecorder.isTypeSupported(type)) || "";
      }

      const recorder = new MediaRecorder(mediaStream, {
        mimeType: selectedMimeType,
      });

      recorder.ondataavailable = (event) => {
        console.info("[MediaRecorder] ondataavailable size=%d state=%s", event.data?.size ?? 0, recorder.state);
        if (event.data && event.data.size > 0) {
          if (recorder.state === "inactive" && finalChunkResolveRef.current) {
            const allChunks = [...bufferRef.current, event.data];
            bufferRef.current = [];
            const merged = new Blob(allChunks, { type: event.data.type });
            finalChunkResolveRef.current(merged);
            finalChunkResolveRef.current = null;
          } else {
            bufferRef.current.push(event.data);
            const bufferSize = bufferRef.current.reduce((sum, b) => sum + b.size, 0);
            if (bufferSize >= MIN_S3_PART_SIZE) {
              const merged = new Blob(bufferRef.current, { type: event.data.type });
              bufferRef.current = [];
              console.info("[MediaRecorder] flushing buffer, size=%d", merged.size);
              onChunkRef.current(merged);
            }
          }
        } else if (recorder.state === "inactive" && finalChunkResolveRef.current) {
          const allChunks = bufferRef.current;
          bufferRef.current = [];
          if (allChunks.length > 0) {
            const merged = new Blob(allChunks);
            finalChunkResolveRef.current(merged);
          } else {
            finalChunkResolveRef.current(null);
          }
          finalChunkResolveRef.current = null;
        }
      };

      recorder.onstop = () => {
        if (finalChunkResolveRef.current) {
          finalChunkResolveRef.current(null);
          finalChunkResolveRef.current = null;
        }
      };

      recorderRef.current = recorder;
      bufferRef.current = [];
      recorder.start(timeslice);
      isRecordingRef.current = true;
      setIsRecording(true);
      setError(null);
      console.info("[MediaRecorder] started, timeslice=%dms, mimeType=%s, tracks=%o",
        timeslice, selectedMimeType,
        mediaStream.getTracks().map(t => ({ kind: t.kind, readyState: t.readyState, enabled: t.enabled })));
    } catch (err) {
      if (!externalStream && stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      setStream(null);
      const msg = err instanceof Error ? err.message : "녹화 시작 실패";
      setError(msg);
      throw err;
    } finally {
      isStartingRef.current = false;
    }
  }, [timeslice, mimeType, externalStream, stream]);

  const stop = useCallback((): Promise<Blob | null> => {
    console.info("[MediaRecorder] stop() called, recorderState=%s", recorderRef.current?.state ?? "null");
    return new Promise((resolve) => {
      if (!recorderRef.current || recorderRef.current.state === "inactive") {
        if (stream && !externalStream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        isRecordingRef.current = false;
        setIsRecording(false);
        resolve(null);
        return;
      }

      finalChunkResolveRef.current = (blob) => {
        if (stream && !externalStream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        isRecordingRef.current = false;
        setIsRecording(false);
        resolve(blob);
      };

      recorderRef.current.stop();
    });
  }, [stream, externalStream]);

  useEffect(() => {
    return () => {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
    };
  }, []);

  return { start, stop, stream, isRecording, error };
}
