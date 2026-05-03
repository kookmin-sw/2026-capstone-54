import { apiRequest } from "@/shared/api/client";

export interface TermsDocument {
  id: number;
  termsType: string;
  version: number;
  title: string;
  isRequired: boolean;
  effectiveAt: string | null;
  createdAt: string;
  content?: string;
}

export interface MyConsent {
  id: number;
  termsDocument: TermsDocument;
  isAgreed: boolean;
  createdAt: string;
}

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

export async function getTermsDocumentApi(id: number): Promise<TermsDocument | null> {
  try {
    const res = await apiRequest<TermsDocument>(`/api/v1/terms-documents/${id}/`);
    return res;
  } catch {
    return null;
  }
}

export async function postTermsConsentsApi(
  termsDocumentId: number,
  isAgreed: boolean
): Promise<MyConsent[]> {
  try {
    const res = await apiRequest<MyConsent[] | { results?: MyConsent[] }>(
      "/api/v1/terms-documents/consents/",
      {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          updates: [{ termsDocumentId, isAgreed }],
        }),
      }
    );
    return Array.isArray(res) ? res : (res.results ?? []);
  } catch {
    return [];
  }
}

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
