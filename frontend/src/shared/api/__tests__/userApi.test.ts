const mockApiRequest = jest.fn();

jest.mock("../client", () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
}));

import { userApi } from "../userApi";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("userApi.getMe", () => {
  it("backend snake_case → camelCase 매핑", async () => {
    mockApiRequest.mockResolvedValue({
      name: "홍",
      email: "h@x.com",
      is_email_confirmed: true,
      is_profile_completed: false,
    });

    const result = await userApi.getMe();
    expect(result).toEqual({
      name: "홍",
      email: "h@x.com",
      isEmailConfirmed: true,
      isProfileCompleted: false,
    });
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/users/me/",
      expect.objectContaining({ auth: true }),
    );
  });
});

describe("userApi.updateMe", () => {
  it("PATCH + body 그대로 + 응답 camelCase 매핑", async () => {
    mockApiRequest.mockResolvedValue({
      name: "새이름",
      email: "x@x.com",
      is_email_confirmed: true,
      is_profile_completed: true,
    });

    const result = await userApi.updateMe({ name: "새이름" });

    const opts = mockApiRequest.mock.calls[0][1] as { method: string; auth: boolean; body: string };
    expect(opts.method).toBe("PATCH");
    expect(opts.auth).toBe(true);
    expect(JSON.parse(opts.body)).toEqual({ name: "새이름" });
    expect(result.name).toBe("새이름");
    expect(result.isProfileCompleted).toBe(true);
  });
});

describe("userApi.changePassword", () => {
  it("POST + snake_case body 변환", async () => {
    mockApiRequest.mockResolvedValue({ message: "변경됨" });

    await userApi.changePassword({ currentPassword: "old", newPassword: "new" });

    const body = JSON.parse((mockApiRequest.mock.calls[0][1] as { body: string }).body);
    expect(body).toEqual({ current_password: "old", new_password: "new" });
  });
});

describe("userApi.deleteAccount", () => {
  it("DELETE /api/v1/users/ + auth=true", async () => {
    mockApiRequest.mockResolvedValue(undefined);
    await userApi.deleteAccount();
    expect(mockApiRequest).toHaveBeenCalledWith(
      "/api/v1/users/",
      expect.objectContaining({ method: "DELETE", auth: true }),
    );
  });
});
