// ── Enums ──
export type ResumeType = "file" | "text" | "structured";
export type ResumeSourceMode = "file" | "text" | "structured";
export type AnalysisStatus = "pending" | "processing" | "completed" | "failed";
export type AnalysisStep =
  | "queued"
  | "extracting_text"
  | "embedding"
  | "analyzing"
  | "finalizing"
  | "done";

// ── Resume Job Category ──
export interface ResumeJobCategory {
  uuid: string;
  name: string;
  emoji: string;
}

// ── Parsed Data (정규화 sub-model 의 camelCase 응답) ──
export interface ParsedBasicInfo {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
}

export interface ParsedSkillGroup {
  technical: string[];
  soft: string[];
  tools: string[];
  languages: string[];
}

export interface ParsedExperience {
  uuid?: string;
  company: string;
  role: string;
  period: string;
  responsibilities: string[];
  highlights: string[];
}

export interface ParsedEducation {
  uuid?: string;
  school: string;
  degree: string;
  major: string;
  period: string;
}

export interface ParsedCertification {
  uuid?: string;
  name: string;
  issuer: string;
  date: string;
}

export interface ParsedAward {
  uuid?: string;
  name: string;
  year: string;
  organization: string;
  description: string;
}

export interface ParsedProject {
  uuid?: string;
  name: string;
  role: string;
  period: string;
  description: string;
  techStack: string[];
}

export interface ParsedLanguage {
  uuid?: string;
  language: string;
  level: string;
}

export interface ParsedData {
  basicInfo: ParsedBasicInfo;
  summary: string;
  skills: ParsedSkillGroup;
  experiences: ParsedExperience[];
  educations: ParsedEducation[];
  certifications: ParsedCertification[];
  awards: ParsedAward[];
  projects: ParsedProject[];
  languagesSpoken: ParsedLanguage[];
  totalExperienceYears: number | null;
  totalExperienceMonths: number | null;
  industryDomains: string[];
  keywords: string[];
  jobCategory: string | null;
}

// ── Resume ──
export interface ResumeListItem {
  uuid: string;
  type: ResumeType;
  sourceMode: ResumeSourceMode;
  title: string;
  isParsed: boolean;
  isDirty: boolean;
  lastFinalizedAt: string | null;
  analysisStatus: AnalysisStatus;
  analysisStep: AnalysisStep;
  analyzedAt: string | null;
  createdAt: string;
  updatedAt: string;
  resumeJobCategory: ResumeJobCategory | null;
}

export interface ResumeDetail extends ResumeListItem {
  parsedData: ParsedData | null;
  content: string | null;           // 텍스트 이력서 본문 (raw)
  originalFilename: string | null;
  fileSizeBytes: number | null;
  mimeType: string | null;
  fileTextContent: string | null;   // 파일에서 추출된 텍스트
  fileUrl: string | null;
}

// ── Paginated Response ──
export interface PaginatedResponse<T> {
  count: number;
  totalPagesCount: number;
  nextPage: number | null;
  previousPage: number | null;
  results: T[];
}

// ── Stats ──
export interface ResumeCountStats {
  total: number;
  processing: number;
  pending: number;
  completed: number;
  failed: number;
}

export interface ResumeTypeStats {
  fileCount: number;
  textCount: number;
}

export interface ResumeTopSkillsStats {
  topSkills: { name: string; count: number }[];
  totalUniqueSkills: number;
}

export interface ResumeRecentActivityStats {
  days: number;
  recentlyAnalyzedCount: number;
}

// ── Template ──
export interface ResumeTemplateJob {
  id: string;
  name: string;
  category: string | null;
}

/** 목록 응답: 라벨 구성 + 상세 API 호출을 위한 최소 정보만 포함 */
export interface ResumeTemplateListItem {
  uuid: string;
  title: string;
  displayOrder: number;
  job: ResumeTemplateJob;
}

export interface ResumeTemplateDetail {
  uuid: string;
  title: string;
  displayOrder: number;
  job: ResumeTemplateJob;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// ── Section CRUD payloads / responses ──

export interface ResumeBasicInfoRow {
  uuid: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeSummaryRow {
  uuid: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeCareerMetaRow {
  uuid: string;
  totalExperienceYears: number | null;
  totalExperienceMonths: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeExperienceRow extends ParsedExperience {
  uuid: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeEducationRow extends ParsedEducation {
  uuid: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeCertificationRow extends ParsedCertification {
  uuid: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeAwardRow extends ParsedAward {
  uuid: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeProjectRow extends ParsedProject {
  uuid: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeLanguageSpokenRow extends ParsedLanguage {
  uuid: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}
