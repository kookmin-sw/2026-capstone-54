/** 새로운 이력서 작성 폼 — 모든 정규화 섹션을 직접 입력해 한 번에 생성한다. */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Loader2, Plus, Trash2 } from "lucide-react";
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field label="이력서 제목">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 백엔드 시니어 이력서"
          className={inputCls}
        />
      </Field>

      <Section title="기본 정보">
        <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
          <input
            value={data.basicInfo.name ?? ""}
            onChange={(e) => patch({ basicInfo: { ...data.basicInfo, name: e.target.value } })}
            placeholder="이름"
            className={inputCls}
          />
          <input
            value={data.basicInfo.email ?? ""}
            onChange={(e) => patch({ basicInfo: { ...data.basicInfo, email: e.target.value } })}
            placeholder="이메일"
            className={inputCls}
          />
          <input
            value={data.basicInfo.phone ?? ""}
            onChange={(e) => patch({ basicInfo: { ...data.basicInfo, phone: e.target.value } })}
            placeholder="전화번호"
            className={inputCls}
          />
          <input
            value={data.basicInfo.location ?? ""}
            onChange={(e) =>
              patch({ basicInfo: { ...data.basicInfo, location: e.target.value } })
            }
            placeholder="거주지"
            className={inputCls}
          />
        </div>
      </Section>

      <Section title="요약">
        <textarea
          value={data.summary}
          onChange={(e) => patch({ summary: e.target.value })}
          rows={2}
          placeholder="예: 5년차 백엔드 개발자, MSA 와 데이터 파이프라인 설계 전문"
          className={inputCls}
        />
      </Section>

      <Section title="총 경력">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            value={yearsRaw}
            onChange={(e) => setYearsRaw(e.target.value)}
            placeholder="년"
            className={`${inputCls} w-20`}
          />
          <span className="text-[12px] text-[#6B7280]">년</span>
          <input
            type="number"
            min={0}
            max={11}
            value={monthsRaw}
            onChange={(e) => setMonthsRaw(e.target.value)}
            placeholder="개월"
            className={`${inputCls} w-20`}
          />
          <span className="text-[12px] text-[#6B7280]">개월</span>
        </div>
      </Section>

      <Section title="직군">
        <input
          value={data.jobCategory ?? ""}
          onChange={(e) => patch({ jobCategory: e.target.value || null })}
          placeholder="예: IT/개발, 마케팅, 디자인 …"
          className={inputCls}
        />
      </Section>

      <Section title="스킬 (콤마 구분)">
        <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
          <LabeledInput label="기술" value={techCsv} onChange={setTechCsv} placeholder="Python, Django" />
          <LabeledInput label="도구" value={toolCsv} onChange={setToolCsv} placeholder="Docker, Jira" />
          <LabeledInput label="소프트" value={softCsv} onChange={setSoftCsv} placeholder="협업, 리더십" />
          <LabeledInput label="외국어" value={skillLangCsv} onChange={setSkillLangCsv} placeholder="영어, 일본어" />
        </div>
      </Section>

      <RepeaterSection
        title="경력"
        items={data.experiences}
        empty={{ company: "", role: "", period: "", responsibilities: [], highlights: [] }}
        onChange={(v) => patch({ experiences: v })}
        renderRow={(item, update) => (
          <div className="grid grid-cols-1 gap-2">
            <div className="grid grid-cols-3 gap-2 max-sm:grid-cols-1">
              <input value={item.company} onChange={(e) => update({ ...item, company: e.target.value })} placeholder="회사명" className={inputCls} />
              <input value={item.role} onChange={(e) => update({ ...item, role: e.target.value })} placeholder="직함" className={inputCls} />
              <input value={item.period} onChange={(e) => update({ ...item, period: e.target.value })} placeholder="기간" className={inputCls} />
            </div>
            <textarea
              value={(item.responsibilities ?? []).join("\n")}
              onChange={(e) => update({ ...item, responsibilities: e.target.value.split("\n").filter(Boolean) })}
              rows={2}
              placeholder="주요 업무 (한 줄에 하나)"
              className={inputCls}
            />
            <textarea
              value={(item.highlights ?? []).join("\n")}
              onChange={(e) => update({ ...item, highlights: e.target.value.split("\n").filter(Boolean) })}
              rows={2}
              placeholder="주요 성과 (한 줄에 하나)"
              className={inputCls}
            />
          </div>
        )}
      />

      <RepeaterSection
        title="학력"
        items={data.educations}
        empty={{ school: "", degree: "", major: "", period: "" }}
        onChange={(v) => patch({ educations: v })}
        renderRow={(item, update) => (
          <div className="grid grid-cols-2 gap-2 max-sm:grid-cols-1">
            <input value={item.school} onChange={(e) => update({ ...item, school: e.target.value })} placeholder="학교명" className={inputCls} />
            <input value={item.degree} onChange={(e) => update({ ...item, degree: e.target.value })} placeholder="학위" className={inputCls} />
            <input value={item.major} onChange={(e) => update({ ...item, major: e.target.value })} placeholder="전공" className={inputCls} />
            <input value={item.period} onChange={(e) => update({ ...item, period: e.target.value })} placeholder="재학 기간" className={inputCls} />
          </div>
        )}
      />

      <RepeaterSection
        title="자격증"
        items={data.certifications}
        empty={{ name: "", issuer: "", date: "" }}
        onChange={(v) => patch({ certifications: v })}
        renderRow={(item, update) => (
          <div className="grid grid-cols-3 gap-2 max-sm:grid-cols-1">
            <input value={item.name} onChange={(e) => update({ ...item, name: e.target.value })} placeholder="자격증명" className={inputCls} />
            <input value={item.issuer} onChange={(e) => update({ ...item, issuer: e.target.value })} placeholder="발급기관" className={inputCls} />
            <input value={item.date} onChange={(e) => update({ ...item, date: e.target.value })} placeholder="취득일" className={inputCls} />
          </div>
        )}
      />

      <RepeaterSection
        title="수상 이력"
        items={data.awards}
        empty={{ name: "", year: "", organization: "", description: "" }}
        onChange={(v) => patch({ awards: v })}
        renderRow={(item, update) => (
          <div className="grid grid-cols-1 gap-2">
            <div className="grid grid-cols-3 gap-2 max-sm:grid-cols-1">
              <input value={item.name} onChange={(e) => update({ ...item, name: e.target.value })} placeholder="수상 이름" className={inputCls} />
              <input value={item.organization} onChange={(e) => update({ ...item, organization: e.target.value })} placeholder="주최" className={inputCls} />
              <input value={item.year} onChange={(e) => update({ ...item, year: e.target.value })} placeholder="연도" className={inputCls} />
            </div>
            <textarea value={item.description} onChange={(e) => update({ ...item, description: e.target.value })} rows={2} placeholder="상세 설명" className={inputCls} />
          </div>
        )}
      />

      <RepeaterSection
        title="프로젝트"
        items={data.projects}
        empty={{ name: "", role: "", period: "", description: "", techStack: [] }}
        onChange={(v) => patch({ projects: v })}
        renderRow={(item, update) => (
          <div className="grid grid-cols-1 gap-2">
            <div className="grid grid-cols-3 gap-2 max-sm:grid-cols-1">
              <input value={item.name} onChange={(e) => update({ ...item, name: e.target.value })} placeholder="프로젝트명" className={inputCls} />
              <input value={item.role} onChange={(e) => update({ ...item, role: e.target.value })} placeholder="역할" className={inputCls} />
              <input value={item.period} onChange={(e) => update({ ...item, period: e.target.value })} placeholder="기간" className={inputCls} />
            </div>
            <textarea value={item.description} onChange={(e) => update({ ...item, description: e.target.value })} rows={2} placeholder="개요/기여" className={inputCls} />
            <input
              value={(item.techStack ?? []).join(", ")}
              onChange={(e) => update({ ...item, techStack: csvToList(e.target.value) })}
              placeholder="기술 스택 (콤마 구분)"
              className={inputCls}
            />
          </div>
        )}
      />

      <RepeaterSection
        title="구사 언어"
        items={data.languagesSpoken}
        empty={{ language: "", level: "" }}
        onChange={(v) => patch({ languagesSpoken: v })}
        renderRow={(item, update) => (
          <div className="grid grid-cols-2 gap-2 max-sm:grid-cols-1">
            <input value={item.language} onChange={(e) => update({ ...item, language: e.target.value })} placeholder="언어" className={inputCls} />
            <input value={item.level} onChange={(e) => update({ ...item, level: e.target.value })} placeholder="수준" className={inputCls} />
          </div>
        )}
      />

      <Section title="산업 도메인 / 키워드 (콤마 구분)">
        <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
          <LabeledInput label="산업 도메인" value={domainsCsv} onChange={setDomainsCsv} placeholder="핀테크, 이커머스" />
          <LabeledInput label="키워드" value={keywordsCsv} onChange={setKeywordsCsv} placeholder="microservices, pgvector" />
        </div>
      </Section>

      {error && <div className="text-[12px] text-[#DC2626]">{error}</div>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center gap-2 text-[13px] font-bold text-white bg-[#0991B2] rounded-lg py-3 disabled:opacity-50"
      >
        {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
        이력서 생성
      </button>
    </form>
  );
}

const inputCls = "border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-[#0991B2] transition-colors";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-bold text-[#0A0A0A]">{label}</span>
      {children}
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border border-[#E5E7EB] rounded-lg p-4 flex flex-col gap-3">
      <legend className="text-[11px] font-bold text-[#6B7280] px-2">{title}</legend>
      {children}
    </fieldset>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-bold text-[#6B7280]">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputCls}
      />
    </label>
  );
}

type RepeatableItem =
  | ParsedExperience
  | ParsedEducation
  | ParsedCertification
  | ParsedAward
  | ParsedProject
  | ParsedLanguage;

function RepeaterSection<T extends RepeatableItem>({
  title,
  items,
  empty,
  onChange,
  renderRow,
}: {
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
    <fieldset className="border border-[#E5E7EB] rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <legend className="text-[11px] font-bold text-[#6B7280] px-2">{title}</legend>
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0991B2]"
        >
          <Plus size={12} /> 추가
        </button>
      </div>
      {items.length === 0 && (
        <p className="text-[11px] text-[#9CA3AF]">아직 항목이 없어요. "추가" 를 눌러 시작하세요.</p>
      )}
      {items.map((item, i) => (
        <div key={i} className="bg-[#F9FAFB] rounded p-3 relative">
          {renderRow(item, (next) => update(i, next))}
          <button
            type="button"
            onClick={() => remove(i)}
            className="absolute top-2 right-2 text-[#DC2626]"
            aria-label="삭제"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </fieldset>
  );
}
