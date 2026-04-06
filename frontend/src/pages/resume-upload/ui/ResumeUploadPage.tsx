import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useResumeUploadStore } from "@/features/resume-upload";

const MAX_FILE_MB = 10;

const INFO_CARDS = [
  { icon: "🤖", title: "AI 자동 분석", desc: "기술 스택, 경력, 역량 자동 추출" },
  { icon: "🎯", title: "맞춤 질문 생성", desc: "내 경력에 딱 맞는 면접 질문" },
  { icon: "🔒", title: "개인정보 보호", desc: "암호화 저장, 본인만 열람 가능" },
  { icon: "📚", title: "버전 관리", desc: "직무별로 다른 이력서 등록" },
];

const AI_STEPS = [
  { bg: "bg-gradient-to-br from-[#BAE6FD] to-[#38BDF8]", icon: "📥", text: "파일에서 텍스트를 추출해요" },
  { bg: "bg-gradient-to-br from-[#CFFAFE] to-[#0991B2]",  icon: "🔍", text: "기술 스택, 경력 기간을 파악해요" },
  { bg: "bg-gradient-to-br from-[#A7F3D0] to-[#34D399]",  icon: "✨", text: "직무 맞춤 면접 질문을 생성해요" },
];

const TIPS = [
  { dot: "📝", text: "텍스트가 추출 가능한 PDF를 사용해주세요 (스캔본 ✕)" },
  { dot: "🎯", text: "구체적인 수치와 성과를 포함하면 질문 품질이 높아져요" },
  { dot: "🔒", text: "개인정보는 마스킹 처리해도 분석에 지장 없어요" },
];

