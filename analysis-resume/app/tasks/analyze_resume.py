"""LLM 을 활용한 이력서 분석 task.

책임:
- 청킹된 이력서 텍스트를 병렬 LLM 분석
- 분석 결과(ParsedResumeData) 및 토큰 사용량을 chord 하위 task 결과로 반환
- DB 는 건드리지 않으며, 진행 단계 / 실패 표시는 backend Celery 태스크에 send_task 로 전달
"""

from concurrent.futures import ThreadPoolExecutor, as_completed

from app import config
from app.celery_app import app
from app.common import analyze_text_with_llm, chunk_text_for_llm
from app.schemas.parsed_data import ParsedResumeData
from app.utils.logger import get_logger

logger = get_logger(__name__)

_MAX_PARALLEL_CHUNKS = 4


def _merge_results(results: list[dict]) -> dict:
  """청크별 분석 결과 dict 를 하나로 합산한다."""
  # basic_info: 필드별 첫 번째 비어있지 않은 값 사용
  basic_info: dict = {"name": None, "email": None, "phone": None, "location": None}
  for r in results:
    bi = r.get("basic_info") or {}
    for field in ("name", "email", "phone", "location"):
      if basic_info[field] is None and bi.get(field):
        basic_info[field] = bi[field]

  seen_tech: set[str] = set()
  seen_soft: set[str] = set()
  seen_tools: set[str] = set()
  seen_skill_langs: set[str] = set()
  skills_technical: list[str] = []
  skills_soft: list[str] = []
  skills_tools: list[str] = []
  skills_languages: list[str] = []

  seen_keywords: set[str] = set()
  seen_domains: set[str] = set()
  seen_schools: set[str] = set()
  seen_cert_names: set[str] = set()
  seen_award_names: set[str] = set()
  seen_exp_keys: set[str] = set()
  seen_proj_names: set[str] = set()
  seen_lang_names: set[str] = set()

  keywords: list[str] = []
  industry_domains: list[str] = []
  educations: list[dict] = []
  certifications: list[dict] = []
  awards: list[dict] = []
  experiences: list[dict] = []
  projects: list[dict] = []
  languages_spoken: list[dict] = []
  summaries: list[str] = []
  # (years, months) 후보 — 가장 큰 총 개월수를 선택
  experience_durations: list[tuple[int, int]] = []
  job_category: str | None = None

  for r in results:
    sk = r.get("skills") or {}
    if isinstance(sk, dict):
      for s in sk.get("technical") or []:
        if s and s not in seen_tech:
          seen_tech.add(s); skills_technical.append(s)
      for s in sk.get("soft") or []:
        if s and s not in seen_soft:
          seen_soft.add(s); skills_soft.append(s)
      for s in sk.get("tools") or []:
        if s and s not in seen_tools:
          seen_tools.add(s); skills_tools.append(s)
      for s in sk.get("languages") or []:
        if s and s not in seen_skill_langs:
          seen_skill_langs.add(s); skills_languages.append(s)

    for k in r.get("keywords") or []:
      if k and k not in seen_keywords:
        seen_keywords.add(k); keywords.append(k)
    for d in r.get("industry_domains") or []:
      if d and d not in seen_domains:
        seen_domains.add(d); industry_domains.append(d)

    if summary := (r.get("summary") or "").strip():
      summaries.append(summary)
    years_raw = r.get("total_experience_years")
    months_raw = r.get("total_experience_months")
    if years_raw is not None or months_raw is not None:
      try:
        y = int(years_raw) if years_raw is not None else 0
        m = int(months_raw) if months_raw is not None else 0
        if y > 0 or m > 0:
          experience_durations.append((y, m))
      except (TypeError, ValueError):
        pass
    if job_category is None and r.get("job_category"):
      job_category = r["job_category"]

    for edu in r.get("educations", []) or []:
      school = (edu.get("school") or "") if isinstance(edu, dict) else ""
      if school and school not in seen_schools:
        seen_schools.add(school); educations.append(edu)
    for cert in r.get("certifications", []) or []:
      if isinstance(cert, dict):
        name = cert.get("name") or ""
      else:
        name = str(cert) if cert else ""
      if name and name not in seen_cert_names:
        seen_cert_names.add(name)
        certifications.append(cert if isinstance(cert, dict) else {"name": name, "issuer": "", "date": ""})
    for award in r.get("awards", []) or []:
      if not isinstance(award, dict):
        continue
      a_name = award.get("name") or ""
      if a_name and a_name not in seen_award_names:
        seen_award_names.add(a_name); awards.append(award)
    for exp in r.get("experiences", []) or []:
      if not isinstance(exp, dict):
        continue
      company = exp.get("company") or ""
      role = exp.get("role") or ""
      key = f"{company}|{role}".strip("|")
      if key and key not in seen_exp_keys:
        seen_exp_keys.add(key); experiences.append(exp)
    for proj in r.get("projects", []) or []:
      if not isinstance(proj, dict):
        continue
      proj_name = proj.get("name") or ""
      if proj_name and proj_name not in seen_proj_names:
        seen_proj_names.add(proj_name); projects.append(proj)
    for lang in r.get("languages_spoken", []) or []:
      if not isinstance(lang, dict):
        continue
      lang_name = lang.get("language") or ""
      if lang_name and lang_name not in seen_lang_names:
        seen_lang_names.add(lang_name); languages_spoken.append(lang)

  return {
    "basic_info": basic_info,
    "summary": " ".join(summaries),
    "skills": {
      "technical": skills_technical,
      "soft": skills_soft,
      "tools": skills_tools,
      "languages": skills_languages,
    },
    "experiences": experiences,
    "educations": educations,
    "certifications": certifications,
    "awards": awards,
    "projects": projects,
    "languages_spoken": languages_spoken,
    "total_experience_years": (
      max(experience_durations, key=lambda d: d[0] * 12 + d[1])[0] if experience_durations else None
    ),
    "total_experience_months": (
      max(experience_durations, key=lambda d: d[0] * 12 + d[1])[1] if experience_durations else None
    ),
    "industry_domains": industry_domains,
    "keywords": keywords,
    "job_category": job_category,
  }


