import { useState, useCallback, useRef } from "react";
import { recordingApi } from "../api/recordingApi";

interface UseChunkUploaderOptions {
  maxRetries?: number;
  retryBaseDelay?: number;
  maxConcurrent?: number;
}

export interface UploadedPart {
  partNumber: number;
  etag: string;
}

interface UseChunkUploaderReturn {
  uploadedParts: UploadedPart[];
  isUploading: boolean;
  uploadedBytes: number;
  error: string | null;
  init: (recordingId: string) => void;
  uploadChunk: (blob: Blob) => Promise<UploadedPart | null>;
  reset: () => void;
}

export function useChunkUploader({
  maxRetries = 3,
  retryBaseDelay = 1000,
  maxConcurrent = 3,
}: UseChunkUploaderOptions = {}): UseChunkUploaderReturn {
  const [uploadedParts, setUploadedParts] = useState<UploadedPart[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recordingIdRef = useRef<string | null>(null);
  const partCounterRef = useRef(1);
  const activeCountRef = useRef(0);
  const queueRef = useRef<Array<() => void>>([]);

  const init = useCallback((recordingId: string) => {
    recordingIdRef.current = recordingId;
    partCounterRef.current = 1;
    activeCountRef.current = 0;
    queueRef.current = [];
    setUploadedParts([]);
    setUploadedBytes(0);
    setIsUploading(false);
    setError(null);
  }, []);

  const reset = useCallback(() => {
    recordingIdRef.current = null;
    partCounterRef.current = 1;
    activeCountRef.current = 0;
    queueRef.current = [];
    setUploadedParts([]);
    setUploadedBytes(0);
    setIsUploading(false);
    setError(null);
  }, []);

  const acquireSlot = useCallback(async () => {
    setIsUploading(true);
    if (activeCountRef.current < maxConcurrent) {
      activeCountRef.current++;
      return;
    }
    await new Promise<void>((resolve) => {
      queueRef.current.push(resolve);
    });
    activeCountRef.current++;
  }, [maxConcurrent]);

  const releaseSlot = useCallback(() => {
    activeCountRef.current--;
    const next = queueRef.current.shift();
    if (next) next();
    if (activeCountRef.current === 0 && queueRef.current.length === 0) {
      setIsUploading(false);
    }
  }, []);

  const uploadChunk = useCallback(
    async (blob: Blob): Promise<UploadedPart | null> => {
      await acquireSlot();

      try {
        setError(null);

        const id = recordingIdRef.current;
        if (!id) {
          setError("Recording not initialized.");
          return null;
        }

        const partNumber = partCounterRef.current;
        partCounterRef.current = partNumber + 1;

        let attempt = 0;

        while (attempt <= maxRetries) {
          try {
            const { presignedUrl } = await recordingApi.presignPart(id, partNumber);

            const response = await fetch(presignedUrl, {
              method: "PUT",
              body: new Blob([blob]),
            });

            if (!response.ok) {
              throw new Error(`S3 upload failed with status ${response.status}`);
            }

            const etag = (response.headers.get("ETag") ?? "").replace(/"/g, "");

            const part: UploadedPart = { partNumber, etag };
            setUploadedParts((prev) => [...prev, part]);
            setUploadedBytes((prev) => prev + blob.size);
            return part;
          } catch (err) {
            attempt++;
            console.warn(`[ChunkUploader] Part ${partNumber} attempt ${attempt}/${maxRetries} failed:`, err);
            if (attempt > maxRetries) {
              setError(err instanceof Error ? err.message : "Upload failed after retries.");
              return null;
            }
            await new Promise((resolve) =>
              setTimeout(resolve, retryBaseDelay * Math.pow(2, attempt - 1))
            );
          }
        }

        return null;
      } finally {
        releaseSlot();
      }
    },
    [maxRetries, retryBaseDelay, acquireSlot, releaseSlot],
  );

  return { uploadedParts, isUploading, uploadedBytes, error, init, uploadChunk, reset };
}
