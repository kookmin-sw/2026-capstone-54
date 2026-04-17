/** 채용공고 수집 상태. backend `JobDescription.collection_status` 와 1:1. */
export type JobDescriptionCollectionStatus =
  | "pending"
  | "in_progress"
  | "done"
  | "error";

/** JobDescription 전체 필드 (수집 결과). */
export interface JobDescription {
  id: number;
  url: string;
  platform: string;
  company: string;
  title: string;
  duties: string;
  requirements: string;
  preferred: string;
  workType: string;
  salary: string;
  location: string;
  education: string;
  experience: string;
  collectionStatus: JobDescriptionCollectionStatus;
  scrapedAt: string | null;
  errorMessage: string;
  createdAt: string;
  updatedAt: string;
}

export type ApplicationStatus = "planned" | "saved" | "applied";

/** 사용자가 등록한 채용공고. `uuid` 가 인터뷰 생성 시 기준이 된다. */
export interface UserJobDescription {
  uuid: string;
  title: string;
  applicationStatus: ApplicationStatus;
  jobDescription: JobDescription;
  createdAt: string;
}

/** POST /user-job-descriptions/ 응답. */
export interface CreatedUserJobDescription {
  uuid: string;
  title: string;
  applicationStatus: ApplicationStatus;
  jobDescriptionId: number;
  collectionStatus: JobDescriptionCollectionStatus;
  createdAt: string;
}
