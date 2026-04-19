import { useState, useCallback, useRef } from "react";
import { fetchWithAuth, BASE_URL } from "@/shared/api/client";

interface UseChunkUploaderOptions {
  maxRetries?: number;
  retryBaseDelay?: number;
}

export interface UploadedPart {
  partNumber: number;
  etag: string;
}

interface UseChunkUploaderReturn {
  uploadedParts: UploadedPart[];
  isUploading: boolean;
  progress: number;
  error: string | null;
  init: (recordingId: string) => void;
  uploadChunk: (blob: Blob) => Promise<UploadedPart | null>;
  reset: () => void;
}

export function useChunkUploader({
  maxRetries = 3,
  retryBaseDelay = 1000,
}: UseChunkUploaderOptions = {}): UseChunkUploaderReturn {
  const [uploadedParts, setUploadedParts] = useState<UploadedPart[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recordingIdRef = useRef<string | null>(null);
  const partCounterRef = useRef(1);
  const uploadLockRef = useRef(false);

  const progress = uploadedParts.length > 0 ? uploadedParts.length * 5 : 0;

  const init = useCallback((recordingId: string) => {
    recordingIdRef.current = recordingId;
    partCounterRef.current = 1;
    setUploadedParts([]);
    setIsUploading(false);
    setError(null);
  }, []);

  const reset = useCallback(() => {
    recordingIdRef.current = null;
    partCounterRef.current = 1;
    setUploadedParts([]);
    setIsUploading(false);
    setError(null);
  }, []);

  const uploadChunk = useCallback(
    async (blob: Blob): Promise<UploadedPart | null> => {
      while (uploadLockRef.current) {
        await new Promise((r) => setTimeout(r, 50));
      }
      uploadLockRef.current = true;

      try {
        setIsUploading(true);
        setError(null);

        const id = recordingIdRef.current;
        if (!id) {
          setError("Recording not initialized.");
          setIsUploading(false);
          return null;
        }

        const partNumber = partCounterRef.current;
        const url = `${BASE_URL}/api/v1/interviews/recordings/${id}/parts/${partNumber}/`;

        let attempt = 0;

        while (attempt <= maxRetries) {
          try {
            const formData = new FormData();
            formData.append("file", blob, "chunk.webm");

            const response = await fetchWithAuth(url, { method: "PUT", body: formData });

            if (!response.ok) {
              throw new Error(`Upload failed with status ${response.status}`);
            }

            const data = await response.json();
            const etag = (data.etag ?? "").replace(/"/g, "");

            const part: UploadedPart = { partNumber, etag };
            setUploadedParts((prev) => [...prev, part]);
            partCounterRef.current = partNumber + 1;
            setIsUploading(false);
            return part;
          } catch (err) {
            attempt++;
            console.warn(`[ChunkUploader] Part ${partNumber} attempt ${attempt}/${maxRetries} failed:`, err);
            if (attempt > maxRetries) {
              setError(err instanceof Error ? err.message : "Upload failed after retries.");
              setIsUploading(false);
              return null;
            }
            await new Promise((resolve) =>
              setTimeout(resolve, retryBaseDelay * Math.pow(2, attempt - 1))
            );
          }
        }

        setIsUploading(false);
        return null;
      } finally {
        uploadLockRef.current = false;
      }
    },
    [maxRetries, retryBaseDelay],
  );

  return { uploadedParts, isUploading, progress, error, init, uploadChunk, reset };
}
