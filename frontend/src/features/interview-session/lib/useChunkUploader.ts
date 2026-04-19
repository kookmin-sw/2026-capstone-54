import { useState, useCallback, useRef } from "react";

interface UseChunkUploaderOptions {
  maxRetries?: number;
  retryBaseDelay?: number;
}

interface ChunkUploadState {
  uploadedParts: { partNumber: number; etag: string }[];
  currentPartNumber: number;
  isUploading: boolean;
  progress: number;
  error: string | null;
}

interface PresignedUrl {
  partNumber: number;
  url: string;
}

export interface UploadedPart {
  partNumber: number;
  etag: string;
}

interface UseChunkUploaderReturn extends ChunkUploadState {
  init: (presignedUrls: PresignedUrl[]) => void;
  uploadChunk: (blob: Blob) => Promise<UploadedPart | null>;
  reset: () => void;
}

export function useChunkUploader({
  maxRetries = 3,
  retryBaseDelay = 1000,
}: UseChunkUploaderOptions = {}): UseChunkUploaderReturn {
  const [uploadedParts, setUploadedParts] = useState<{ partNumber: number; etag: string }[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const urlsRef = useRef<PresignedUrl[]>([]);
  const partCounterRef = useRef<number>(1);
  const uploadLockRef = useRef<boolean>(false);

  const progress = urlsRef.current.length > 0 ? (uploadedParts.length / urlsRef.current.length) * 100 : 0;

  const init = useCallback((presignedUrls: PresignedUrl[]) => {
    urlsRef.current = presignedUrls;
    partCounterRef.current = presignedUrls.length > 0 ? Math.min(...presignedUrls.map(p => p.partNumber)) : 1;
    setUploadedParts([]);
    setIsUploading(false);
    setError(null);
  }, []);

  const reset = useCallback(() => {
    urlsRef.current = [];
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

        const currentPart = partCounterRef.current;
        const targetUrlObj = urlsRef.current.find((u) => u.partNumber === currentPart);
        if (!targetUrlObj) {
          console.warn(`[ChunkUploader] No presigned URL for part ${currentPart}, urls count: ${urlsRef.current.length}`);
          setError("No presigned URL found for current part.");
          setIsUploading(false);
          return null;
        }

        const { url, partNumber } = targetUrlObj;

        let attempt = 0;

        while (attempt <= maxRetries) {
          try {
            const response = await fetch(url, {
              method: "PUT",
              body: blob,
            });

            if (!response.ok) {
              throw new Error(`Upload failed with status ${response.status}`);
            }

            let etag = response.headers.get("ETag") ?? "";
            etag = etag.replace(/"/g, "");

            const part: UploadedPart = { partNumber, etag };
            setUploadedParts((prev) => [...prev, part]);
            partCounterRef.current = currentPart + 1;
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
    [maxRetries, retryBaseDelay]
  );

  return {
    uploadedParts,
    currentPartNumber: partCounterRef.current,
    isUploading,
    progress,
    error,
    init,
    uploadChunk,
    reset,
  };
}
