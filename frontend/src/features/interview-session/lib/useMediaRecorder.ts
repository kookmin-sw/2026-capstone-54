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

  useEffect(() => {
    onChunkRef.current = onChunk;
  }, [onChunk]);

  const start = useCallback(async () => {
    if (isStartingRef.current || isRecording) return;
    if (typeof navigator === "undefined" || !navigator.mediaDevices || typeof MediaRecorder === "undefined") {
      setError("이 브라우저에서는 녹화를 지원하지 않습니다.");
      setIsRecording(false);
      return;
    }

    isStartingRef.current = true;
    try {
      const mediaStream = externalStream ?? await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);

      let selectedMimeType = mimeType;
      if (!selectedMimeType) {
        const types = ["video/webm;codecs=vp8,opus", "video/webm"];
        selectedMimeType = types.find((type) => MediaRecorder.isTypeSupported(type)) || "";
      }

      try {
        const recorder = new MediaRecorder(mediaStream, {
          mimeType: selectedMimeType,
        });

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            if (recorder.state === "inactive" && finalChunkResolveRef.current) {
              finalChunkResolveRef.current(event.data);
              finalChunkResolveRef.current = null;
            } else {
              onChunkRef.current(event.data);
            }
          } else if (recorder.state === "inactive" && finalChunkResolveRef.current) {
            finalChunkResolveRef.current(null);
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
        recorder.start(timeslice);
        setIsRecording(true);
        setError(null);
      } catch {
        if (!externalStream) {
          mediaStream.getTracks().forEach((track) => track.stop());
        }
        setStream(null);
        setError("이 브라우저에서는 녹화를 지원하지 않습니다.");
        setIsRecording(false);
      }
    } catch {
      setError("카메라/마이크 권한이 필요합니다.");
      setIsRecording(false);
    } finally {
      isStartingRef.current = false;
    }
  }, [timeslice, mimeType, externalStream, isRecording]);

  const stop = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!recorderRef.current || recorderRef.current.state === "inactive") {
        if (stream && !externalStream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        setIsRecording(false);
        resolve(null);
        return;
      }

      finalChunkResolveRef.current = (blob) => {
        if (stream && !externalStream) {
          stream.getTracks().forEach((track) => track.stop());
        }
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
      if (stream && !externalStream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream, externalStream]);

  return { start, stop, stream, isRecording, error };
}
