/** 새로운 이력서 작성 폼 — 모든 정규화 섹션을 직접 입력해 한 번에 생성한다. */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlignLeft, Award, Briefcase, Clock, Globe,
  GraduationCap, Loader2, Plus, Search, Sparkles, Tag, Trash2,
  Trophy, Upload, User, XCircle, Zap,
} from "lucide-react";
import {
  resumeApi,
  type ParsedData,
  type ParsedExperience,
  type ParsedEducation,
  type ParsedCertification,
  type ParsedAward,
  type ParsedProject,
  type ParsedLanguage,
} from "@/features/resume";

const EMPTY_PARSED: ParsedData = {
  basicInfo: { name: "", email: "", phone: "", location: "" },
  summary: "",
  skills: { technical: [], soft: [], tools: [], languages: [] },
  experiences: [],
  educations: [],
  certifications: [],
  awards: [],
  projects: [],
  languagesSpoken: [],
  totalExperienceYears: null,
  totalExperienceMonths: null,
  industryDomains: [],
  keywords: [],
  jobCategory: null,
};

const JOB_CATEGORY_OPTIONS = [
  "IT/개발", "마케팅", "디자인", "영업", "재무/회계",
  "인사", "기획", "CS", "디지털 마케팅", "기타",
];

const ic = (Icon: React.ComponentType<{ size?: number; className?: string }>, color: string, bg: string) => (
  <div className={`w-6 h-6 rounded-md flex items-center justify-center ${bg}`}>
    <Icon size={13} className={color} />
  </div>
);

const SECTION_ICONS: Record<string, React.ReactNode> = {
  "기본 정보":              ic(User,          "text-[#0991B2]", "bg-[#E6F7FA]"),
  "요약":                   ic(AlignLeft,     "text-[#6B7280]", "bg-[#F3F4F6]"),
  "총 경력":                ic(Clock,         "text-[#D97706]", "bg-[#FFFBEB]"),
  "직군":                   ic(Tag,           "text-[#8B5CF6]", "bg-[#F5F3FF]"),
  "스킬":                   ic(Zap,           "text-[#D97706]", "bg-[#FFFBEB]"),
  "경력":                   ic(Briefcase,     "text-[#0991B2]", "bg-[#E6F7FA]"),
  "학력":                   ic(GraduationCap, "text-[#059669]", "bg-[#ECFDF5]"),
  "자격증":                 ic(Award,         "text-[#0991B2]", "bg-[#E6F7FA]"),
  "수상 이력":              ic(Trophy,        "text-[#D97706]", "bg-[#FFFBEB]"),
  "프로젝트":               ic(Upload,        "text-[#8B5CF6]", "bg-[#F5F3FF]"),
  "구사 언어":              ic(Globe,         "text-[#0991B2]", "bg-[#E6F7FA]"),
  "산업 도메인 / 키워드":   ic(Search,        "text-[#6B7280]", "bg-[#F3F4F6]"),
};

const csvToList = (csv: string): string[] =>
  csv.split(",").map((s) => s.trim()).filter(Boolean);

const intOrNull = (raw: string): number | null => {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : null;
};

