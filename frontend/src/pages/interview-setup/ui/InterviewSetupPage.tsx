import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useInterviewSetupStore } from "@/features/interview-setup";

export function InterviewSetupPage() {
  const {
    jdList, jdListLoading, jdTab, selectedJdId,
    directCompany, directRole, directStage, directUrl,
    interviewMode, practiceMode,
    loadJdList, setJdTab, selectJd, setDirectField,
    setInterviewMode, setPracticeMode, getSummary,
  } = useInterviewSetupStore();

  const summary = getSummary();

  useEffect(() => {
    loadJdList();
  }, [loadJdList]);

  return (
    <>
      <main className="p-[28px_32px] min-w-0 max-sm:p-[20px_16px]">
          {/* Page Header */}
          <div className="mb-6 animate-[isetup-fadeUp_.4s_ease_both]">
            <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280] mb-2.5">
              <Link to="/home" className="text-[#6B7280] no-underline hover:text-[#0A0A0A]">홈</Link>
              <span className="opacity-40">/</span>
              <span className="text-[#0991B2] font-bold">면접 설정</span>
            </div>
            <h1 className="text-[clamp(22px,2.5vw,30px)] font-black tracking-[-0.5px] mb-1.5">면접을 설정해요</h1>
            <p className="text-sm text-[#6B7280]">채용공고와 면접 방식을 선택하고 AI 맞춤 면접을 시작하세요.</p>
          </div>

          {/* Stepper */}
          <div className="flex items-center bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-[14px_22px] mb-6 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_2px_8px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-[7px]">
              <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0 transition-all bg-[#0A0A0A] text-white">1</div>
              <span className="text-[12px] font-bold text-[#0A0A0A]">지원 컨텍스트</span>
            </div>
            <div className="flex-1 h-[1.5px] bg-[#E5E7EB] mx-[10px]" />
            <div className="flex items-center gap-[7px]">
              <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0 transition-all bg-[#E5E7EB] text-[#6B7280]">2</div>
              <span className="text-[12px] font-semibold text-[#6B7280]">면접 방식</span>
            </div>
            <div className="flex-1 h-[1.5px] bg-[#E5E7EB] mx-[10px]" />
            <div className="flex items-center gap-[7px]">
              <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0 transition-all bg-[#E5E7EB] text-[#6B7280]">3</div>
              <span className="text-[12px] font-semibold text-[#6B7280]">환경 점검</span>
            </div>
          </div>

          {/* Body */}
          <div className="grid grid-cols-[1fr_340px] gap-5 items-start max-lg:grid-cols-1">
            {/* LEFT: FORM */}
            <div>
              {/* Section 1: JD */}
              <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.06)] mb-3.5">
                <span className="text-[10px] font-bold tracking-[.1em] uppercase text-[#0991B2] mb-2.5 block">지원 컨텍스트</span>
                <div className="text-[15px] font-extrabold mb-[3px]">채용공고를 선택하세요</div>
                <div className="text-[13px] text-[#6B7280] mb-3.5 leading-[1.5]">등록된 채용공고를 선택하거나 직접 입력할 수 있어요.</div>

                {/* Tabs */}
                <div className="flex gap-1.5 mb-3.5">
                  {(["saved", "direct", "skip"] as const).map((tab) => (
                    <button
                      key={tab}
                      className={`flex-1 py-2 rounded-lg text-[12px] font-semibold border-[1.5px] cursor-pointer transition-all ${
                        jdTab === tab
                          ? "bg-[#E6F7FA] border-[#0991B2] text-[#0991B2]"
                          : "bg-transparent border-[#E5E7EB] text-[#6B7280]"
                      }`}
                      onClick={() => setJdTab(tab)}
                    >
                      {tab === "saved" ? "저장된 공고" : tab === "direct" ? "직접 입력" : "건너뛰기"}
                    </button>
                  ))}
                </div>

                {/* Tab: saved */}
                {jdTab === "saved" && (
                  <div className="flex flex-col gap-[7px] max-h-[210px] overflow-y-auto">
                    {jdListLoading ? (
                      <div style={{ padding: 16, textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>불러오는 중...</div>
                    ) : jdList.map((jd) => (
                      <div
                        key={jd.id}
                        className={`flex items-center gap-[11px] p-[12px_14px] rounded-lg border-[1.5px] cursor-pointer transition-all ${
                          selectedJdId === jd.id
                            ? "border-[#0991B2] bg-[#E6F7FA]"
                            : "border-[#E5E7EB] bg-[#F9FAFB] hover:border-[#0991B2] hover:bg-[#E6F7FA]"
                        }`}
                        onClick={() => selectJd(jd.id)}
                      >
                        <div className="w-8 h-8 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center text-sm shrink-0">{jd.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-bold">{jd.company}</div>
                          <div className="text-[11px] text-[#6B7280] mt-px">{jd.role} · {jd.stage}</div>
                        </div>
                        <span className={`inline-flex items-center text-[10px] font-bold py-[3px] px-2.5 rounded-full ${
                          jd.badgeType === "green"
                            ? "text-[#059669] bg-[#ECFDF5]"
                            : "text-[#0991B2] bg-[#E6F7FA]"
                        }`}>
                          {jd.badgeLabel}
                        </span>
                        <div className={`w-[18px] h-[18px] rounded-full border-[1.5px] flex items-center justify-center text-[9px] shrink-0 transition-all ${
                          selectedJdId === jd.id
                            ? "bg-[#0991B2] border-[#0991B2] text-white"
                            : "border-[#E5E7EB]"
                        }`}>
                          {selectedJdId === jd.id ? "✓" : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab: direct */}
                {jdTab === "direct" && (
                  <div>
                    <div className="grid grid-cols-2 gap-2.5 mb-2.5 max-sm:grid-cols-1">
                      <div>
                        <div className="text-[11px] font-semibold text-[#6B7280] mb-1">기업명</div>
                        <input
                          className="w-full py-[10px] px-[13px] rounded-lg border-[1.5px] border-[#E5E7EB] bg-white text-[13px] text-[#0A0A0A] outline-none transition-[border-color] appearance-none focus:border-[#0991B2] focus:shadow-[0_0_0_3px_rgba(9,145,178,.1)] placeholder:text-[#9CA3AF]"
                          placeholder="예: 카카오뱅크"
                          value={directCompany}
                          onChange={(e) => setDirectField("directCompany", e.target.value)}
                        />
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold text-[#6B7280] mb-1">지원 직무</div>
                        <input
                          className="w-full py-[10px] px-[13px] rounded-lg border-[1.5px] border-[#E5E7EB] bg-white text-[13px] text-[#0A0A0A] outline-none transition-[border-color] appearance-none focus:border-[#0991B2] focus:shadow-[0_0_0_3px_rgba(9,145,178,.1)] placeholder:text-[#9CA3AF]"
                          placeholder="예: 백엔드 개발자"
                          value={directRole}
                          onChange={(e) => setDirectField("directRole", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 max-sm:grid-cols-1">
                      <div>
                        <div className="text-[11px] font-semibold text-[#6B7280] mb-1">면접 단계</div>
                        <select
                          className="w-full py-[10px] px-[13px] rounded-lg border-[1.5px] border-[#E5E7EB] bg-white text-[13px] text-[#0A0A0A] outline-none transition-[border-color] appearance-none focus:border-[#0991B2] focus:shadow-[0_0_0_3px_rgba(9,145,178,.1)] cursor-pointer"
                          value={directStage}
                          onChange={(e) => setDirectField("directStage", e.target.value)}
                        >
                          <option>1차 면접</option>
                          <option>2차 면접</option>
                          <option>임원 면접</option>
                          <option>최종 면접</option>
                        </select>
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold text-[#6B7280] mb-1">채용공고 URL (선택)</div>
                        <input
                          className="w-full py-[10px] px-[13px] rounded-lg border-[1.5px] border-[#E5E7EB] bg-white text-[13px] text-[#0A0A0A] outline-none transition-[border-color] appearance-none focus:border-[#0991B2] focus:shadow-[0_0_0_3px_rgba(9,145,178,.1)] placeholder:text-[#9CA3AF]"
                          placeholder="https://..."
                          value={directUrl}
                          onChange={(e) => setDirectField("directUrl", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab: skip */}
                {jdTab === "skip" && (
                  <div className="p-[18px] bg-[#F9FAFB] rounded-lg border-[1.5px] border-dashed border-[#E5E7EB] text-center">
                    <div style={{ fontSize: 24, marginBottom: 7 }}>🎯</div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>프로필 정보로만 진행</div>
                    <div style={{ fontSize: 12, color: "#6B7280" }}>직군·직업 정보를 기반으로 면접 질문을 생성합니다.</div>
                  </div>
                )}
              </div>

              {/* Section 2: Interview Mode */}
              <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.06)] mb-3.5">
                <span className="text-[10px] font-bold tracking-[.1em] uppercase text-[#0991B2] mb-2.5 block">면접 방식</span>
                <div className="text-[15px] font-extrabold mb-[3px]">어떤 방식으로 진행할까요?</div>
                <div className="text-[13px] text-[#6B7280] mb-3.5 leading-[1.5]">꼬리질문은 한 주제를 심층 탐구, 전체 프로세스는 면접 전 과정을 연습해요.</div>
                <div className="grid grid-cols-2 gap-2.5 max-sm:grid-cols-1">
                  <div
                    className={`rounded-lg p-[18px] border-[1.5px] cursor-pointer transition-all ${
                      interviewMode === "tail"
                        ? "border-[#0991B2] bg-[#E6F7FA]"
                        : "border-[#E5E7EB] bg-[#F9FAFB] hover:border-[#0991B2]"
                    }`}
                    onClick={() => setInterviewMode("tail")}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] font-extrabold">꼬리질문 방식</span>
                      <span className="inline-flex items-center text-[10px] font-bold text-[#059669] bg-[#ECFDF5] py-[3px] px-2.5 rounded-full">Free</span>
                    </div>
                    <p className="text-[12px] text-[#6B7280] leading-[1.5] mb-2.5">답변을 분석해 연이어 꼬리질문을 생성. 심층 역량 검증에 최적화되어 있어요.</p>
                    <div className="flex gap-1 flex-wrap">
                      <span className="text-[10px] font-semibold text-[#0991B2] bg-[rgba(9,145,178,.1)] py-0.5 px-[7px] rounded-full">심층 탐구</span>
                      <span className="text-[10px] font-semibold text-[#0991B2] bg-[rgba(9,145,178,.1)] py-0.5 px-[7px] rounded-full">1~3 꼬리질문</span>
                      <span className="text-[10px] font-semibold text-[#0991B2] bg-[rgba(9,145,178,.1)] py-0.5 px-[7px] rounded-full">실시간 생성</span>
                    </div>
                  </div>
                  <div
                    className="rounded-lg p-[18px] border-[1.5px] border-[#E5E7EB] bg-[#F9FAFB] opacity-45 cursor-not-allowed transition-all"
                    onClick={() => alert("Pro 플랜 업그레이드 후 사용 가능해요!")}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] font-extrabold">전체 프로세스</span>
                      <span className="inline-flex items-center text-[10px] font-bold text-white bg-[#0991B2] py-[3px] px-2.5 rounded-full">Pro</span>
                    </div>
                    <p className="text-[12px] text-[#6B7280] leading-[1.5] mb-2.5">자기소개 → 지원동기 → 직무 질문 → 마무리까지 실제 면접 전 과정을 연습해요.</p>
                    <div className="flex gap-1 flex-wrap mb-1.5">
                      <span className="text-[10px] font-semibold text-[#0991B2] bg-[rgba(9,145,178,.1)] py-0.5 px-[7px] rounded-full">전체 흐름</span>
                      <span className="text-[10px] font-semibold text-[#0991B2] bg-[rgba(9,145,178,.1)] py-0.5 px-[7px] rounded-full">실전 밀착</span>
                    </div>
                    <div className="text-[11px] text-[#6B7280] flex items-center gap-1">🔒 Pro 플랜이 필요해요</div>
                  </div>
                </div>
              </div>

              {/* Section 3: Practice Mode */}
              <div className="bg-white border border-[#E5E7EB] rounded-lg p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.06)]">
                <span className="text-[10px] font-bold tracking-[.1em] uppercase text-[#0991B2] mb-2.5 block">진행 모드</span>
                <div className="text-[15px] font-extrabold mb-[3px]">연습 방식을 선택하세요</div>
                <div className="text-[13px] text-[#6B7280] mb-3.5 leading-[1.5]">실전 모드는 랜덤 대기 후 자동으로 녹화가 시작돼요.</div>
                <div className="grid grid-cols-2 gap-2.5 max-sm:grid-cols-1">
                  <div
                    className={`rounded-lg p-4 border-[1.5px] cursor-pointer transition-all ${
                      practiceMode === "practice"
                        ? "border-[#0991B2] bg-[#E6F7FA]"
                        : "border-[#E5E7EB] bg-[#F9FAFB] hover:border-[#0991B2]"
                    }`}
                    onClick={() => setPracticeMode("practice")}
                  >
                    <span className="text-[20px] mb-[7px] block">🎮</span>
                    <div className="text-[13px] font-extrabold mb-1">연습 모드</div>
                    <div className="text-[12px] text-[#6B7280] leading-[1.45]">준비 완료 버튼을 누르면 답변이 시작돼요. 자신의 페이스대로 연습할 수 있어요.</div>
                  </div>
                  <div
                    className={`rounded-lg p-4 border-[1.5px] cursor-pointer transition-all ${
                      practiceMode === "real"
                        ? "border-[#0991B2] bg-[#E6F7FA]"
                        : "border-[#E5E7EB] bg-[#F9FAFB] hover:border-[#0991B2]"
                    }`}
                    onClick={() => setPracticeMode("real")}
                  >
                    <span className="text-[20px] mb-[7px] block">⚡</span>
                    <div className="text-[13px] font-extrabold mb-1">실전 모드</div>
                    <div className="text-[12px] text-[#6B7280] leading-[1.45]">5~30초 랜덤 대기 후 자동 녹화 시작. 실제 면접에 가장 가까운 긴장감을 경험해요.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: SUMMARY */}
            <div className="sticky top-[calc(60px+24px)] max-lg:static">
              <div className="bg-white border border-[#E5E7EB] rounded-lg p-[22px] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.06)] mb-3">
                <div className="text-sm font-extrabold mb-3.5">면접 설정 요약</div>
                {[
                  { key: "기업", val: summary.company },
                  { key: "직무", val: summary.role },
                  { key: "면접 단계", val: summary.stage },
                  { key: "면접 방식", val: summary.interviewModeLabel },
                  { key: "진행 모드", val: summary.practiceModeLabel },
                ].map((row) => (
                  <div key={row.key} className="flex justify-between items-center py-2 border-b border-[#E5E7EB] last:border-b-0">
                    <span className="text-[12px] text-[#6B7280] font-medium">{row.key}</span>
                    <span className="text-[12px] font-bold text-right max-w-[160px]">{row.val}</span>
                  </div>
                ))}
              </div>

              <div className="bg-[#E6F7FA] border border-[rgba(9,145,178,.15)] rounded-lg p-3 mb-3">
                <div className="text-[11px] font-bold text-[#0991B2] mb-[3px]">💡 이런 질문이 생성돼요</div>
                <div className="text-[11px] text-[#6B7280] leading-[1.5]">백엔드 직군 기반으로 JVM 메모리 구조, 트랜잭션 처리, DB 인덱스 최적화 등 심층 기술 질문이 준비돼요.</div>
              </div>

              <Link
                to="/interview/precheck"
                className="w-full py-3.5 rounded-lg border-none text-sm font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 no-underline bg-[#0A0A0A] text-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.06)] hover:opacity-85 hover:-translate-y-px"
              >
                다음 — 환경 점검 →
              </Link>
              <Link
                to="/home"
                className="w-full py-[11px] rounded-lg border-[1.5px] border-[#E5E7EB] bg-transparent text-[13px] font-semibold text-[#6B7280] cursor-pointer transition-all mt-2 flex items-center justify-center no-underline hover:border-[#0A0A0A] hover:text-[#0A0A0A]"
              >
                ← 홈으로
              </Link>
            </div>
          </div>
        </main>
    </>
  );
}
