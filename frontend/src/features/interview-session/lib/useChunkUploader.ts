import { useState, useCallback } from "react";

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
  const [urls, setUrls] = useState<PresignedUrl[]>([]);
  const [uploadedParts, setUploadedParts] = useState<{ partNumber: number; etag: string }[]>([]);
  const [currentPartNumber, setCurrentPartNumber] = useState<number>(1);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const progress = urls.length > 0 ? (uploadedParts.length / urls.length) * 100 : 0;

  const init = useCallback((presignedUrls: PresignedUrl[]) => {
    setUrls(presignedUrls);
    setUploadedParts([]);
    const initialPart = presignedUrls.length > 0 ? Math.min(...presignedUrls.map(p => p.partNumber)) : 1;
    setCurrentPartNumber(initialPart);
    setIsUploading(false);
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setUrls([]);
    setUploadedParts([]);
    setCurrentPartNumber(1);
    setIsUploading(false);
    setError(null);
  }, []);

  const uploadChunk = useCallback(
    async (blob: Blob): Promise<UploadedPart | null> => {
      setIsUploading(true);
      setError(null);

      const targetUrlObj = urls.find((u) => u.partNumber === currentPartNumber);
      if (!targetUrlObj) {
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
            headers: { "Content-Type": blob.type },
          });

          if (!response.ok) {
            throw new Error(`Upload failed with status ${response.status}`);
          }

          let etag = response.headers.get("ETag") ?? "";
          etag = etag.replace(/"/g, "");

          const part: UploadedPart = { partNumber, etag };
          setUploadedParts((prev) => [...prev, part]);
          setCurrentPartNumber((prev) => prev + 1);
          setIsUploading(false);
          return part;
        } catch (err) {
          attempt++;
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
    },
    [urls, currentPartNumber, maxRetries, retryBaseDelay]
  );

  return {
    uploadedParts,
    currentPartNumber,
    isUploading,
    progress,
    error,
    init,
    uploadChunk,
    reset,
  };
}
