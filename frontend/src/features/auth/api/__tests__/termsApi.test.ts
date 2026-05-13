const mockApiRequest = jest.fn();

jest.mock("@/shared/api/client", () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
}));

import {
  getTermsDocumentsApi,
  getTermsDocumentApi,
  postTermsConsentsApi,
  getMyConsentsApi,
} from "../termsApi";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getTermsDocumentsApi", () => {
  it("배열 응답 → 그대로 반환", async () => {
    const docs = [{ id: 1, termsType: "tos", version: 1, title: "이용약관", isRequired: true, effectiveAt: null, createdAt: "" }];
    mockApiRequest.mockResolvedValue(docs);

    const result = await getTermsDocumentsApi();
    expect(result).toEqual(docs);
  });

  it("페이지네이션 응답 → results 배열 추출", async () => {
    const docs = [{ id: 2, termsType: "privacy", version: 1, title: "개인정보", isRequired: true, effectiveAt: null, createdAt: "" }];
    mockApiRequest.mockResolvedValue({ results: docs });

    const result = await getTermsDocumentsApi();
    expect(result).toEqual(docs);
  });

  it("결과 없음 → 빈 배열", async () => {
    mockApiRequest.mockResolvedValue({});
    expect(await getTermsDocumentsApi()).toEqual([]);
  });

  it("API 실패 → 빈 배열 (안전 fallback)", async () => {
    mockApiRequest.mockRejectedValue(new Error("server"));
    expect(await getTermsDocumentsApi()).toEqual([]);
  });
});

describe("getTermsDocumentApi", () => {
  it("성공 → 단일 문서 반환", async () => {
    const doc = { id: 1, termsType: "tos", version: 1, title: "x", isRequired: true, effectiveAt: null, createdAt: "" };
    mockApiRequest.mockResolvedValue(doc);

    expect(await getTermsDocumentApi(1)).toEqual(doc);
    expect(mockApiRequest).toHaveBeenCalledWith("/api/v1/terms-documents/1/");
  });

  it("실패 → null 반환", async () => {
    mockApiRequest.mockRejectedValue(new Error("404"));
    expect(await getTermsDocumentApi(999)).toBeNull();
  });
});

describe("postTermsConsentsApi", () => {
  it("POST 요청 + updates 배열 wrap", async () => {
    mockApiRequest.mockResolvedValue([]);

    await postTermsConsentsApi(1, true);

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/terms-documents/consents/",
      expect.objectContaining({
        method: "POST",
        auth: true,
        body: JSON.stringify({ updates: [{ termsDocumentId: 1, isAgreed: true }] }),
      }),
    );
  });

  it("결과 배열 응답 → 그대로 반환", async () => {
    const consents = [{ id: 1, termsDocument: { id: 1, termsType: "x", version: 1, title: "x", isRequired: true, effectiveAt: null, createdAt: "" }, isAgreed: true, createdAt: "" }];
    mockApiRequest.mockResolvedValue(consents);

    expect(await postTermsConsentsApi(1, true)).toEqual(consents);
  });

  it("실패 → 빈 배열", async () => {
    mockApiRequest.mockRejectedValue(new Error("server"));
    expect(await postTermsConsentsApi(1, true)).toEqual([]);
  });
});

describe("getMyConsentsApi", () => {
  it("배열 응답 → 그대로 반환 + auth=true", async () => {
    mockApiRequest.mockResolvedValue([]);

    await getMyConsentsApi();

    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/terms-documents/my-consents/",
      expect.objectContaining({ auth: true }),
    );
  });

  it("페이지네이션 응답 → results 추출", async () => {
    const consents = [{ id: 5, termsDocument: { id: 1, termsType: "x", version: 1, title: "x", isRequired: true, effectiveAt: null, createdAt: "" }, isAgreed: true, createdAt: "" }];
    mockApiRequest.mockResolvedValue({ results: consents });

    expect(await getMyConsentsApi()).toEqual(consents);
  });

  it("실패 → 빈 배열", async () => {
    mockApiRequest.mockRejectedValue(new Error());
    expect(await getMyConsentsApi()).toEqual([]);
  });
});