export function StructuredFormTab() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [data, setData] = useState<ParsedData>(EMPTY_PARSED);
  const [techCsv, setTechCsv] = useState("");
  const [softCsv, setSoftCsv] = useState("");
  const [toolCsv, setToolCsv] = useState("");
  const [skillLangCsv, setSkillLangCsv] = useState("");
  const [domainsCsv, setDomainsCsv] = useState("");
  const [keywordsCsv, setKeywordsCsv] = useState("");
  const [yearsRaw, setYearsRaw] = useState("");
  const [monthsRaw, setMonthsRaw] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patch = (next: Partial<ParsedData>) => setData((p) => ({ ...p, ...next }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("제목을 입력해주세요.");
      return;
    }
    setError(null);
    setIsSubmitting(true);

    const parsedData: Partial<ParsedData> = {
      ...data,
      skills: {
        technical: csvToList(techCsv),
        soft: csvToList(softCsv),
        tools: csvToList(toolCsv),
        languages: csvToList(skillLangCsv),
      },
      industryDomains: csvToList(domainsCsv),
      keywords: csvToList(keywordsCsv),
      totalExperienceYears: intOrNull(yearsRaw),
      totalExperienceMonths: intOrNull(monthsRaw),
    };

    try {
      const created = await resumeApi.createStructured(title, parsedData);
      navigate(`/resume/${created.uuid}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "생성 실패");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

      {/* 이력서 제목 */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-bold text-[#0A0A0A]">
          이력서 제목 <span className="text-[#DC2626]">*</span>
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 백엔드 시니어 이력서"
          className={inputCls}
        />
      </div>

      {/* 기본 정보 */}
      <Section icon={SECTION_ICONS["기본 정보"]} title="기본 정보">
        <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
          <LabeledInput label="이름" value={data.basicInfo.name ?? ""} onChange={(v) => patch({ basicInfo: { ...data.basicInfo, name: v } })} placeholder="홍길동" />
          <LabeledInput label="이메일" value={data.basicInfo.email ?? ""} onChange={(v) => patch({ basicInfo: { ...data.basicInfo, email: v } })} placeholder="hong@example.com" />
          <LabeledInput label="전화번호" value={data.basicInfo.phone ?? ""} onChange={(v) => patch({ basicInfo: { ...data.basicInfo, phone: v } })} placeholder="010-0000-0000" />
          <LabeledInput label="거주지" value={data.basicInfo.location ?? ""} onChange={(v) => patch({ basicInfo: { ...data.basicInfo, location: v } })} placeholder="서울시 강남구" />
        </div>
      </Section>

      {/* 요약 */}
      <Section icon={SECTION_ICONS["요약"]} title="요약">
        <textarea
          value={data.summary}
          onChange={(e) => patch({ summary: e.target.value })}
          rows={2}
          placeholder="예: 5년차 백엔드 개발자, MSA 와 데이터 파이프라인 설계 전문"
          className={inputCls}
        />
      </Section>

      {/* 총 경력 + 직군 */}
      <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
        <Section icon={SECTION_ICONS["총 경력"]} title="총 경력">
          <div className="flex items-center gap-2">
            <input type="number" min={0} value={yearsRaw} onChange={(e) => setYearsRaw(e.target.value)} placeholder="0" className={`${inputCls} w-20 text-center`} />
            <span className="text-[12px] text-[#6B7280] shrink-0">년</span>
            <input type="number" min={0} max={11} value={monthsRaw} onChange={(e) => setMonthsRaw(e.target.value)} placeholder="0" className={`${inputCls} w-20 text-center`} />
            <span className="text-[12px] text-[#6B7280] shrink-0">개월</span>
          </div>
        </Section>

        <Section icon={SECTION_ICONS["직군"]} title="직군">
          <div className="flex flex-wrap gap-1.5">
            {JOB_CATEGORY_OPTIONS.map((label) => {
              const active = data.jobCategory === label;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => patch({ jobCategory: active ? null : label })}
                  className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold transition-colors ${
                    active
                      ? "bg-[#E6F7FA] border-[#0991B2] text-[#0991B2]"
                      : "bg-white border-[#E5E7EB] text-[#374151] hover:border-[#0991B2] hover:text-[#0991B2]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </Section>
      </div>

      {/* 스킬 */}
      <Section icon={SECTION_ICONS["스킬"]} title="스킬 (콤마로 구분)">
        <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
          <LabeledInput label="기술 스택" value={techCsv} onChange={setTechCsv} placeholder="Python, Django, FastAPI" />
          <LabeledInput label="도구" value={toolCsv} onChange={setToolCsv} placeholder="Docker, Jira, Figma" />
          <LabeledInput label="소프트 스킬" value={softCsv} onChange={setSoftCsv} placeholder="협업, 리더십, 커뮤니케이션" />
          <LabeledInput label="외국어" value={skillLangCsv} onChange={setSkillLangCsv} placeholder="영어, 일본어" />
        </div>
      </Section>

      {/* 경력 */}
      <RepeaterSection
        icon={SECTION_ICONS["경력"]}
        title="경력"
        items={data.experiences}
        empty={{ company: "", role: "", period: "", responsibilities: [], highlights: [] }}
        onChange={(v) => patch({ experiences: v })}
        renderRow={(item, update) => (
          <div className="grid grid-cols-1 gap-2">
            <div className="grid grid-cols-3 gap-2 max-sm:grid-cols-1">
              <LabeledInput label="회사명" value={item.company} onChange={(v) => update({ ...item, company: v })} placeholder="(주)회사명" />
              <LabeledInput label="직함" value={item.role} onChange={(v) => update({ ...item, role: v })} placeholder="백엔드 개발자" />
              <LabeledInput label="기간" value={item.period} onChange={(v) => update({ ...item, period: v })} placeholder="2022.03 ~ 2024.06" />
            </div>
            <LabeledInput label="주요 업무 (한 줄에 하나)" value={(item.responsibilities ?? []).join("\n")} onChange={(v) => update({ ...item, responsibilities: v.split("\n").filter(Boolean) })} placeholder="API 설계 및 개발&#10;DB 쿼리 최적화" textarea rows={2} />
            <LabeledInput label="주요 성과 (한 줄에 하나)" value={(item.highlights ?? []).join("\n")} onChange={(v) => update({ ...item, highlights: v.split("\n").filter(Boolean) })} placeholder="응답속도 40% 개선&#10;MAU 10만 달성" textarea rows={2} />
          </div>
        )}
      />

      {/* 학력 */}
      <RepeaterSection
        icon={SECTION_ICONS["학력"]}
        title="학력"
        items={data.educations}
        empty={{ school: "", degree: "", major: "", period: "" }}
        onChange={(v) => patch({ educations: v })}
        renderRow={(item, update) => (
          <div className="grid grid-cols-2 gap-2 max-sm:grid-cols-1">
            <LabeledInput label="학교명" value={item.school} onChange={(v) => update({ ...item, school: v })} placeholder="한국대학교" />
            <LabeledInput label="학위" value={item.degree} onChange={(v) => update({ ...item, degree: v })} placeholder="학사" />
            <LabeledInput label="전공" value={item.major} onChange={(v) => update({ ...item, major: v })} placeholder="컴퓨터공학" />
            <LabeledInput label="재학 기간" value={item.period} onChange={(v) => update({ ...item, period: v })} placeholder="2018.03 ~ 2022.02" />
          </div>
        )}
      />

      {/* 자격증 */}
      <RepeaterSection
        icon={SECTION_ICONS["자격증"]}
        title="자격증"
        items={data.certifications}
        empty={{ name: "", issuer: "", date: "" }}
        onChange={(v) => patch({ certifications: v })}
        renderRow={(item, update) => (
          <div className="grid grid-cols-3 gap-2 max-sm:grid-cols-1">
            <LabeledInput label="자격증명" value={item.name} onChange={(v) => update({ ...item, name: v })} placeholder="정보처리기사" />
            <LabeledInput label="발급기관" value={item.issuer} onChange={(v) => update({ ...item, issuer: v })} placeholder="한국산업인력공단" />
            <LabeledInput label="취득일" value={item.date} onChange={(v) => update({ ...item, date: v })} placeholder="2022.05" />
          </div>
        )}
      />

      {/* 수상 이력 */}
      <RepeaterSection
        icon={SECTION_ICONS["수상 이력"]}
        title="수상 이력"
        items={data.awards}
        empty={{ name: "", year: "", organization: "", description: "" }}
        onChange={(v) => patch({ awards: v })}
        renderRow={(item, update) => (
          <div className="grid grid-cols-1 gap-2">
            <div className="grid grid-cols-3 gap-2 max-sm:grid-cols-1">
              <LabeledInput label="수상명" value={item.name} onChange={(v) => update({ ...item, name: v })} placeholder="우수상" />
              <LabeledInput label="주최" value={item.organization} onChange={(v) => update({ ...item, organization: v })} placeholder="과학기술정보통신부" />
              <LabeledInput label="연도" value={item.year} onChange={(v) => update({ ...item, year: v })} placeholder="2023" />
            </div>
            <LabeledInput label="상세 설명" value={item.description} onChange={(v) => update({ ...item, description: v })} placeholder="해커톤 최우수상 수상" textarea rows={2} />
          </div>
        )}
      />

      {/* 프로젝트 */}
      <RepeaterSection
        icon={SECTION_ICONS["프로젝트"]}
        title="프로젝트"
        items={data.projects}
        empty={{ name: "", role: "", period: "", description: "", techStack: [] }}
        onChange={(v) => patch({ projects: v })}
        renderRow={(item, update) => (
          <div className="grid grid-cols-1 gap-2">
            <div className="grid grid-cols-3 gap-2 max-sm:grid-cols-1">
              <LabeledInput label="프로젝트명" value={item.name} onChange={(v) => update({ ...item, name: v })} placeholder="meFit 서비스" />
              <LabeledInput label="역할" value={item.role} onChange={(v) => update({ ...item, role: v })} placeholder="백엔드 리드" />
              <LabeledInput label="기간" value={item.period} onChange={(v) => update({ ...item, period: v })} placeholder="2023.01 ~ 2023.06" />
            </div>
            <LabeledInput label="개요 / 기여" value={item.description} onChange={(v) => update({ ...item, description: v })} placeholder="AI 면접 서비스 백엔드 설계 및 개발" textarea rows={2} />
            <LabeledInput label="기술 스택 (콤마 구분)" value={(item.techStack ?? []).join(", ")} onChange={(v) => update({ ...item, techStack: csvToList(v) })} placeholder="FastAPI, PostgreSQL, Redis" />
          </div>
        )}
      />

      {/* 구사 언어 */}
      <RepeaterSection
        icon={SECTION_ICONS["구사 언어"]}
        title="구사 언어"
        items={data.languagesSpoken}
        empty={{ language: "", level: "" }}
        onChange={(v) => patch({ languagesSpoken: v })}
        renderRow={(item, update) => (
          <div className="grid grid-cols-2 gap-2 max-sm:grid-cols-1">
            <LabeledInput label="언어" value={item.language} onChange={(v) => update({ ...item, language: v })} placeholder="영어" />
            <LabeledInput label="수준" value={item.level} onChange={(v) => update({ ...item, level: v })} placeholder="비즈니스 레벨" />
          </div>
        )}
      />

      {/* 산업 도메인 / 키워드 */}
      <Section icon={SECTION_ICONS["산업 도메인 / 키워드"]} title="산업 도메인 / 키워드 (콤마 구분)">
        <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
          <LabeledInput label="산업 도메인" value={domainsCsv} onChange={setDomainsCsv} placeholder="핀테크, 이커머스" />
          <LabeledInput label="키워드" value={keywordsCsv} onChange={setKeywordsCsv} placeholder="microservices, pgvector" />
        </div>
      </Section>

      {/* 에러 */}
      {error && (
        <div className="flex items-center gap-2 text-[12px] font-semibold text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-3.5 py-2.5">
          <XCircle size={14} className="shrink-0" /> {error}
        </div>
      )}

      {/* 제출 버튼 */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center gap-2 text-sm font-bold text-white bg-[#0A0A0A] rounded-lg py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-opacity hover:opacity-85 disabled:opacity-50"
      >
        {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
        {isSubmitting ? "생성 중..." : "이력서 생성하기"}
      </button>
    </form>
  );
}

/* ── 공통 스타일 ── */
const inputCls =
  "w-full border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-[13px] outline-none transition-[border-color,box-shadow] focus:border-[#0991B2] focus:shadow-[0_0_0_3px_rgba(9,145,178,0.1)] placeholder:text-[#9CA3AF] bg-white resize-none";

/* ── Section 카드 ── */
function Section({
  icon,
  title,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-[#E5E7EB] rounded-xl bg-[#FAFAFA] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#E5E7EB] bg-white">
        {icon}
        <span className="text-[12px] font-extrabold text-[#0A0A0A]">{title}</span>
      </div>
      <div className="p-4 flex flex-col gap-3">{children}</div>
    </div>
  );
}

/* ── LabeledInput ── */
function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  textarea,
  rows,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  textarea?: boolean;
  rows?: number;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-bold text-[#6B7280]">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows ?? 2}
          className={inputCls}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputCls}
        />
      )}
    </label>
  );
}

/* ── RepeaterSection ── */
type RepeatableItem =
  | ParsedExperience
  | ParsedEducation
  | ParsedCertification
  | ParsedAward
  | ParsedProject
  | ParsedLanguage;

function RepeaterSection<T extends RepeatableItem>({
  icon,
  title,
  items,
  empty,
  onChange,
  renderRow,
}: {
  icon?: React.ReactNode;
  title: string;
  items: T[];
  empty: T;
  onChange: (next: T[]) => void;
  renderRow: (item: T, update: (next: T) => void) => React.ReactNode;
}) {
  const update = (idx: number, next: T) => {
    const copy = [...items];
    copy[idx] = next;
    onChange(copy);
  };
  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));
  const add = () => onChange([...items, { ...empty }]);

  return (
    <div className="border border-[#E5E7EB] rounded-xl bg-[#FAFAFA] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB] bg-white">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-[12px] font-extrabold text-[#0A0A0A]">{title}</span>
          {items.length > 0 && (
            <span className="text-[10px] font-bold text-[#0991B2] bg-[#E6F7FA] px-2 py-0.5 rounded-full">
              {items.length}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0991B2] bg-[#E6F7FA] hover:bg-[#cceef6] px-2.5 py-1 rounded-lg transition-colors"
        >
          <Plus size={11} /> 추가
        </button>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {items.length === 0 ? (
          <p className="text-[11px] text-[#9CA3AF] text-center py-3">
            아직 항목이 없어요. "추가" 를 눌러 시작하세요.
          </p>
        ) : (
          items.map((item, i) => (
            <div key={i} className="relative bg-white border border-[#E5E7EB] rounded-lg p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-2.5 right-2.5 w-6 h-6 flex items-center justify-center rounded-md text-[#9CA3AF] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
                aria-label="삭제"
              >
                <Trash2 size={13} />
              </button>
              <div className="pr-7">
                {renderRow(item, (next) => update(i, next))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
