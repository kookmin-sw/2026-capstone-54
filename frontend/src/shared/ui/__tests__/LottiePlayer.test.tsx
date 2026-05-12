interface LottieMockProps {
  animationData?: unknown;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
  role?: string;
  "aria-label"?: string;
  lottieRef?: { current: { goToAndStop: jest.Mock; setSpeed: jest.Mock; play: jest.Mock } | null };
}

interface LottieRef {
  goToAndStop: jest.Mock;
  setSpeed: jest.Mock;
  play: jest.Mock;
}

const lottieRefs: LottieRef[] = [];
const lottieSpy = jest.fn<ReactElement, [LottieMockProps]>();

function lottieLastProps(): LottieMockProps | null {
  const calls = lottieSpy.mock.calls;
  return calls.length > 0 ? calls[calls.length - 1][0] : null;
}

function MockLottie(props: LottieMockProps) {
  lottieSpy(props);
  lottieRefs.push({ goToAndStop: jest.fn(), setSpeed: jest.fn(), play: jest.fn() });
  return <div data-testid="lottie-mock" role={props.role} aria-label={props["aria-label"]} />;
}

jest.mock("lottie-react", () => ({ __esModule: true, default: MockLottie }));

let mockReduced = false;
jest.mock("@/shared/lib/animation", () => ({
  useReducedMotion: () => mockReduced,
}));

import { render, screen, waitFor } from "@testing-library/react";
import { Suspense, type ReactElement } from "react";
import { LottiePlayer } from "../LottiePlayer";

function renderLottie(props: Parameters<typeof LottiePlayer>[0]) {
  return render(
    <Suspense fallback={<div data-testid="fallback" />}>
      <LottiePlayer {...props} />
    </Suspense>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockReduced = false;
  lottieRefs.length = 0;
  lottieSpy.mockClear();
  (globalThis as unknown as { fetch: jest.Mock }).fetch = jest.fn();
});

describe("LottiePlayer — fetch + 로딩 / 실패", () => {
  it("fetch 진행 중 (data=null) + failed=false → 빈 div fallback", () => {
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
    const { container } = renderLottie({ src: "/anim.json", ariaLabel: "x" });
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it("fetch 실패 (!res.ok) → failed=true → 빈 div + aria-hidden", async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: false, status: 404, json: jest.fn() });
    renderLottie({ src: "/missing.json", className: "my-anim" });

    await waitFor(() => {
      const node = document.querySelector('.my-anim[aria-hidden="true"]');
      expect(node).toBeInTheDocument();
    });
  });

  it("fetch reject → failed=true + 빈 div", async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error("network"));
    renderLottie({ src: "/x.json", className: "fail-cls" });

    await waitFor(() => {
      expect(document.querySelector('.fail-cls[aria-hidden="true"]')).toBeInTheDocument();
    });
  });

  it("성공 → Lottie 컴포넌트 마운트 + animationData 전달", async () => {
    const animData = { v: "5.7.0", layers: [] };
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(animData),
    });

    renderLottie({ src: "/anim.json", ariaLabel: "안내" });

    await waitFor(() => {
      expect(screen.getByTestId("lottie-mock")).toBeInTheDocument();
    });
    expect(lottieLastProps()?.animationData).toEqual(animData);
  });
});

describe("LottiePlayer — props 전달", () => {
  it("ariaLabel + className + style → Lottie 에 그대로 전달", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ v: "x" }),
    });

    renderLottie({ src: "/x.json", ariaLabel: "안내 애니메이션", className: "anim-cls" });

    await waitFor(() => {
      expect(screen.getByLabelText("안내 애니메이션")).toBeInTheDocument();
    });
    expect(lottieLastProps()?.className).toBe("anim-cls");
  });

  it("reduced=true → loop=false, autoplay=false 전달 (애니메이션 정지)", async () => {
    mockReduced = true;
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ v: "x" }),
    });

    renderLottie({ src: "/x.json", loop: true, autoplay: true });

    await waitFor(() => {
      expect(screen.getByTestId("lottie-mock")).toBeInTheDocument();
    });
    expect(lottieLastProps()?.loop).toBe(false);
    expect(lottieLastProps()?.autoplay).toBe(false);
  });

  it("reduced=false → loop/autoplay prop 그대로 전달", async () => {
    mockReduced = false;
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ v: "x" }),
    });

    renderLottie({ src: "/x.json", loop: true, autoplay: false });

    await waitFor(() => {
      expect(screen.getByTestId("lottie-mock")).toBeInTheDocument();
    });
    expect(lottieLastProps()?.loop).toBe(true);
    expect(lottieLastProps()?.autoplay).toBe(false);
  });
});
