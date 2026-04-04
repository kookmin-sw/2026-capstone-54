const TESTIMONIALS = [
  {
    name: "김서연",
    role: "프론트엔드 개발자 취준생",
    quote: "면접에서 항상 긴장했는데, meFit으로 연습하니까 실전에서 훨씬 자연스럽게 답변할 수 있었어요. 꼬리질문 기능이 진짜 실제 면접 같아요.",
    avatar: "👩‍💻",
  },
  {
    name: "박준혁",
    role: "백엔드 개발자 · 이직 준비",
    quote: "시선 추적 분석 덕분에 면접 중 시선이 자꾸 내려가는 습관을 고칠 수 있었습니다. 리포트가 정말 상세해서 좋았어요.",
    avatar: "👨‍💼",
  },
  {
    name: "이하은",
    role: "디자이너 · 신입",
    quote: "이력서 기반으로 질문이 나오니까 훨씬 실전적이에요. 3일 만에 면접 합격 연락 받았습니다!",
    avatar: "👩‍🎨",
  },
  {
    name: "정민수",
    role: "PM · 경력 3년차",
    quote: "스트릭 기능 덕분에 매일 꾸준히 연습하게 됐어요. AI 피드백이 생각보다 정확해서 놀랐습니다.",
    avatar: "🧑‍💻",
  },
];

export function TestimonialsSection() {
  return (
    <section id="reviews" className="testimonials-section">
      <div className="testimonials-inner">
        <div className="testimonials-header">
          <div className="testimonials-badge">면접 후기</div>
          <h2 className="testimonials-title">실제 사용자들의 이야기.</h2>
        </div>
        <div className="testimonials-grid">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="testimonial-card">
              <p className="testimonial-quote">"{t.quote}"</p>
              <div className="testimonial-author">
                <span className="testimonial-avatar">{t.avatar}</span>
                <div>
                  <div className="testimonial-name">{t.name}</div>
                  <div className="testimonial-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .testimonials-section {
          padding: 64px 20px;
          display: flex; justify-content: center;
          background: #F9FAFB;
        }
        .testimonials-inner { max-width: 480px; width: 100%; }
        .testimonials-header { text-align: center; margin-bottom: 32px; }
        .testimonials-badge {
          display: inline-block; font-size: 12px; font-weight: 700;
          color: #0991B2; background: #E6F7FA;
          border-radius: 4px; padding: 5px 14px; margin-bottom: 14px;
        }
        .testimonials-title {
          font-family: 'Inter', sans-serif; font-size: clamp(24px, 7vw, 36px);
          font-weight: 800; color: #0A0A0A;
        }
        .testimonials-grid { display: flex; flex-direction: column; gap: 12px; }
        .testimonial-card {
          background: #FFFFFF; border-radius: 8px; padding: 24px 20px;
          border: 1px solid #E5E7EB;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .testimonial-quote {
          font-size: 14px; color: #374151; line-height: 1.7; margin-bottom: 16px;
        }
        .testimonial-author {
          display: flex; align-items: center; gap: 10px;
        }
        .testimonial-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: #F3F4F6; display: flex; align-items: center;
          justify-content: center; font-size: 18px; flex-shrink: 0;
        }
        .testimonial-name {
          font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700; color: #0A0A0A;
        }
        .testimonial-role { font-size: 12px; color: #6B7280; }

        @media (min-width: 768px) {
          .testimonials-section { padding: 100px 40px; }
          .testimonials-inner { max-width: 1080px; }
          .testimonials-header { margin-bottom: 56px; }
          .testimonials-badge { font-size: 13px; padding: 6px 18px; margin-bottom: 18px; }
          .testimonials-title { font-size: clamp(32px, 4vw, 52px); }
          .testimonials-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
          .testimonial-card { border-radius: 8px; padding: 32px 28px; }
          .testimonial-quote { font-size: 15px; }
          .testimonial-name { font-size: 14px; }
          .testimonial-role { font-size: 13px; }
        }
      `}</style>
    </section>
  );
}