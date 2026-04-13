import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useResumeInputStore } from "@/features/resume";
import {
  Card,
  Input,
  Textarea,
  Button,
  Badge,
  Alert,
  ProgressBar,
  Chip,
} from "@/shared/ui";

const MAX_CONTENT = 5000;
const MAX_TITLE = 40;
const PROGRESS_THRESHOLD = 200;

const CHIPS = [
  { key: "fe", icon: "🎨", label: "프론트엔드" },
  { key: "be", icon: "⚙️", label: "백엔드" },
  { key: "fs", icon: "🛠", label: "풀스택" },
  { key: "ds", icon: "✏️", label: "디자이너" },
  { key: "pm", icon: "📊", label: "PM" },
  { key: "nw", icon: "🌱", label: "신입" },
];

export function ResumeInputPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    title,
    content,
    detectedTags,
    previewSummary,
    showPreview,
    showCharWarn,
    isSubmitting,
    showSuccess,
    error,
    setTitle,
    setContent,
    applyTemplate,
    loadForEdit,
    submit,
    closeSuccess,
    reset,
  } = useResumeInputStore();

  const editingUuid = searchParams.get("uuid");

  useEffect(() => {
    if (editingUuid) {
      loadForEdit(editingUuid);
    } else {
      reset();
    }
  }, [editingUuid, loadForEdit, reset]);

  const contentLen = content.length;
  const titleLen = title.length;
  const canSubmit = contentLen > 0 && !isSubmitting;

  const handleSubmit = () => {
    if (!title.trim()) {
      document.getElementById("ri-title-input")?.focus();
      return;
    }
    if (canSubmit) submit();
  };

  return (
    <div className="bg-white font-inter text-[#0A0A0A] min-h-screen pb-[100px] antialiased">
      {/* ── STEP BAR ── */}
      <div className="bg-white/50 backdrop-blur-[12px] border-b border-[#E5E7EB]">
        <div className="max-w-container-xl mx-auto px-6 py-[14px] flex items-center justify-center gap-2 md:gap-3 md:py-4 md:px-8">
          <div className="flex items-center gap-[6px]">
            <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[12px] font-extrabold shrink-0 bg-[#059669] text-white">
              ✓
            </div>
            <span className="text-[12px] font-bold text-[#9CA3AF] md:text-[13px]">방식 선택</span>
          </div>
          <div className="h-0.5 w-7 bg-[#059669] rounded-sm shrink-0 md:w-12" />
          <div className="flex items-center gap-[6px]">
            <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[12px] font-extrabold shrink-0 bg-[#0991B2] text-white animate-[ri-pulse_2s_infinite]">
              2
            </div>
            <span className="text-[12px] font-bold text-[#0991B2] md:text-[13px]">직접 입력</span>
          </div>
          <div className="h-0.5 w-7 bg-[#E5E7EB] rounded-sm shrink-0 md:w-12" />
          <div className="flex items-center gap-[6px]">
            <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[12px] font-extrabold shrink-0 bg-[#F3F4F6] text-[#9CA3AF]">
              3
            </div>
            <span className="text-[12px] font-bold text-[#9CA3AF] md:text-[13px]">AI 분석</span>
          </div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <main className="max-w-container-xl mx-auto px-6 pt-10 md:px-8 md:pt-12">
        <div className="grid grid-cols-1 gap-6 md:gap-8 min-[900px]:grid-cols-[1.3fr_1fr] min-[900px]:items-start">
          {/* ── LEFT FORM ── */}
          <div className="animate-[ri-fadeUp_0.45s_ease_both]">
            {/* Method toggle */}
            <div className="flex bg-[#F9FAFB] border border-[#E5E7EB] rounded-[14px] p-1 mb-6 shadow-[var(--sw)]">
              <button
                className="flex-1 py-[11px] border-none rounded-[11px] font-inter text-[13px] font-bold cursor-pointer transition-all duration-200 text-[#6B7280] bg-transparent hover:text-[#0A0A0A] md:text-[14px] md:py-3"
                onClick={() => navigate("/resume/upload")}
              >
                📎 파일 업로드
              </button>
              <button className="flex-1 py-[11px] border-none rounded-[11px] font-inter text-[13px] font-bold cursor-pointer transition-all duration-200 bg-[#0A0A0A] text-white shadow-[0_2px_8px_rgba(0,0,0,0.18)] md:text-[14px] md:py-3">
                ✏️ 직접 입력
              </button>
            </div>

            <h1 className="font-inter text-[clamp(22px,3.5vw,32px)] font-black text-[#0A0A0A] mb-[6px] leading-[1.25]">
              경력을 자유롭게
              <br />
              적어주세요
            </h1>
            <p className="text-[14px] text-[#6B7280] leading-[1.6] mb-[22px]">
              한 줄도 괜찮아요. 내용이 많을수록 더 정확한 면접 질문이 만들어져요 😊
            </p>

            {/* Title field */}
            <div className="mb-4">
              <Input
                id="ri-title-input"
                label="이력서 제목"
                required
                helperText={`${titleLen}/${MAX_TITLE}`}
                type="text"
                placeholder="예: 신입 프론트엔드 자기소개"
                maxLength={MAX_TITLE}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                error={error && !title.trim() ? "제목을 입력해주세요" : undefined}
              />
            </div>

            {/* Template chips */}
            <div className="mb-4">
              <span className="text-[12px] font-bold text-[#6B7280] mb-2 block">
                💡 빠른 템플릿으로 시작하기
              </span>
              <div className="flex gap-[7px] flex-wrap">
                {CHIPS.map((c) => (
                  <Chip key={c.key} icon={c.icon} onClick={() => applyTemplate(c.key)}>
                    {c.label}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <Textarea
              maxLength={MAX_CONTENT}
              placeholder={`예시)\n경력: 스타트업 백엔드 개발자 3년\n기술: Python, Django, PostgreSQL, Redis, AWS\n학력: 컴퓨터공학과 졸업 (2019~2023)\n\n주요 업무:\n- 월 500만 DAU 서비스의 API 설계 및 개발\n- 결제 시스템 도입 및 PG사 연동\n\n자기소개:\n기술적 문제 해결에 열정이 있으며 팀 소통을 중시합니다.`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              showCharCount
              rows={12}
              className="mb-[14px]"
            />

            {/* Char warning */}
            {showCharWarn && (
              <Alert variant="warning" className="mb-3">
                ⚠️ 50자 이상 작성하면 더 정확한 질문이 만들어져요!
              </Alert>
            )}

            {/* Error */}
            {error && <Alert variant="error" className="mb-3">{error}</Alert>}

            {/* Live preview */}
            {showPreview && (
              <Card className="mb-[14px] animate-[ri-fadeUp_0.35s_ease_both]">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-inter text-[14px] font-extrabold text-[#0A0A0A]">
                    🤖 AI 실시간 미리보기
                  </span>
                  <span className="flex items-center gap-[5px] text-[11px] font-bold text-[#059669]">
                    <span className="w-[7px] h-[7px] rounded-full bg-[#059669] animate-[ri-liveDot_2s_infinite]" />
                    Live
                  </span>
                </div>
                <div className="flex gap-[6px] flex-wrap mb-[10px]">
                  {detectedTags.length === 0 ? (
                    <span className="text-[12px] text-[#9CA3AF]">
                      기술 스택을 입력하면 태그가 표시돼요
                    </span>
                  ) : (
                    <>
                      {detectedTags.slice(0, 6).map((t, i) => (
                        <Badge
                          key={i}
                          variant="info"
                          className="animate-[ri-pop_0.3s_ease_both]"
                          style={{ animationDelay: `${i * 0.05}s` }}
                        >
                          {t}
                        </Badge>
                      ))}
                      {detectedTags.length > 6 && (
                        <Badge variant="default">+{detectedTags.length - 6}</Badge>
                      )}
                    </>
                  )}
                </div>
                <div className="text-[12px] text-[#6B7280] leading-[1.6] font-medium">
                  {previewSummary}
                </div>
              </Card>
            )}

            <Button variant="link" fullWidth onClick={() => navigate("/interview/setup")}>
              이력서 없이 면접 시작하기 →
            </Button>
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="flex flex-col gap-4 animate-[ri-fadeUp_0.45s_ease_0.1s_both] min-[900px]:sticky min-[900px]:top-20">
            {/* Stats card */}
            <Card>
              <div className="font-inter text-[14px] font-extrabold text-[#0A0A0A] mb-3">
                📊 작성 현황
              </div>
              {[
                { label: "작성 글자 수", val: `${contentLen}자` },
                { label: "감지된 기술 스택", val: `${detectedTags.length}개` },
                {
                  label: "완성도",
                  val: `${Math.min(Math.round((contentLen / PROGRESS_THRESHOLD) * 100), 100)}%`,
                },
              ].map((row, i, arr) => (
                <div
                  key={row.label}
                  className={`flex items-center justify-between py-2 ${
                    i < arr.length - 1 ? "border-b border-[#E5E7EB]" : ""
                  }`}
                >
                  <span className="text-[12px] text-[#6B7280] font-semibold">{row.label}</span>
                  <span className="font-inter text-[14px] font-extrabold text-[#0A0A0A]">
                    {row.val}
                  </span>
                </div>
              ))}
            </Card>

            {/* Hint card */}
            <Card>
              <div className="flex items-center gap-[9px] mb-[14px]">
                <div className="w-8 h-8 rounded-[10px] bg-[#E6F7FA] border border-[rgba(9,145,178,0.2)] flex items-center justify-center text-[15px] shrink-0">
                  💡
                </div>
                <span className="font-inter text-[14px] font-extrabold text-[#0A0A0A]">
                  이렇게 작성하면 더 좋아요
                </span>
              </div>
              <div className="flex flex-col gap-[10px]">
                {[
                  { dot: "🎯", text: "구체적인 숫자나 성과를 포함하면 질문 깊이가 달라져요" },
                  { dot: "🛠", text: "기술 스택을 구체적으로 (React 18, TypeScript 5 등)" },
                  { dot: "📝", text: "자유 형식이라 형식에 구애받지 않아도 돼요" },
                  { dot: "🔒", text: "회사명 마스킹해도 분석에 지장 없어요" },
                ].map((h, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-[10px] text-[12px] text-[#6B7280] leading-[1.55] font-medium"
                  >
                    <div className="w-[22px] h-[22px] rounded-lg bg-[#E6F7FA] flex items-center justify-center text-[12px] shrink-0 mt-[1px]">
                      {h.dot}
                    </div>
                    <span>{h.text}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Sample card */}
            <div className="bg-gradient-to-br from-[rgba(6,182,212,0.1)] to-[rgba(9,145,178,0.05)] rounded-[20px] p-[18px] border border-[rgba(9,145,178,0.12)]">
              <div className="font-inter text-[14px] font-extrabold text-[#0991B2] mb-[10px]">
                ✍️ 작성 예시
              </div>
              <pre className="font-inter text-[12px] text-[#6B7280] leading-[1.7] font-medium whitespace-pre-wrap">{`경력: 프론트엔드 2년 (스타트업)\n기술: React, TypeScript, Next.js\n학력: 컴공 졸업 (2022)\n\n- Lighthouse 45→92점 성능 개선\n- 디자인 시스템 구축\n- 코드 리뷰 문화 도입`}</pre>
            </div>
          </div>
        </div>
      </main>

      {/* ── BOTTOM CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 z-[200] bg-white/95 backdrop-blur-[24px] border-t border-[#E5E7EB] px-6 pt-3 pb-[max(20px,env(safe-area-inset-bottom))] md:px-8 md:pt-[14px]">
        <div className="max-w-container-xl mx-auto flex items-center gap-4">
          <div className="flex-1 hidden md:block">
            <ProgressBar
              value={contentLen}
              max={PROGRESS_THRESHOLD}
              showLabel
              label="작성 완성도"
              height="sm"
            />
          </div>
          <Button
            size="lg"
            disabled={!canSubmit}
            onClick={handleSubmit}
            loading={isSubmitting}
            className="shrink-0 max-[767px]:flex-1"
          >
            {!isSubmitting && (contentLen > 0 ? "✅  이력서 저장하기" : "✏️ 내용을 입력해주세요")}
          </Button>
        </div>
      </div>

      {/* ── SUCCESS MODAL ── */}
      {showSuccess && (
        <div
          className="fixed inset-0 z-[400] bg-black/25 backdrop-blur-[8px] flex items-center justify-center p-6"
          onClick={closeSuccess}
        >
          <div
            className="bg-white rounded-[28px] px-7 py-9 text-center max-w-[400px] w-full shadow-[0_24px_60px_rgba(0,0,0,0.15)] animate-[ri-slideUp_0.4s_cubic-bezier(0.4,0,0.2,1)_both]"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-[64px] block mb-[14px]">🎉</span>
            <div className="font-inter text-[24px] font-black text-[#0A0A0A] mb-2">
              이력서 저장 완료!
            </div>
            <div className="text-[14px] text-[#6B7280] leading-[1.65] mb-6">
              AI가 지금 내용을 분석하고 있어요.
              <br />
              분석이 끝나면 알려드릴게요 😊
            </div>
            <Button fullWidth onClick={() => navigate("/resume")} className="mb-[10px]">
              이력서 목록 보기
            </Button>
            <Button
              fullWidth
              variant="secondary"
              onClick={() => navigate("/interview/setup")}
            >
              바로 면접 시작하기
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
