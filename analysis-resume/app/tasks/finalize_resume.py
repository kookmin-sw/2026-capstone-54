"""이력서 처리 최종 완료 task.

embed + analyze chord 의 결과를 모아 backend 의 `resumes.tasks.apply_analysis_result`
Celery 태스크로 payload 를 전송한다. DB 는 직접 건드리지 않는다.

이 태스크에서 파생 임베딩을 생성한다:
- 원문 텍스트 청크 → embed 단계에서 이미 만들어짐 (chunk_type="text")
- summary, basic_info, skills, 각 experience / education / certification / project /
  language_spoken, 각 industry_domain, 각 keyword → 이 단계에서 JSON 직렬화 후 embedding
이렇게 해야 벡터 검색 시 "경력 부분만 유사도 top-K" 같은 필터링이 가능하다.
"""

import json

from app import config
from app.celery_app import app
from app.common import embed_texts
from app.utils.logger import get_logger

logger = get_logger(__name__)


def _dump_json(obj) -> str:
  """임베딩 대상 구조체를 안정적인 한글 JSON 문자열로 직렬화한다."""
  return json.dumps(obj, ensure_ascii=False, sort_keys=False)


def _collect_structured_chunks(parsed_data: dict) -> list[dict]:
  """ParsedResumeData dict 를 섹션별 임베딩 대상 청크 목록으로 변환한다.

  각 청크는 `{chunk_type, context}` 만 담아 두고, 벡터는 이후 일괄 `embed_texts` 로 채운다.
  """
  chunks: list[dict] = []

  # ── summary ─────────────────────────────────────────────
  if summary := (parsed_data.get("summary") or "").strip():
    chunks.append({"chunk_type": "summary", "context": summary})

  # ── basic_info (4 필드 dict 를 JSON 으로 통째 임베딩) ──────
  if basic_info := parsed_data.get("basic_info") or {}:
    if any(basic_info.get(k) for k in ("name", "email", "phone", "location")):
      chunks.append({"chunk_type": "basic_info", "context": _dump_json(basic_info)})

  # ── skills (한 덩어리: 모든 하위 그룹 포함 dict) ─────────
  if skills := parsed_data.get("skills") or {}:
    if isinstance(skills, dict) and any(skills.get(k) for k in ("technical", "soft", "tools", "languages")):
      chunks.append({"chunk_type": "skill", "context": _dump_json(skills)})
    elif isinstance(skills, list) and skills:
      chunks.append({"chunk_type": "skill", "context": _dump_json({"technical": skills})})

  # ── experiences (건별로 JSON 직렬화) ─────────────────────
  for exp in parsed_data.get("experiences") or []:
    if isinstance(exp, dict) and (exp.get("company") or exp.get("role")):
      chunks.append({"chunk_type": "experience", "context": _dump_json(exp)})

  for edu in parsed_data.get("educations") or []:
    if isinstance(edu, dict) and edu.get("school"):
      chunks.append({"chunk_type": "education", "context": _dump_json(edu)})

  for cert in parsed_data.get("certifications") or []:
    if isinstance(cert, dict) and cert.get("name"):
      chunks.append({"chunk_type": "certification", "context": _dump_json(cert)})

  for award in parsed_data.get("awards") or []:
    if isinstance(award, dict) and award.get("name"):
      chunks.append({"chunk_type": "award", "context": _dump_json(award)})

  for proj in parsed_data.get("projects") or []:
    if isinstance(proj, dict) and proj.get("name"):
      chunks.append({"chunk_type": "project", "context": _dump_json(proj)})

  for lang in parsed_data.get("languages_spoken") or []:
    if isinstance(lang, dict) and lang.get("language"):
      chunks.append({"chunk_type": "language_spoken", "context": _dump_json(lang)})

  # ── 태그 계열 — 개별 항목을 각각 embedding 해서 필터 조회 가능하게 함 ─
  for domain in parsed_data.get("industry_domains") or []:
    if domain:
      chunks.append({"chunk_type": "industry_domain", "context": str(domain)})

  for keyword in parsed_data.get("keywords") or []:
    if keyword:
      chunks.append({"chunk_type": "keyword", "context": str(keyword)})

  return chunks


@app.task(bind=True, name="analysis_resume.tasks.finalize_resume", max_retries=1, default_retry_delay=10)
def finalize_resume_task(
  self,
  group_results: list[dict],
  resume_uuid: str,
  user_id: int,
  file_text_content: str | None = None,
) -> dict:
  """embed / analyze 결과를 모아 backend apply_analysis_result 에 payload 를 전송한다."""
  logger.info("최종 처리 시작", resume_uuid=resume_uuid)

  app.send_task(
    "resumes.tasks.update_resume_step",
    queue="celery",
    kwargs={"resume_uuid": resume_uuid, "step": "finalizing"},
  )

  try:
    results_by_type = {r["type"]: r for r in (group_results or []) if isinstance(r, dict)}
    embed_result = results_by_type.get("embed", {}) or {}
    analyze_result = results_by_type.get("analyze", {}) or {}

    parsed_data: dict = analyze_result.get("parsed_data") or {}

    # 1) 원문 청크 임베딩 (embed_resume_task 에서 이미 생성)
    embeddings: list[dict] = list(embed_result.get("embeddings") or [])

    # 2) 정규화 섹션별 JSON 임베딩
    structured_chunks = _collect_structured_chunks(parsed_data)
    extra_embed_tokens = 0

    if structured_chunks:
      contexts = [c["context"] for c in structured_chunks]
      vectors, tokens = embed_texts(contexts)
      extra_embed_tokens += tokens
      base_index = len(embeddings)
      for offset, (chunk, vec) in enumerate(zip(structured_chunks, vectors)):
        embeddings.append(
          {
            "context": chunk["context"],
            "vector": vec,
            "chunk_type": chunk["chunk_type"],
            "chunk_index": base_index + offset,
          }
        )

    # 3) 토큰 사용량 누적 (embed + analyze + 파생 embed)
    token_usages: list[dict] = []
    if embed_tu := embed_result.get("token_usage"):
      token_usages.append(embed_tu)
    if analyze_tu := analyze_result.get("token_usage"):
      token_usages.append(analyze_tu)
    if extra_embed_tokens > 0:
      token_usages.append(
        {
          "operation_type": "embed",
          "model_name": config.OPENAI_EMBEDDING_MODEL,
          "prompt_tokens": extra_embed_tokens,
          "total_tokens": extra_embed_tokens,
        }
      )

    # 4) backend 로 전체 payload 전송 → Django ORM 으로 영속화
    app.send_task(
      "resumes.tasks.apply_analysis_result",
      queue="celery",
      kwargs={
        "resume_uuid": resume_uuid,
        "parsed_data": parsed_data,
        "embeddings": embeddings,
        "file_text_content": file_text_content,
        "token_usages": token_usages,
      },
    )

    logger.info(
      "이력서 처리 완료",
      resume_uuid=resume_uuid,
      embeddings=len(embeddings),
      structured_chunks=len(structured_chunks),
    )
    return {"resume_uuid": resume_uuid, "status": "completed"}

  except Exception as exc:
    logger.error("최종 처리 실패", resume_uuid=resume_uuid, error=str(exc), exc_info=True)
    app.send_task(
      "resumes.tasks.mark_resume_failed",
      queue="celery",
      kwargs={"resume_uuid": resume_uuid, "error": str(exc)},
    )
    raise self.retry(exc=exc)
