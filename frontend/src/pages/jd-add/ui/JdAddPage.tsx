import { Link, useNavigate } from "react-router-dom";
import { useJdAddStore, type JdStatus } from "@/features/jd";
import {
  Card,
  Input,
  SectionHeader,
  StatusCard,
  Toggle,
  Divider,
  Alert,
  Button,
  Badge,
} from "@/shared/ui";

const STATUS_OPTIONS: { value: JdStatus; icon: string; label: string; desc: string }[] = [
  { value: "planned", icon: "📅", label: "지원 예정", desc: "곧 지원할 예정" },
  { value: "saved", icon: "⭐", label: "관심 저장", desc: "관심만 저장" },
  { value: "applied", icon: "✅", label: "지원 완료", desc: "이미 지원함" },
];

const PLATFORMS = [
  { name: "사람인", ok: true },
  { name: "잡코리아", ok: true },
  { name: "원티드", ok: true },
  { name: "링크드인", ok: true },
  { name: "회사 홈페이지", ok: null },
];

export function JdAddPage() {
  const navigate = useNavigate();
  const {
    url,
    customTitle,
    status,
    interviewActive,
    urlValidState,
    urlAnalysis,
    isSubmitting,
    isSaving,
    error,
    setUrl,
    setCustomTitle,
    setStatus,
    setInterviewActive,
    clearError,
    submit,
    saveDraft,
  } = useJdAddStore();

  const handleSubmit = async () => {
    clearError();
    const jdUuid = await submit();
    if (jdUuid) navigate(`/jd/${jdUuid}`);
  };

  const handleSaveDraft = async () => {
    clearError();
    await saveDraft();
  };

  const fieldStatusCls = () => {
    if (urlValidState === "checking") return "text-[#0991B2]";
    if (urlValidState === "ok") return "text-[#059669]";
    if (urlValidState === "error") return "text-[#DC2626]";
    return "";
  };

  return (
    <div>
      <div className="relative w-full px-8 pt-[28px] pb-[60px] max-sm:px-4 max-sm:pt-5">
        {/* PAGE HEADER */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[1.4px] uppercase text-[#0991B2] bg-[#E6F7FA] py-1 px-3 rounded-full mb-2.5">+ 채용공고 추가</div>
            <h1 className="text-[clamp(24px,3vw,36px)] font-black tracking-[-0.8px] text-[#0A0A0A] leading-[1.1]">새 채용공고 등록</h1>
            <p className="text-sm text-[#6B7280] mt-1.5">URL만 붙여넣으면 AI가 나머지를 분석해 드려요</p>
          </div>
          <Link
            to="/jd"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#6B7280] bg-transparent border-none cursor-pointer py-[10px] px-4 rounded-lg transition-all hover:text-[#0A0A0A] hover:bg-[#F3F4F6] no-underline"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M10 12L6 8l4-4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            목록으로
          </Link>
        </div>

        {/* FORM LAYOUT */}
        <div className="grid grid-cols-[1fr_380px] gap-6 items-start max-[900px]:grid-cols-1">
          {/* MAIN FORM */}
          <div>
            <Card padding="lg" className="max-sm:p-[24px_16px]">
              {/* URL 섹션 */}
              <section className="mb-8">
                <SectionHeader
                  icon="🔗"
                  title="채용공고 URL"
                  description="⚠️정확한 채용공고 페이지 URL을 입력해주세요."
                  gradient="linear-gradient(135deg,#60A5FA,#2563EB)"
                />

                <div className="mb-5">
                  <Input
                    label="URL"
                    required
                    helperText="사람인, 잡코리아, 원티드, 링크드인 등"
                    icon="🔗"
                    type="url"
                    placeholder="https://www.saramin.co.kr/zf_user/jobs/relay/view?..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    aria-label="채용공고 URL"
                  />

                  {urlValidState !== "idle" && (
                    <div className={`flex items-center gap-1.5 text-[12px] font-semibold mt-1.5 ${fieldStatusCls()}`}>
                      {urlValidState === "checking" && "⟳ URL 확인 중..."}
                      {urlValidState === "ok" && "✓ 유효한 URL입니다"}
                      {urlValidState === "error" && "✗ 올바른 URL을 입력해 주세요"}
                    </div>
                  )}

                  {urlValidState === "ok" && urlAnalysis && (
                    <div className="mt-3 py-[14px] px-4 bg-[#ECFDF5] rounded-lg border border-[#A7F3D0] flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#D1FAE5] flex items-center justify-center text-base shrink-0">
                        🏢
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-semibold text-[#6B7280]">
                          {urlAnalysis.company} · {urlAnalysis.domain}
                        </div>
                        <div className="text-sm font-extrabold text-[#0A0A0A] whitespace-nowrap overflow-hidden text-ellipsis">
                          {urlAnalysis.title}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Input
                  label="내 식별 제목 (선택)"
                  helperText="미입력 시 공고 원제목 사용"
                  type="text"
                  placeholder="예: 네이버 백엔드 — 2차 지원"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  aria-label="내 식별 제목"
                />
              </section>

              <Divider />

              {/* 지원 상태 */}
              <section className="mb-8">
                <SectionHeader
                  icon="📌"
                  title="지원 상태"
                  description="현재 지원 진행 상태를 선택해 주세요"
                  gradient="linear-gradient(135deg,#67E8F9,#0891B2)"
                />
                <StatusCard options={STATUS_OPTIONS} selected={status} onSelect={setStatus} />
              </section>

              <Divider />

              {/* 면접 활성화 */}
              <section className="mb-8">
                <SectionHeader
                  icon="⚡"
                  title="면접 활성화"
                  gradient="linear-gradient(135deg,#34D399,#059669)"
                />
                <Toggle
                  checked={interviewActive}
                  onChange={setInterviewActive}
                  label="AI 면접에 포함하기"
                  description="비활성화 시 면접 질문 생성에서 제외됩니다"
                />
              </section>

              {/* ERROR */}
              {error && <Alert variant="error" className="mb-3.5">{error}</Alert>}

              {/* ACTIONS */}
              <div className="flex items-center justify-end gap-3 mt-7 pt-6 border-t border-[#E5E7EB]">
                <Button variant="ghost" onClick={() => navigate("/jd")}>
                  취소
                </Button>
                <Button variant="secondary" onClick={handleSaveDraft} disabled={isSaving}>
                  {isSaving ? "저장 중..." : "임시저장"}
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting} loading={isSubmitting}>
                  {!isSubmitting && "채용공고 추가하기"}
                  {!isSubmitting && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M2 7h10M8 3l4 4-4 4"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </Button>
              </div>
            </Card>
          </div>

          {/* SIDE PANEL */}
          <div className="max-[900px]:grid max-[900px]:grid-cols-2 max-[900px]:gap-3.5 max-sm:grid-cols-1">
            <Card className="mb-[18px] max-[900px]:mb-0">
              <div className="text-sm font-black text-[#0A0A0A] mb-4 flex items-center gap-2">
                <span style={{ fontSize: 18 }}>💡</span>
                이렇게 활용해요
              </div>
              {[
                "채용공고 URL을 복사해서 붙여넣으세요",
                "AI가 자동으로 요구 역량과 우대 사항을 분석해요",
                "분석이 완료되면 맞춤 면접 질문이 생성됩니다",
                "이력서와 연결해 더 정밀한 피드백을 받으세요",
              ].map((tip, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 mb-3 text-[13px] text-[#6B7280] leading-[1.6] last:mb-0"
                >
                  <div className="w-[22px] h-[22px] rounded-lg bg-[#E6F7FA] text-[#0991B2] text-[11px] font-extrabold flex items-center justify-center shrink-0 mt-px">
                    {i + 1}
                  </div>
                  {tip}
                </div>
              ))}
            </Card>

            <Card>
              <div className="text-sm font-black text-[#0A0A0A] mb-4 flex items-center gap-2">
                <span style={{ fontSize: 18 }}>🌐</span>
                지원 플랫폼
              </div>
              {PLATFORMS.map((p) => (
                <div
                  key={p.name}
                  className="flex items-center justify-between py-2.5 border-b border-[#F3F4F6] text-[13px] last:border-b-0 last:pb-0"
                >
                  <span className="text-[#6B7280] font-semibold">{p.name}</span>
                  {p.ok === true && <Badge variant="success">✓ 지원</Badge>}
                  {p.ok === null && <Badge variant="info">대부분</Badge>}
                </div>
              ))}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
