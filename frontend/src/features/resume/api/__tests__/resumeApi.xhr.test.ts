jest.mock("@/shared/api/client", () => ({
  BASE_URL: "https://api.test",
  apiRequest: jest.fn(),
  getAccessToken: jest.fn(),
}));

import { resumeApi } from "../resumeApi";
import { getAccessToken } from "@/shared/api/client";

const mockGetToken = getAccessToken as jest.Mock;

interface MockProgressEvent {
  lengthComputable: boolean;
  loaded: number;
  total: number;
}

class MockXHR {
  method = "";
  url = "";
  withCredentials = false;
  headers: Record<string, string> = {};
  status = 200;
  responseText = "";
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  upload = {
    onprogress: null as ((e: MockProgressEvent) => void) | null,
  };
  formSent: FormData | null = null;

  open(method: string, url: string): void {
    this.method = method;
    this.url = url;
  }
  setRequestHeader(name: string, value: string): void {
    this.headers[name] = value;
  }
  send(form: FormData): void {
    this.formSent = form;
    instances.push(this);
  }
}

const instances: MockXHR[] = [];

function latest(): MockXHR {
  if (instances.length === 0) throw new Error("XHR 인스턴스가 없습니다");
  return instances[instances.length - 1];
}

function formField(form: FormData, name: string): FormDataEntryValue | null {
  return form.get(name);
}

beforeEach(() => {
  instances.length = 0;
  mockGetToken.mockReturnValue("tok-1");
  Object.defineProperty(globalThis, "XMLHttpRequest", { value: MockXHR, writable: true });
});

describe("resumeApi.createFile — XHR 파일 업로드", () => {
  it("FormData 에 type/title/file 모두 append + POST 요청 + Authorization 헤더", async () => {
    const file = new File(["abc"], "resume.pdf", { type: "application/pdf" });
    const p = resumeApi.createFile("내 이력서", file);
    const xhr = latest();

    expect(xhr.method).toBe("POST");
    expect(xhr.url).toBe("https://api.test/api/v1/resumes/");
    expect(xhr.withCredentials).toBe(true);
    expect(xhr.headers.Authorization).toBe("Bearer tok-1");

    expect(formField(xhr.formSent!, "type")).toBe("file");
    expect(formField(xhr.formSent!, "title")).toBe("내 이력서");
    expect((formField(xhr.formSent!, "file") as File).name).toBe("resume.pdf");

    xhr.status = 200;
    xhr.responseText = JSON.stringify({ uuid: "r-1", title: "내 이력서" });
    xhr.onload?.();
    await expect(p).resolves.toEqual({ uuid: "r-1", title: "내 이력서" });
  });

  it("access token 없음 → Authorization 헤더 미설정", async () => {
    mockGetToken.mockReturnValueOnce(null);
    const p = resumeApi.createFile("t", new File([""], "a.pdf"));
    const xhr = latest();

    expect(xhr.headers.Authorization).toBeUndefined();

    xhr.responseText = JSON.stringify({});
    xhr.onload?.();
    await p;
  });

  it("status 4xx → 'upload failed: <status>' 로 reject", async () => {
    const p = resumeApi.createFile("t", new File([""], "a.pdf"));
    const xhr = latest();

    xhr.status = 413;
    xhr.onload?.();

    await expect(p).rejects.toThrow("upload failed: 413");
  });

  it("status 200 + invalid JSON 응답 → 'invalid response' 로 reject", async () => {
    const p = resumeApi.createFile("t", new File([""], "a.pdf"));
    const xhr = latest();

    xhr.status = 200;
    xhr.responseText = "not-json {";
    xhr.onload?.();

    await expect(p).rejects.toThrow("invalid response");
  });

  it("xhr.onerror 호출 → 'network error' 로 reject", async () => {
    const p = resumeApi.createFile("t", new File([""], "a.pdf"));
    const xhr = latest();

    xhr.onerror?.();

    await expect(p).rejects.toThrow("network error");
  });

  it("upload.onprogress (lengthComputable=true) → onProgress(pct) 호출", async () => {
    const onProgress = jest.fn();
    const p = resumeApi.createFile("t", new File([""], "a.pdf"), onProgress);
    const xhr = latest();

    xhr.upload.onprogress?.({ lengthComputable: true, loaded: 25, total: 100 });
    xhr.upload.onprogress?.({ lengthComputable: true, loaded: 100, total: 100 });

    expect(onProgress).toHaveBeenNthCalledWith(1, 25);
    expect(onProgress).toHaveBeenNthCalledWith(2, 100);

    xhr.responseText = "{}";
    xhr.onload?.();
    await p;
  });

  it("upload.onprogress (lengthComputable=false) → onProgress 미호출", async () => {
    const onProgress = jest.fn();
    const p = resumeApi.createFile("t", new File([""], "a.pdf"), onProgress);
    const xhr = latest();

    xhr.upload.onprogress?.({ lengthComputable: false, loaded: 25, total: 0 });

    expect(onProgress).not.toHaveBeenCalled();

    xhr.responseText = "{}";
    xhr.onload?.();
    await p;
  });

  it("onProgress 콜백 미지정 시 lengthComputable=true 라도 안전하게 동작 (호출 없음)", async () => {
    const p = resumeApi.createFile("t", new File([""], "a.pdf"));
    const xhr = latest();

    expect(() => {
      xhr.upload.onprogress?.({ lengthComputable: true, loaded: 50, total: 100 });
    }).not.toThrow();

    xhr.responseText = "{}";
    xhr.onload?.();
    await p;
  });
});

