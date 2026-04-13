import { apiRequest } from "@/shared/api/client";

/* ── Types ── */
export interface TermsDocument {
  id: number;
  title: string;
  version: string;
  isRequired: boolean;
  content?: string;
}

export interface MyConsent {
  termsDocumentId: number;
  title: string;
  version: string;
  agreedAt: string;
}

/* ── GET /api/v1/terms-documents/ ── */
export async function getTermsDocumentsApi(): Promise<TermsDocument[]> {
  try {
    const res = await apiRequest<TermsDocument[] | { results?: TermsDocument[] }>(
      "/api/v1/terms-documents/"
    );
    return Array.isArray(res) ? res : (res.results ?? []);
  } catch {
    return [];
  }
}

/* ── POST /api/v1/terms-documents/consents/ ── */
export async function postTermsConsentsApi(
  consents: { termsDocumentId: number; agreed: boolean }[]
): Promise<{ success: boolean; message: string }> {
  try {
    await apiRequest("/api/v1/terms-documents/consents/", {
      method: "POST",
      auth: true,
      body: JSON.stringify({ consents }),
    });
    return { success: true, message: "약관 동의가 완료되었습니다." };
  } catch {
    return { success: false, message: "약관 동의에 실패했습니다." };
  }
}

/* ── GET /api/v1/terms-documents/my-consents/ ── */
export async function getMyConsentsApi(): Promise<MyConsent[]> {
  try {
    const res = await apiRequest<MyConsent[] | { results?: MyConsent[] }>(
      "/api/v1/terms-documents/my-consents/",
      { auth: true }
    );
    return Array.isArray(res) ? res : (res.results ?? []);
  } catch {
    return [];
  }
}
