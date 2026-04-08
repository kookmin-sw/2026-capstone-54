"""LLM을 활용한 이력서 분석 task."""

from concurrent.futures import ThreadPoolExecutor, as_completed

from app import config, db
from app.celery_app import app
from app.common import analyze_text_with_llm, chunk_text_for_llm
from app.utils.logger import get_logger

logger = get_logger(__name__)

_MAX_PARALLEL_CHUNKS = 4


def _merge_results(results: list[dict]) -> dict:
  """청크별 분석 결과를 하나로 합산합니다."""
  _LEVEL_ORDER = {"executive": 5, "lead": 4, "senior": 3, "mid": 2, "junior": 1}

  seen_skills: set[str] = set()
  seen_keywords: set[str] = set()
  seen_titles: set[str] = set()
  seen_certs: set[str] = set()
  seen_domains: set[str] = set()
  seen_schools: set[str] = set()
  seen_langs: set[str] = set()
  seen_projects: set[str] = set()

  skills: list[str] = []
  keywords: list[str] = []
  job_titles: list[str] = []
  certifications: list[str] = []
  industry_domains: list[str] = []
  educations: list[dict] = []
  languages: list[dict] = []
  projects: list[dict] = []
  summaries: list[str] = []
  experience_years: list[float] = []
  career_level_score = 0
  career_level_value: str | None = None

  for r in results:
    for s in r.get("skills", []):
      if s and s not in seen_skills:
        seen_skills.add(s); skills.append(s)
    for k in r.get("keywords", []):
      if k and k not in seen_keywords:
        seen_keywords.add(k); keywords.append(k)
    for t in r.get("job_titles", []):
      if t and t not in seen_titles:
        seen_titles.add(t); job_titles.append(t)
    for c in r.get("certifications", []):
      if c and c not in seen_certs:
        seen_certs.add(c); certifications.append(c)
    for d in r.get("industry_domains", []):
      if d and d not in seen_domains:
        seen_domains.add(d); industry_domains.append(d)
    if summary := r.get("career_summary", "").strip():
      summaries.append(summary)
    if (years := r.get("total_experience_years")) is not None:
      try:
        experience_years.append(float(years))
      except (TypeError, ValueError):
        pass
    if level := r.get("career_level"):
      score = _LEVEL_ORDER.get(str(level).lower(), 0)
      if score > career_level_score:
        career_level_score = score
        career_level_value = str(level).lower()
    for edu in r.get("educations", []):
      school = edu.get("school", "")
      if school and school not in seen_schools:
        seen_schools.add(school); educations.append(edu)
    for lang in r.get("languages", []):
      lang_name = lang.get("language", "")
      if lang_name and lang_name not in seen_langs:
        seen_langs.add(lang_name); languages.append(lang)
    for proj in r.get("projects", []):
      proj_name = proj.get("name", "")
      if proj_name and proj_name not in seen_projects:
        seen_projects.add(proj_name); projects.append(proj)

  return {
    "skills": skills, "keywords": keywords, "job_titles": job_titles,
    "career_summary": " ".join(summaries),
    "total_experience_years": max(experience_years) if experience_years else None,
    "career_level": career_level_value, "industry_domains": industry_domains,
    "educations": educations, "certifications": certifications,
    "languages": languages, "projects": projects,
  }


def extract_resume_info(text: str) -> tuple[dict, int, int]:
  """이력서 전체 텍스트를 청킹 후 병렬 LLM 분석합니다."""
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
      all_results.append((idx, parsed))
      total_prompt_tokens += prompt_tokens
      total_tokens += tokens

  ordered = [p for _, p in sorted(all_results, key=lambda x: x[0])]
  return _merge_results(ordered), total_prompt_tokens, total_tokens


@app.task(bind=True, name="store_resume.tasks.analyze_resume", max_retries=2, default_retry_delay=60)
def analyze_resume_task(self, payload: dict) -> dict:
  """이력서 텍스트를 LLM으로 분석합니다."""
  resume_uuid: str = payload["resume_uuid"]
  user_id: int = payload["user_id"]
  text: str = payload["text"]

  logger.info("LLM 분석 시작", resume_uuid=resume_uuid, text_len=len(text))

  try:
    db.update_resume_step(resume_uuid=resume_uuid, step="analyzing")
    parsed, prompt_tokens, total_tokens = extract_resume_info(text)
    logger.info("LLM 분석 완료", resume_uuid=resume_uuid, total_tokens=total_tokens)
    db.record_token_usage(
      user_id=user_id,
      resume_uuid=resume_uuid,
      operation_type="analyze",
      model_name=config.OPENAI_LLM_MODEL,
      prompt_tokens=prompt_tokens,
      total_tokens=total_tokens,
    )
    return {
      "type": "analyze",
      "resume_uuid": resume_uuid,
      "user_id": user_id,
      "parsed_data": parsed,
      "prompt_tokens": prompt_tokens,
      "total_tokens": total_tokens,
    }
  except Exception as exc:
    logger.error("LLM 분석 실패", resume_uuid=resume_uuid, error=str(exc), exc_info=True)
    db.update_resume_status(resume_uuid=resume_uuid, status="failed")
    raise self.retry(exc=exc)
