const mockRegisterPlugin = jest.fn();

jest.mock("gsap", () => ({
  gsap: { registerPlugin: (...args: unknown[]) => mockRegisterPlugin(...args) },
}));

jest.mock("gsap/ScrollTrigger", () => ({
  ScrollTrigger: { name: "ScrollTrigger" },
}));

jest.mock("gsap/SplitText", () => ({
  SplitText: { name: "SplitText" },
}));

import { registerGsapPlugins, gsap, ScrollTrigger, SplitText } from "../gsap-config";

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});

describe("registerGsapPlugins", () => {
  it("호출 시 gsap.registerPlugin 에 ScrollTrigger + SplitText 등록", () => {
    jest.isolateModules(() => {
      const mod = jest.requireActual<typeof import("../gsap-config")>("../gsap-config");
      mod.registerGsapPlugins();
    });

    expect(mockRegisterPlugin).toHaveBeenCalledWith(ScrollTrigger, SplitText);
  });

  it("두 번째 호출 → 이미 등록되었으므로 재호출 안 함 (idempotent)", () => {
    registerGsapPlugins();
    const beforeCount = mockRegisterPlugin.mock.calls.length;
    registerGsapPlugins();
    expect(mockRegisterPlugin.mock.calls.length).toBe(beforeCount);
  });

  it("gsap / ScrollTrigger / SplitText 재export", () => {
    expect(gsap).toBeDefined();
    expect(ScrollTrigger).toBeDefined();
    expect(SplitText).toBeDefined();
  });
});
