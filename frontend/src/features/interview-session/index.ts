export { useInterviewSessionStore } from "./model/store";
export { FOLLOWUP_TOTAL_QUESTIONS, FOLLOWUP_ANCHOR_COUNT, MAX_FOLLOWUP_PER_ANCHOR } from "./config";
export type { InterviewPhase, AnswerState } from "./model/types";

export { interviewApi } from "./api/interviewApi";
export type {
  InterviewSession,
  InterviewTurn,
  InterviewAnalysisReport,
  InterviewSessionListItem,
  InterviewCategoryScore,
  InterviewQuestionFeedback,
  InterviewStrengthItem,
  PaginatedResponse,
  InterviewSessionType,
  InterviewDifficultyLevel,
  InterviewPracticeMode,
  InterviewSessionStatus,
  InterviewAnalysisReportStatus,
  CreateInterviewSessionParams,
  SubmitAnswerFollowupResponse,
  SubmitAnswerFullProcessResponse,
  SubmitAnswerResponse,
  BehaviorAnalysis,
} from "./api/types";

export { SESSION_TYPE_LABEL, DIFFICULTY_LABEL, DIFFICULTY_STYLE, REPORT_STATUS_BADGE } from "./constants/labels";

export { AvatarSection } from "./ui/AvatarSection";
export { QuestionPanel } from "./ui/QuestionPanel";
export { TranscriptPanel } from "./ui/TranscriptPanel";
export { BehaviorMetrics } from "./ui/BehaviorMetrics";

export { recordingApi } from "./api/recordingApi";
export { useMediaRecorder } from "./lib/useMediaRecorder";
export { useChunkUploader } from "./lib/useChunkUploader";
export { useRecordingManager } from "./lib/useRecordingManager";

export { VideoPreview } from "./ui/VideoPreview";
export { RecordingIndicator } from "./ui/RecordingIndicator";
export { MediaPlayer } from "./ui/MediaPlayer";
export type { RecordingItem } from "./api/recordingApi";


