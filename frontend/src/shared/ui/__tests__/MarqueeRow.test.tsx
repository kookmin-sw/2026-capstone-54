let mockReduced = false;

jest.mock("@/shared/lib/animation", () => ({
  useReducedMotion: () => mockReduced,
}));

import { render, screen } from "@testing-library/react";
import { MarqueeRow } from "../MarqueeRow";

describe("MarqueeRow", () => {
  beforeEach(() => {
    mockReduced = false;
  });

  it("children 을 양쪽 track 에 중복 렌더 (총 2 그룹)", () => {
    render(
      <MarqueeRow>
        <span data-testid="item">A</span>
      </MarqueeRow>,
    );

    expect(screen.getAllByTestId("item")).toHaveLength(2);
  });

  it("direction='left' (default) → marqueeLeft 애니메이션 적용", () => {
    const { container } = render(
      <MarqueeRow>
        <span>x</span>
      </MarqueeRow>,
    );
    const track = container.querySelector(".flex.w-max") as HTMLElement;
    expect(track.style.animation).toContain("marqueeLeft");
    expect(track.style.animation).toContain("linear infinite");
  });

  it("direction='right' → marqueeRight 애니메이션", () => {
    const { container } = render(
      <MarqueeRow direction="right">
        <span>x</span>
      </MarqueeRow>,
    );
    const track = container.querySelector(".flex.w-max") as HTMLElement;
    expect(track.style.animation).toContain("marqueeRight");
  });

  it("duration prop 으로 애니메이션 시간 변경", () => {
    const { container } = render(
      <MarqueeRow duration={20}>
        <span>x</span>
      </MarqueeRow>,
    );
    const track = container.querySelector(".flex.w-max") as HTMLElement;
    expect(track.style.animation).toContain("20s");
  });

  it("reducedMotion=true → 애니메이션 미적용", () => {
    mockReduced = true;
    const { container } = render(
      <MarqueeRow>
        <span>x</span>
      </MarqueeRow>,
    );
    const track = container.querySelector(".flex.w-max") as HTMLElement;
    expect(track.style.animation).toBe("");
  });

  it("pauseOnHover=true (default) → group/marquee + 일시정지 클래스", () => {
    const { container } = render(
      <MarqueeRow>
        <span>x</span>
      </MarqueeRow>,
    );
    expect((container.firstChild as HTMLElement).className).toContain("group/marquee");
    expect(container.querySelector(".group-hover\\/marquee\\:\\[animation-play-state\\:paused\\]")).toBeInTheDocument();
  });

  it("pauseOnHover=false → group/marquee 클래스 미적용", () => {
    const { container } = render(
      <MarqueeRow pauseOnHover={false}>
        <span>x</span>
      </MarqueeRow>,
    );
    expect((container.firstChild as HTMLElement).className).not.toContain("group/marquee");
  });

  it("gap prop → track + 양 그룹 모두 gap 스타일 적용", () => {
    const { container } = render(
      <MarqueeRow gap="20px">
        <span>x</span>
      </MarqueeRow>,
    );
    const track = container.querySelector(".flex.w-max") as HTMLElement;
    expect(track.style.gap).toBe("20px");
  });

  it("className → 외부 컨테이너에 추가 클래스 병합", () => {
    const { container } = render(
      <MarqueeRow className="my-marquee">
        <span>x</span>
      </MarqueeRow>,
    );
    expect((container.firstChild as HTMLElement).className).toContain("my-marquee");
  });

  it("두 번째 그룹 aria-hidden='true' (중복 콘텐츠 a11y)", () => {
    const { container } = render(
      <MarqueeRow>
        <span>x</span>
      </MarqueeRow>,
    );
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });
});