export function ResumeUploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    title, file, isDragging, uploading, uploadPct, showSuccess, error,
    setTitle, setFile, removeFile, setDragging, upload, closeSuccess,
  } = useResumeUploadStore();

  const canUpload = !!file && !uploading;
  const ext = file ? file.name.split(".").pop()?.toUpperCase() ?? "" : "";
  const sizeMB = file ? (file.size / 1024 / 1024).toFixed(1) : "0";
  const titleError = error === "title";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      alert("10MB 이하 파일만 가능해요");
      return;
    }
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (!f) return;
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      alert("10MB 이하 파일만 가능해요");
      return;
    }
    setFile(f);
  };

  const handleRemove = () => {
    removeFile();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = () => {
    if (titleError || !title.trim()) {
      document.getElementById("ru-title-input")?.focus();
    }
    upload();
  };

  const zoneCls = [
    "border-2 border-dashed rounded-[18px] md:rounded-[20px] px-6 py-9 md:py-12 md:px-10 text-center bg-white cursor-pointer transition-all duration-[250ms] relative overflow-hidden mb-4",
    file
      ? "border-[#059669] bg-[rgba(16,185,129,.03)] cursor-default"
      : isDragging
      ? "border-[#0991B2] bg-[rgba(9,145,178,.05)] scale-[1.01]"
      : "border-[#E5E7EB] hover:border-[#0991B2] hover:bg-[rgba(9,145,178,.03)]",
  ].join(" ");

  const inputCls = [
    "w-full px-4 py-[14px] md:py-[15px] md:px-[18px] rounded-[10px] border bg-white text-sm md:text-[15px] font-medium text-[#0A0A0A] outline-none transition-[border-color,box-shadow] duration-200 box-border placeholder:text-[#D1D5DB]",
    titleError
      ? "border-[#DC2626] shadow-[0_0_0_3px_rgba(220,38,38,.1)]"
      : "border-[#E5E7EB] focus:border-[#0991B2] focus:shadow-[0_0_0_3px_rgba(9,145,178,.12)]",
  ].join(" ");

  const ctaBtnCls = "w-full py-4 border-none rounded-2xl cursor-pointer text-base font-black bg-[#0A0A0A] text-white shadow-[var(--sb)] transition-opacity duration-150 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:not-disabled:opacity-85 active:not-disabled:scale-[.97]";

  return (
    <div className="bg-white font-['Inter',sans-serif] text-[#0A0A0A] min-h-screen pb-[100px] antialiased">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-[100] bg-[rgba(255,255,255,.92)] backdrop-blur-[24px] border-b border-[#E5E7EB]">
        <div className="max-w-container-xl mx-auto px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-[10px]">
            <button
              className="w-9 h-9 rounded-[14px] bg-[#F9FAFB] border border-[#E5E7EB] cursor-pointer flex items-center justify-center shadow-[var(--sw)] text-[#0A0A0A] text-lg transition-colors hover:bg-[#F3F4F6]"
              onClick={() => navigate(-1)}
              aria-label="뒤로가기"
            >←</button>
            <a href="/home" className="text-xl font-black text-[#0A0A0A] no-underline">
              me<span className="text-[#0991B2]">Fit</span>
            </a>
          </div>
          <span className="text-base md:text-lg font-extrabold text-[#0A0A0A]">이력서 등록</span>
          <div style={{ width: 36 }} />
        </div>
      </nav>

      {/* ── STEP BAR ── */}
      <div className="bg-[rgba(255,255,255,.5)] backdrop-blur-[12px] border-b border-[#E5E7EB]">
        <div className="max-w-container-xl mx-auto px-6 py-[14px] md:py-4 md:px-8 flex items-center justify-center gap-2 md:gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0 bg-[#059669] text-white">✓</div>
            <span className="text-xs md:text-[13px] font-bold text-[#9CA3AF]">방식 선택</span>
          </div>
          <div className="h-0.5 w-7 md:w-12 bg-[#059669] rounded-sm flex-shrink-0" />
          <div className="flex items-center gap-1.5">
            <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0 bg-[#0991B2] text-white animate-[ru-pulse_2s_infinite]">2</div>
            <span className="text-xs md:text-[13px] font-bold text-[#0991B2]">파일 업로드</span>
          </div>
          <div className="h-0.5 w-7 md:w-12 bg-[#E5E7EB] rounded-sm flex-shrink-0" />
          <div className="flex items-center gap-1.5">
            <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0 bg-[#F3F4F6] text-[#9CA3AF]">3</div>
            <span className="text-xs md:text-[13px] font-bold text-[#9CA3AF]">AI 분석</span>
          </div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <main className="max-w-container-xl mx-auto px-6 pt-10 md:pt-12 md:px-8">

        {/* Page heading */}
        <div className="pb-7 md:pb-9 md:text-center animate-[ru-fadeUp_.45s_ease_.05s_both]">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase text-[#0991B2] bg-[#E6F7FA] px-3 py-1 rounded-full mb-[10px]">
            📎 파일 업로드
          </div>
          <h1 className="text-[clamp(26px,4vw,44px)] font-black leading-[1.1] tracking-[-0.5px] mb-2">
            이력서 파일을<br />업로드해주세요
          </h1>
          <p className="text-sm md:text-base text-[#6B7280] leading-[1.65]">
            PDF 또는 DOCX 파일을 올리면 AI가 자동으로 내용을 분석해드려요
          </p>
        </div>

        {/* Method toggle */}
        <div className="flex justify-center mb-8 animate-[ru-fadeUp_.45s_ease_.08s_both]">
          <div className="flex bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl p-1 shadow-[var(--sw)] w-full max-w-content">
            <button className="flex-1 py-[11px] md:py-[13px] border-none rounded-[13px] text-[13px] md:text-sm font-bold cursor-pointer transition-all bg-[#0A0A0A] text-white shadow-[0_2px_8px_rgba(0,0,0,.18)]">
              📎 파일 업로드
            </button>
            <button
              className="flex-1 py-[11px] md:py-[13px] border-none rounded-[13px] text-[13px] md:text-sm font-bold cursor-pointer transition-all text-[#6B7280] bg-transparent"
              onClick={() => navigate("/resume/input")}
            >
              ✏️ 직접 입력
            </button>
          </div>
        </div>

        {/* 2-col grid */}
        <div className="grid grid-cols-1 min-[900px]:grid-cols-[1.2fr_1fr] gap-5 min-[900px]:gap-7 max-w-[900px] mx-auto min-[900px]:items-start">

          {/* ── LEFT FORM ── */}
          <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-[24px] md:rounded-[28px] p-6 md:p-8 shadow-[var(--sc)] animate-[ru-fadeUp_.45s_ease_.1s_both]">

            {/* Title field */}
            <div className="mb-[18px]">
              <label className="text-xs font-bold text-[#6B7280] mb-[7px] flex items-center tracking-[.04em]" htmlFor="ru-title-input">
                이력서 제목 <span className="text-[#DC2626] ml-[3px]">*</span>
              </label>
              <input
                id="ru-title-input"
                className={inputCls}
                type="text"
                placeholder="예: 백엔드 개발자 이력서 v3"
                maxLength={40}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Upload zone */}
            <div
              className={zoneCls}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => !file && fileInputRef.current?.click()}
            >
              <span className="text-[clamp(36px,6vw,52px)] mb-3 block animate-[ru-bounce_3s_ease-in-out_infinite]">
                {file ? "✅" : "📎"}
              </span>
              <div className="text-[clamp(14px,2vw,17px)] font-extrabold mb-1.5">
                {file ? "파일이 선택됐어요!" : "이력서를 여기에 드롭하세요"}
              </div>
              <p className="text-[13px] text-[#6B7280] mb-[14px] cursor-pointer">
                {file
                  ? <span onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                      다른 파일로 <u className="text-[#0991B2] font-bold underline underline-offset-[2px]">다시 선택</u>
                    </span>
                  : <>또는 <span className="text-[#0991B2] font-bold underline underline-offset-[2px]">파일 직접 선택</span>하기</>
                }
              </p>
              <div className="flex gap-1.5 justify-center flex-wrap">
                {["PDF", "DOCX", "최대 10MB"].map((t) => (
                  <span key={t} className="text-[11px] font-bold text-[#6B7280] bg-[#F3F4F6] px-[11px] py-1 rounded-full">{t}</span>
                ))}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </div>

            {/* File preview */}
            {file && !uploading && (
              <div className="flex items-center gap-3 bg-white border border-[#E5E7EB] rounded-[14px] p-[14px_16px] mb-4 shadow-[var(--sc)] animate-[ru-fadeUp_.3s_ease_both]">
                <div className="w-11 h-11 rounded-[12px] bg-gradient-to-br from-[#BAE6FD] to-[#2563EB] flex items-center justify-center text-xl flex-shrink-0">
                  {ext === "PDF" ? "📄" : "📝"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[#0A0A0A] whitespace-nowrap overflow-hidden text-ellipsis">{file.name}</div>
                  <div className="text-xs text-[#6B7280] mt-0.5">{sizeMB} MB · {ext}</div>
                </div>
                <button
                  className="w-7 h-7 rounded-lg bg-[rgba(239,68,68,.1)] border-none cursor-pointer flex items-center justify-center text-[#EF4444] text-[13px] flex-shrink-0 transition-colors hover:bg-[rgba(239,68,68,.18)]"
                  onClick={handleRemove}
                  aria-label="파일 삭제"
                >✕</button>
              </div>
            )}

            {/* Upload progress */}
            {uploading && (
              <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-4 mb-4 shadow-[var(--sc)]">
                <div className="flex justify-between mb-[10px]">
                  <span className="text-[13px] font-bold text-[#0A0A0A]">업로드 중…</span>
                  <span className="text-[13px] font-extrabold text-[#0991B2]">{uploadPct}%</span>
                </div>
                <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#06B6D4] to-[#0991B2] transition-[width] duration-[400ms] ease-out"
                    style={{ width: `${uploadPct}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error */}
            {error && error !== "title" && (
              <div className="text-xs text-[#DC2626] font-semibold px-[14px] py-[9px] rounded-[10px] bg-[#FEF2F2] border border-[#FECACA] mb-3">
                {error}
              </div>
            )}

            {/* CTA (desktop only) */}
            <div className="hidden md:block mt-1">
              <button className={ctaBtnCls} disabled={!canUpload} onClick={handleUpload}>
                {uploading
                  ? <><span className="w-[18px] h-[18px] rounded-full border-2 border-[rgba(255,255,255,.35)] border-t-white animate-[ru-spin_.7s_linear_infinite]" />업로드 중…</>
                  : file
                  ? "✅  이 이력서로 등록하기"
                  : "📎 파일을 선택해주세요"
                }
              </button>
            </div>

            <button
              className="block w-full text-center text-[13px] text-[#9CA3AF] font-semibold py-[14px] cursor-pointer bg-none border-none underline underline-offset-[2px] transition-colors hover:text-[#6B7280]"
              onClick={() => navigate("/interview/setup")}
            >
              이력서 없이 면접 시작하기 →
            </button>
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="flex flex-col gap-4 animate-[ru-fadeUp_.45s_ease_.18s_both] min-[900px]:sticky min-[900px]:top-20">

            {/* Info 2x2 grid */}
            <div className="grid grid-cols-2 gap-[10px] md:gap-3">
              {INFO_CARDS.map((c) => (
                <div key={c.title} className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl md:rounded-[18px] p-[14px] md:p-[18px] shadow-[var(--sw)]">
                  <span className="text-xl md:text-[22px] mb-1.5 md:mb-2 block">{c.icon}</span>
                  <div className="text-[13px] font-extrabold mb-[3px]">{c.title}</div>
                  <div className="text-[11px] md:text-xs text-[#6B7280] leading-[1.55]">{c.desc}</div>
                </div>
              ))}
            </div>

            {/* AI preview card */}
            <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-[20px] md:rounded-[24px] p-5 md:p-7 shadow-[var(--sc)]">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-[#059669] animate-[ru-liveDot_2s_infinite]" />
                <span className="text-xs font-bold text-[#059669]">업로드 후 자동으로 진행</span>
              </div>
              <div className="text-[clamp(14px,1.8vw,16px)] font-extrabold mb-[14px]">AI가 이런 작업을 해드려요</div>
              <div className="flex flex-col gap-[10px] mb-4">
                {AI_STEPS.map((s, i) => (
                  <div key={i} className="flex items-center gap-[10px] text-[13px] text-[#6B7280] font-medium">
                    <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center text-sm flex-shrink-0 ${s.bg}`}>
                      {s.icon}
                    </div>
                    <span>{s.text}</span>
                  </div>
                ))}
              </div>
              <div className="h-px bg-[#E5E7EB] my-4" />
              <div className="text-[13px] font-extrabold mb-[10px]">💡 더 좋은 결과를 위한 팁</div>
              <div className="flex flex-col gap-2">
                {TIPS.map((t, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-[#6B7280] leading-[1.55] font-medium">
                    <div className="w-[22px] h-[22px] rounded-[7px] bg-[#E6F7FA] flex items-center justify-center text-[11px] flex-shrink-0 mt-[1px]">
                      {t.dot}
                    </div>
                    <span>{t.text}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* ── MOBILE FIXED CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 z-[200] px-6 pt-3 pb-[max(20px,env(safe-area-inset-bottom))] bg-[rgba(255,255,255,.95)] backdrop-blur-[24px] border-t border-[#E5E7EB] md:hidden">
        <button className={ctaBtnCls} disabled={!canUpload} onClick={handleUpload}>
          {uploading
            ? <><span className="w-[18px] h-[18px] rounded-full border-2 border-[rgba(255,255,255,.35)] border-t-white animate-[ru-spin_.7s_linear_infinite]" />업로드 중…</>
            : file
            ? "✅  이 이력서로 등록하기"
            : "📎 파일을 선택해주세요"
          }
        </button>
      </div>

      {/* ── SUCCESS MODAL ── */}
      {showSuccess && (
        <div
          className="fixed inset-0 z-[400] bg-[rgba(0,0,0,.25)] backdrop-blur-[8px] flex items-center justify-center p-6"
          onClick={closeSuccess}
        >
          <div
            className="bg-white rounded-[28px] p-10 px-8 text-center max-w-text w-full shadow-[0_24px_60px_rgba(0,0,0,.15)] animate-[ru-slideUp_.4s_cubic-bezier(.4,0,.2,1)_both]"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-[64px] block mb-4">🎉</span>
            <div className="text-[26px] font-black text-[#0A0A0A] mb-2">이력서 업로드 완료!</div>
            <div className="text-sm text-[#6B7280] leading-[1.65] mb-7">
              AI가 지금 이력서를 분석하고 있어요.<br />분석이 끝나면 맞춤 질문이 준비돼요 😊
            </div>
            <button
              className="w-full py-[15px] border-none rounded-2xl cursor-pointer text-[15px] font-black bg-[#0A0A0A] text-white shadow-[var(--sb)] mb-[10px] transition-opacity hover:opacity-85"
              onClick={() => navigate("/resume")}
            >이력서 목록 보기</button>
            <button
              className="w-full py-[15px] border border-[#0991B2] rounded-2xl cursor-pointer text-sm font-bold bg-[#E6F7FA] text-[#0991B2] transition-colors hover:bg-[#cceef6]"
              onClick={() => navigate("/interview/setup")}
            >바로 면접 시작하기</button>
          </div>
        </div>
      )}
    </div>
  );
}