describe("resumeApi.updateFile — XHR 파일 교체", () => {
  it("PATCH URL 에 uuid 포함 + title/file 만 선택적으로 append", async () => {
    const file = new File(["x"], "new.pdf");
    const p = resumeApi.updateFile("r-9", { title: "수정된 제목", file });
    const xhr = latest();

    expect(xhr.method).toBe("PATCH");
    expect(xhr.url).toBe("https://api.test/api/v1/resumes/r-9/");
    expect(xhr.headers.Authorization).toBe("Bearer tok-1");

    expect(formField(xhr.formSent!, "title")).toBe("수정된 제목");
    expect((formField(xhr.formSent!, "file") as File).name).toBe("new.pdf");

    xhr.responseText = JSON.stringify({ uuid: "r-9" });
    xhr.onload?.();
    await expect(p).resolves.toEqual({ uuid: "r-9" });
  });

  it("title 만 patch → file 은 append 안 됨", async () => {
    const p = resumeApi.updateFile("r-9", { title: "제목만" });
    const xhr = latest();

    expect(formField(xhr.formSent!, "title")).toBe("제목만");
    expect(formField(xhr.formSent!, "file")).toBeNull();

    xhr.responseText = "{}";
    xhr.onload?.();
    await p;
  });

  it("file 만 patch → title 은 append 안 됨", async () => {
    const file = new File(["y"], "only.pdf");
    const p = resumeApi.updateFile("r-9", { file });
    const xhr = latest();

    expect(formField(xhr.formSent!, "title")).toBeNull();
    expect((formField(xhr.formSent!, "file") as File).name).toBe("only.pdf");

    xhr.responseText = "{}";
    xhr.onload?.();
    await p;
  });

  it("title=빈 문자열 → 명시적으로 append (undefined 만 skip)", async () => {
    const p = resumeApi.updateFile("r-9", { title: "" });
    const xhr = latest();

    expect(formField(xhr.formSent!, "title")).toBe("");

    xhr.responseText = "{}";
    xhr.onload?.();
    await p;
  });

  it("status 4xx → 'update failed: <status>' 로 reject", async () => {
    const p = resumeApi.updateFile("r-9", { title: "x" });
    const xhr = latest();

    xhr.status = 404;
    xhr.onload?.();

    await expect(p).rejects.toThrow("update failed: 404");
  });

  it("invalid JSON 응답 → 'invalid response' 로 reject", async () => {
    const p = resumeApi.updateFile("r-9", { title: "x" });
    const xhr = latest();

    xhr.status = 200;
    xhr.responseText = "{not-json";
    xhr.onload?.();

    await expect(p).rejects.toThrow("invalid response");
  });

  it("xhr.onerror → 'network error'", async () => {
    const p = resumeApi.updateFile("r-9", { title: "x" });
    const xhr = latest();

    xhr.onerror?.();

    await expect(p).rejects.toThrow("network error");
  });

  it("upload.onprogress → onProgress(pct)", async () => {
    const onProgress = jest.fn();
    const p = resumeApi.updateFile("r-9", { title: "x" }, onProgress);
    const xhr = latest();

    xhr.upload.onprogress?.({ lengthComputable: true, loaded: 70, total: 100 });
    expect(onProgress).toHaveBeenCalledWith(70);

    xhr.responseText = "{}";
    xhr.onload?.();
    await p;
  });
});
