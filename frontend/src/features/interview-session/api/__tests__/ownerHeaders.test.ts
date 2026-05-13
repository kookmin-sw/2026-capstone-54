const mockGetState = jest.fn();

jest.mock("../../model/store", () => ({
  useInterviewSessionStore: { getState: () => mockGetState() },
}));

import { ownerHeaders } from "../ownerHeaders";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("ownerHeaders", () => {
  it("ownerToken / ownerVersion 둘 다 있음 → X-Session-Owner-* 헤더 dict 반환", () => {
    mockGetState.mockReturnValue({ ownerToken: "tk-1", ownerVersion: 3 });

    expect(ownerHeaders()).toEqual({
      "X-Session-Owner-Token": "tk-1",
      "X-Session-Owner-Version": "3",
    });
  });

  it("ownerToken=null → 빈 객체", () => {
    mockGetState.mockReturnValue({ ownerToken: null, ownerVersion: 0 });
    expect(ownerHeaders()).toEqual({});
  });

  it("ownerVersion=null → 빈 객체 (token 만으로 fallback 없음)", () => {
    mockGetState.mockReturnValue({ ownerToken: "tk", ownerVersion: null });
    expect(ownerHeaders()).toEqual({});
  });

  it("ownerVersion=0 → 정상 헤더 (falsy 가 아닌 명시적 0 인정)", () => {
    mockGetState.mockReturnValue({ ownerToken: "tk", ownerVersion: 0 });
    expect(ownerHeaders()).toEqual({
      "X-Session-Owner-Token": "tk",
      "X-Session-Owner-Version": "0",
    });
  });
});
