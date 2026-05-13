export interface ApiSuccessEnvelope<T> {
  success: true;
  data: T;
}

export interface ApiFailEnvelope {
  success: false;
  error?: string;
  message?: string;
}

export function successApi<T>(data: T): ApiSuccessEnvelope<T> {
  return { success: true, data };
}

export function failApi(messageOrError: string, fieldName: "error" | "message" = "error"): ApiFailEnvelope {
  return fieldName === "error"
    ? { success: false, error: messageOrError }
    : { success: false, message: messageOrError };
}

export function apiCalls(mock: jest.Mock): Array<unknown[]> {
  return mock.mock.calls;
}

export function lastApiCall(mock: jest.Mock): unknown[] | undefined {
  return mock.mock.calls[mock.mock.calls.length - 1];
}

export function lastApiBody(mock: jest.Mock): Record<string, unknown> {
  const lastCall = lastApiCall(mock);
  if (!lastCall) throw new Error("apiRequest 가 호출되지 않았습니다");
  const opts = lastCall[1] as { body?: string } | undefined;
  if (!opts?.body) throw new Error("마지막 호출에 body 가 없습니다");
  return JSON.parse(opts.body) as Record<string, unknown>;
}
