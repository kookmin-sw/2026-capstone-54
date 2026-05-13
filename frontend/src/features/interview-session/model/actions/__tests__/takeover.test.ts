jest.mock("../../../api/interviewApi", () => ({
  interviewApi: {
    takeoverInterviewSession: jest.fn(),
  },
}));

import { interviewApi } from "../../../api/interviewApi";
import { applyTakeover } from "../takeover";

const mockTakeover = interviewApi.takeoverInterviewSession as jest.Mock;

describe("applyTakeover", () => {
  beforeEach(() => jest.clearAllMocks());

  it("성공 시 ownership 정보 + takeoverModalOpen=false 설정", async () => {
    mockTakeover.mockResolvedValue({
      ownerToken: "new-token",
      ownerVersion: 5,
      wsTicket: "new-ws-ticket",
    });
    const setMock = jest.fn();

    await applyTakeover(setMock, "sess-1");

    expect(mockTakeover).toHaveBeenCalledWith("sess-1");
    expect(setMock).toHaveBeenCalledWith({
      ownerToken: "new-token",
      ownerVersion: 5,
      wsTicket: "new-ws-ticket",
      takeoverModalOpen: false,
    });
  });

  it("API 에러 시 reject (set 미호출 — 호출자가 처리)", async () => {
    mockTakeover.mockRejectedValue(new Error("forbidden"));
    const setMock = jest.fn();

    await expect(applyTakeover(setMock, "sess-1")).rejects.toThrow("forbidden");
    expect(setMock).not.toHaveBeenCalled();
  });
});