def extract_resume_info(text: str) -> tuple[dict, int, int]:
  """이력서 전체 텍스트를 청킹 후 병렬 LLM 분석해 병합 dict 로 반환한다."""
  llm_chunks = chunk_text_for_llm(text)
  all_results: list[tuple[int, dict]] = []
  total_prompt_tokens = 0
  total_tokens = 0

  workers = min(len(llm_chunks), _MAX_PARALLEL_CHUNKS)
  with ThreadPoolExecutor(max_workers=workers) as executor:
    future_to_idx = {
      executor.submit(analyze_text_with_llm, chunk): i
      for i, chunk in enumerate(llm_chunks)
    }
    for future in as_completed(future_to_idx):
      idx = future_to_idx[future]
      parsed, prompt_tokens, tokens = future.result()
      # parsed 는 ParsedResumeData 인스턴스 → merge 는 dict 기반이므로 변환
      parsed_dict = parsed.model_dump() if isinstance(parsed, ParsedResumeData) else (parsed or {})
      all_results.append((idx, parsed_dict))
      total_prompt_tokens += prompt_tokens
      total_tokens += tokens

  ordered = [p for _, p in sorted(all_results, key=lambda x: x[0])]
  merged = _merge_results(ordered)
  # 최종 스키마 검증 (backend 로 넘기기 전 normalize)
  merged = ParsedResumeData.from_raw(merged).model_dump()
  return merged, total_prompt_tokens, total_tokens


@app.task(bind=True, name="analysis_resume.tasks.analyze_resume", max_retries=2, default_retry_delay=60)
def analyze_resume_task(self, payload: dict) -> dict:
  """이력서 텍스트를 LLM 으로 분석한다. DB 쓰기 없음 — 결과는 chord 에 반환."""
  resume_uuid: str = payload["resume_uuid"]
  user_id: int = payload["user_id"]
  text: str = payload["text"]

  logger.info("LLM 분석 시작", resume_uuid=resume_uuid, text_len=len(text))

  # backend 에 진행 단계 push (DB 를 직접 만지지 않고 Celery 로 위임)
  app.send_task(
    "resumes.tasks.update_resume_step",
    queue="celery",
    kwargs={"resume_uuid": resume_uuid, "step": "analyzing"},
  )

  try:
    parsed_dict, prompt_tokens, total_tokens = extract_resume_info(text)
    logger.info("LLM 분석 완료", resume_uuid=resume_uuid, total_tokens=total_tokens)
    return {
      "type": "analyze",
      "resume_uuid": resume_uuid,
      "user_id": user_id,
      "parsed_data": parsed_dict,
      "token_usage": {
        "operation_type": "analyze",
        "model_name": config.OPENAI_LLM_MODEL,
        "prompt_tokens": prompt_tokens,
        "total_tokens": total_tokens,
      },
    }
  except Exception as exc:
    logger.error("LLM 분석 실패", resume_uuid=resume_uuid, error=str(exc), exc_info=True)
    app.send_task(
      "resumes.tasks.mark_resume_failed",
      queue="celery",
      kwargs={"resume_uuid": resume_uuid, "error": str(exc)},
    )
    raise self.retry(exc=exc)
