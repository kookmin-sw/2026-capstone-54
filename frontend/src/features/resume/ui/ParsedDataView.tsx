/** 정규화된 parsed_data를 섹션별로 렌더하는 분석 결과 뷰어. */
import type { ParsedData } from "../api/types";

interface ParsedDataViewProps {
  data: ParsedData | null;
}

const CAREER_LEVEL_LABEL: Record<string, string> = {
  junior: "주니어",
  mid: "미드 레벨",
  senior: "시니어",
  lead: "리드",
  executive: "임원",
};

export function ParsedDataView({ data }: ParsedDataViewProps) {
  if (!data) {
    return <div className="text-[13px] text-[#9CA3AF] italic">분석 결과가 아직 없어요.</div>;
  }

  const allSkills = [
    ...(data.skills?.technical ?? []),
    ...(data.skills?.tools ?? []),
    ...(data.skills?.languages ?? []),
    ...(data.skills?.soft ?? []),
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* 요약 */}
      {data.summary && (
        <Section title="요약">
          <p className="text-[13px] text-[#374151] leading-[1.6]">{data.summary}</p>
        </Section>
      )}

      {/* 메타 정보 */}
      {(data.careerLevel || data.totalExperienceYears != null || data.jobCategory) && (
        <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-1">
          {data.jobCategory && <MetaCard label="직군" value={data.jobCategory} />}
          {data.careerLevel && (
            <MetaCard label="경력 레벨" value={CAREER_LEVEL_LABEL[data.careerLevel] ?? data.careerLevel} />
          )}
          {data.totalExperienceYears != null && (
            <MetaCard label="총 경력" value={`${data.totalExperienceYears}년`} />
          )}
        </div>
      )}

      {/* 스킬 */}
      {allSkills.length > 0 && (
        <Section title="스킬">
          <div className="flex flex-wrap gap-1.5">
            {allSkills.map((skill, i) => (
              <span key={`${skill}-${i}`} className="text-[11px] font-semibold text-[#0991B2] bg-[#E6F7FA] border border-[rgba(9,145,178,.2)] rounded-full px-2 py-0.5">
                {skill}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* 경력 */}
      {data.experiences && data.experiences.length > 0 && (
        <Section title="경력">
          <ul className="flex flex-col gap-3">
            {data.experiences.map((exp, i) => (
              <li key={i} className="border-l-2 border-[#0991B2] pl-3">
                <div className="text-[13px] font-bold text-[#0A0A0A]">{exp.company}</div>
                <div className="text-[12px] text-[#6B7280]">{exp.role} · {exp.period}</div>
                {exp.highlights && exp.highlights.length > 0 && (
                  <ul className="mt-1.5 flex flex-col gap-1">
                    {exp.highlights.map((h, j) => (
                      <li key={j} className="text-[12px] text-[#374151]">• {h}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 프로젝트 */}
      {data.projects && data.projects.length > 0 && (
        <Section title="프로젝트">
          <ul className="flex flex-col gap-3">
            {data.projects.map((proj, i) => (
              <li key={i}>
                <div className="text-[13px] font-bold text-[#0A0A0A]">{proj.name}</div>
                <div className="text-[12px] text-[#6B7280]">{proj.role} · {proj.period}</div>
                {proj.description && (
                  <p className="mt-1 text-[12px] text-[#374151] leading-[1.5]">{proj.description}</p>
                )}
                {proj.techStack && proj.techStack.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {proj.techStack.map((t, j) => (
                      <span key={j} className="text-[10px] font-semibold text-[#6B7280] bg-[#F9FAFB] border border-[#E5E7EB] rounded px-1.5 py-px">{t}</span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 학력 */}
      {data.educations && data.educations.length > 0 && (
        <Section title="학력">
          <ul className="flex flex-col gap-2">
            {data.educations.map((edu, i) => (
              <li key={i} className="text-[12px] text-[#374151]">
                <strong className="text-[#0A0A0A]">{edu.school}</strong>
                {edu.major && <> · {edu.major}</>}
                {edu.degree && <> · {edu.degree}</>}
                {edu.period && <> · {edu.period}</>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 자격증 */}
      {data.certifications && data.certifications.length > 0 && (
        <Section title="자격증">
          <ul className="flex flex-col gap-1">
            {data.certifications.map((cert, i) => (
              <li key={i} className="text-[12px] text-[#374151]">
                <strong className="text-[#0A0A0A]">{cert.name}</strong>
                {cert.issuer && <> · {cert.issuer}</>}
                {cert.date && <> · {cert.date}</>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 언어 */}
      {data.languagesSpoken && data.languagesSpoken.length > 0 && (
        <Section title="언어">
          <div className="flex flex-wrap gap-2">
            {data.languagesSpoken.map((l, i) => (
              <span key={i} className="text-[11px] font-semibold text-[#374151] bg-[#F9FAFB] border border-[#E5E7EB] rounded-full px-2 py-0.5">
                {l.language} · {l.level}
              </span>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] font-bold tracking-[.08em] uppercase text-[#6B7280] mb-2">{title}</h3>
      {children}
    </div>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-3">
      <div className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wide">{label}</div>
      <div className="text-[13px] font-bold text-[#0A0A0A] mt-0.5">{value}</div>
    </div>
  );
}
