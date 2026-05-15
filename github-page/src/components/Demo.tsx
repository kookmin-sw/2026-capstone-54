import Section from "./Section";

const YOUTUBE_ID = "IRrJmqBDQqc";

export default function Demo() {
  return (
    <Section
      id="demo"
      eyebrow="시연 영상"
      title="미핏의 시연 영상을 확인해보세요"
      description={`서비스 소개부터 가상 면접과 분석 리포트까지, 영상으로 확인해보세요.`}
    >
      <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-border bg-fg shadow-sc">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${YOUTUBE_ID}?rel=0&modestbranding=1&playsinline=1`}
          title="meFit 시연 영상"
          className="block aspect-video w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          loading="lazy"
        />
      </div>
    </Section>
  );
}
