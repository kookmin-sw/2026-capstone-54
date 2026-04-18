import { apiRequest } from "@/shared/api/client";

export interface InitiateRecordingResponse {
  recordingId: string;
  uploadId: string;
  s3Key: string;
  presignedUrls: { partNumber: number; url: string }[];
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

  complete: (recordingId: string, parts: { partNumber: number; etag: string }[], endTimestamp: string, durationMs: number) =>
    apiRequest<CompleteRecordingResponse>(
      `${BASE}/recordings/${recordingId}/complete/`,
      {
        method: "POST",
        body: JSON.stringify({ parts, endTimestamp, durationMs }),
        auth: true,
      },
    ),

  abort: (recordingId: string) =>
    apiRequest<void>(`${BASE}/recordings/${recordingId}/abort/`, { method: "POST", auth: true }),

  list: (sessionUuid: string) =>
    apiRequest<RecordingItem[]>(`${BASE}/interview-sessions/${sessionUuid}/recordings/`, { auth: true }),

  playbackUrl: (recordingId: string) =>
    apiRequest<PlaybackUrlResponse>(`${BASE}/recordings/${recordingId}/playback-url/`, { auth: true }),
};