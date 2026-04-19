import { apiRequest, BASE_URL, fetchWithAuth } from "@/shared/api/client";

export interface InitiateRecordingResponse {
  recordingId: string;
  uploadId: string;
  s3Key: string;
}

export interface CompleteRecordingResponse {
  recordingId: string;
  status: string;
}

export interface RecordingItem {
  recordingId: string;
  turnId: number;
  mediaType: "video" | "audio";
  status: string;
  durationMs: number | null;
  createdAt: string;
}

export interface PlaybackUrlResponse {
  url: string;
  scaledUrl: string | null;
  audioUrl: string | null;
  expiresIn: number;
  mediaType: string;
}

const BASE = "/api/v1/interviews";

export const recordingApi = {
  initiate: (sessionUuid: string, turnId: number, mediaType: "video" | "audio") =>
    apiRequest<InitiateRecordingResponse>(
      `${BASE}/interview-sessions/${sessionUuid}/recordings/initiate/`,
      {
        method: "POST",
        body: JSON.stringify({ turnId, mediaType }),
        auth: true,
      },
    ),

  complete: (recordingId: string, parts: { partNumber: number; etag: string }[], endTimestamp: string, durationMs: number, singleUpload = false) =>
    apiRequest<CompleteRecordingResponse>(
      `${BASE}/recordings/${recordingId}/complete/`,
      {
        method: "POST",
        body: JSON.stringify({ parts, endTimestamp, durationMs, singleUpload }),
        auth: true,
      },
    ),

  abort: (recordingId: string) =>
    apiRequest<void>(`${BASE}/recordings/${recordingId}/abort/`, { method: "POST", auth: true }),

  upload: (recordingId: string, blob: Blob) => {
    const formData = new FormData();
    formData.append("file", blob, "recording.webm");
    return fetchWithAuth(`${BASE_URL}${BASE}/recordings/${recordingId}/upload/`, {
      method: "PUT",
      body: formData,
    }).then((res) => {
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      return res.json();
    });
  },

  list: (sessionUuid: string) =>
    apiRequest<RecordingItem[]>(`${BASE}/interview-sessions/${sessionUuid}/recordings/`, { auth: true }),

  playbackUrl: (recordingId: string) =>
    apiRequest<PlaybackUrlResponse>(`${BASE}/recordings/${recordingId}/playback-url/`, { auth: true }),
};