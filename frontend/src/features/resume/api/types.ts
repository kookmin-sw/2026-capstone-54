// ── Enums ──
export type ResumeType = "file" | "text" | "structured";
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

// ── Parsed Data ──
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
  company: string;
  role: string;
  period: string;
  responsibilities: string[];
  highlights: string[];
}

export interface ParsedEducation {
  school: string;
  degree: string;
  major: string;
  period: string;
}

export interface ParsedCertification {
  name: string;
  issuer: string;
  date: string;
}

export interface ParsedProject {
  name: string;
  role: string;
  period: string;
  description: string;
  techStack: string[];
}

export interface ParsedLanguage {
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
  projects: ParsedProject[];
  languagesSpoken: ParsedLanguage[];
  careerLevel: string | null;
  totalExperienceYears: number | null;
  industryDomains: string[];
  keywords: string[];
  jobCategory: string | null;
}

// ── Resume ──
export interface ResumeListItem {
  uuid: string;
  type: ResumeType;
  title: string;
  isActive: boolean;
  isParsed: boolean;
  analysisStatus: AnalysisStatus;
  analysisStep: AnalysisStep;
  analyzedAt: string | null;
  createdAt: string;
  updatedAt: string;
  jobCategory: ResumeJobCategory | null;
}

export interface ResumeDetail extends ResumeListItem {
  parsedData: ParsedData | null;
  content: string | null;           // 텍스트 이력서 본문
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
  active: number;
  inactive: number;
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
