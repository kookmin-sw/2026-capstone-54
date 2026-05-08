"""
LLM 기반 면접 분석 서비스.

구조화된 프롬프트로 LLM을 호출하여 면접 답변을 종합 분석하고,
JSON 응답을 파싱하여 AnalysisResult를 반환한다.
"""

from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass, field

from langchain_openai import ChatOpenAI

from config import OPENAI_API_KEY, OPENAI_MODEL
from utils.token_tracker import TokenUsageCallback, calculate_cost

logger = logging.getLogger(__name__)

# 4개 텍스트 평가 카테고리 (면접태도는 영상 워커가 별도 산출)
EVALUATION_CATEGORIES: list[str] = [
    "구체성",
    "직무 적합성",
    "논리성",
    "신뢰도",
]

# 등급 매핑 테이블 (하한, 상한, 등급)
_GRADE_TABLE: list[tuple[int, int, str]] = [
    (90, 100, "Excellent"),
    (70, 89, "Good"),
    (50, 69, "Average"),
    (30, 49, "Below Average"),
    (0, 29, "Poor"),
]


@dataclass
class ExchangeData:
    """질문-답변 턴 데이터."""

    turn_id: int
    question: str
    answer: str
    turn_type: str  # "initial" or "followup"
    question_source: str  # "resume", "job_posting", ""
    voice_summary: dict | None = None


@dataclass
class AnalysisContext:
    """LLM 분석에 필요한 컨텍스트."""

    session_id: str
    difficulty_level: str
    total_questions: int
    total_followup_questions: int
    exchanges: list[ExchangeData] = field(default_factory=list)
    resume_content: str = ""
    job_posting_content: str = ""


@dataclass
class AnalysisResult:
    """LLM 분석 결과."""

    overall_score: int = 0  # 0~100
    overall_grade: str = ""  # Excellent/Good/Average/Below Average/Poor
    overall_comment: str = ""  # 2~3문장 해석 코멘트
    category_scores: list[dict] = field(default_factory=list)  # 6개 카테고리
    question_feedbacks: list[dict] = field(default_factory=list)
    strengths: list[dict] = field(default_factory=list)  # 2+ [{title, evidence}]
    improvement_areas: list[dict] = field(
        default_factory=list
    )  # 2+ [{title, evidence}]
    input_tokens: int = 0
    output_tokens: int = 0
    total_tokens: int = 0
    total_cost_usd: float = 0.0


class LLMAnalyzer:
    """LangChain 기반 면접 분석기."""

    def __init__(self) -> None:
        self._token_callback = TokenUsageCallback()
        self._llm = ChatOpenAI(
            model=OPENAI_MODEL,
            api_key=OPENAI_API_KEY,
            temperature=0.3,
            callbacks=[self._token_callback],
        )

    def analyze(self, context: AnalysisContext) -> AnalysisResult:
        """면접 데이터를 분석하여 종합 결과를 반환한다."""
        self._token_callback.reset()

        prompt = self._build_prompt(context)
        response = self._llm.invoke(prompt)
        response_text = response.content

        parsed = self._parse_response(response_text, context)

        usage = self._token_callback.get_usage()
        cost = calculate_cost(usage.input_tokens, usage.output_tokens, OPENAI_MODEL)

        return AnalysisResult(
            overall_score=parsed["overall_score"],
            overall_grade=parsed["overall_grade"],
            overall_comment=parsed["overall_comment"],
            category_scores=parsed["category_scores"],
            question_feedbacks=parsed["question_feedbacks"],
            strengths=parsed["strengths"],
            improvement_areas=parsed["improvement_areas"],
            input_tokens=usage.input_tokens,
            output_tokens=usage.output_tokens,
            total_tokens=usage.total_tokens,
            total_cost_usd=cost,
        )

    def _build_prompt(self, context: AnalysisContext) -> str:
        """구조화된 분석 프롬프트를 구성한다."""
        exchanges_text = self._format_exchanges(context.exchanges)

        return f"""당신은 면접 평가 전문가입니다. 아래 면접 데이터를 종합 분석하여 JSON 형식으로 결과를 반환하세요.

## 면접 정보
- 난이도: {context.difficulty_level}
- 총 질문 수: {context.total_questions}
- 꼬리질문 수: {context.total_followup_questions}

## 채용공고 내용
{context.job_posting_content or "(제공되지 않음)"}

## 이력서 내용
{context.resume_content or "(제공되지 않음)"}

## 질문-답변 목록
{exchanges_text}

## 평가 지침

### 4개 카테고리 평가 기준
1. **구체성**: STAR 기법(상황-과제-행동-결과) 활용 여부, 구체적인 수치·사례·경험 포함 여부 평가.
2. **직무 적합성**: 채용공고의 주요업무(duties), 자격요건(requirements), 우대사항(preferred)에 답변이 부합하는지 평가. 채용공고 내용을 주요 기준으로 참조.
3. **논리성**: 주장과 근거의 연결이 명확한지, 비약 없이 논리적으로 전개되는지 평가.
4. **신뢰도**: 이력서에 기재된 경력, 프로젝트, 기술 스택과 답변 내용이 일치하는지 평가. 이력서 내용을 주요 기준으로 참조.

### 질문 메타데이터 활용
- question_source가 "resume"인 질문: 이력서 기반 질문이므로 이력서 내용과의 일치도를 중점 평가
- question_source가 "job_posting"인 질문: 채용공고 기반 질문이므로 직무 적합성을 중점 평가
- question_purpose가 있는 꼬리질문: 해당 목적(예: "해결 과정 파악", "팀 협업 능력 검증")을 기준으로 답변 적절성 평가

## 응답 형식

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트를 포함하지 마세요.

{{
  "overall_score": <0~100 정수>,
  "overall_grade": "<Excellent|Good|Average|Below Average|Poor>",
  "overall_comment": "<2~3문장의 종합 해석 코멘트>",
  "category_scores": [
    {{"category": "구체성", "score": <0~100>, "comment": "<1~2문장 평가>"}},
    {{"category": "직무 적합성", "score": <0~100>, "comment": "<1~2문장 평가>"}},
    {{"category": "논리성", "score": <0~100>, "comment": "<1~2문장 평가>"}},
    {{"category": "신뢰도", "score": <0~100>, "comment": "<1~2문장 평가>"}}
  ],
  "question_feedbacks": [
    {{
      "turn_id": <턴 ID>,
      "question": "<질문 텍스트>",
      "strengths": ["<잘한 점 1>", ...],
      "improvements": ["<개선할 점 1>", ...],
      "model_answer": "<모범답변 텍스트>"
    }}
  ],
  "strengths": [
    {{"title": "<강점 제목>", "evidence": "<면접 답변에서의 구체적 근거>"}},
    {{"title": "<강점 제목>", "evidence": "<면접 답변에서의 구체적 근거>"}}
  ],
  "improvement_areas": [
    {{"title": "<개선 영역 제목>", "evidence": "<면접 답변에서의 구체적 근거>"}},
    {{"title": "<개선 영역 제목>", "evidence": "<면접 답변에서의 구체적 근거>"}}
  ]
}}

question_feedbacks 배열은 위 질문-답변 목록의 모든 항목에 대해 하나씩 생성하세요.
strengths와 improvement_areas는 각각 최소 2개 이상 생성하세요.
각 강점/개선 영역에는 면접 답변에서의 구체적 근거를 반드시 포함하세요."""

    @staticmethod
    def _format_exchanges(exchanges: list[ExchangeData]) -> str:
        if not exchanges:
            return "(질문-답변 데이터 없음)"

        parts: list[str] = []
        for ex in exchanges:
            meta = f" (출처: {ex.question_source})" if ex.question_source else ""

            block = (
                f"### [{ex.turn_type}] 질문 #{ex.turn_id}{meta}\n"
                f"Q: {ex.question}\n"
                f"A: {ex.answer}"
            )

            if ex.voice_summary:
                vs = ex.voice_summary
                block += (
                    f"\n[음성 분석]\n"
                    f"- 총 발화 시간: {vs.get('speechDurationMs', 0)}ms / 총 길이: {vs.get('totalDurationMs', 0)}ms\n"
                    f"- 묵음 비율: {vs.get('silenceRatio', 0):.1%}\n"
                    f"- 묵음 구간 수: {vs.get('silenceSegmentCount', 0)}회\n"
                    f"- 평균 음량(발화): {vs.get('avgDbfsSpeech', 'N/A')} dBFS"
                )

            parts.append(block)
        return "\n\n".join(parts)

    def _parse_response(self, response_text: str, context: AnalysisContext) -> dict:
        """LLM 응답 텍스트를 파싱하고 스키마를 검증한다."""
        data = self._extract_json(response_text)
        return self._validate_schema(data, context)

    @staticmethod
    def _extract_json(text: str) -> dict:
        """텍스트에서 JSON을 추출한다. 직접 파싱 → 코드블록 추출 순으로 시도."""
        # 1) 직접 파싱 시도
        try:
            return json.loads(text)
        except (json.JSONDecodeError, TypeError):
            pass

        # 2) ```json ... ``` 코드블록에서 추출
        match = re.search(r"```(?:json)?\s*\n?(.*?)\n?\s*```", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except (json.JSONDecodeError, TypeError):
                pass

        raise ValueError(f"LLM 응답에서 유효한 JSON을 추출할 수 없습니다: {text[:200]}")

    def _validate_schema(self, data: dict, context: AnalysisContext) -> dict:
        """파싱된 JSON의 스키마를 검증하고 보정한다."""
        # overall_score: 0~100 정수로 클램핑
        score = int(data.get("overall_score", 0))
        score = max(0, min(100, score))
        data["overall_score"] = score

        # overall_grade: 점수 기반 검증/보정
        raw_grade = data.get("overall_grade", "")
        data["overall_grade"] = self._validate_and_fix_grade(score, raw_grade)

        # overall_comment
        if not data.get("overall_comment"):
            data["overall_comment"] = "분석 결과를 확인하세요."

        # category_scores: 4개 카테고리 검증 (면접태도는 영상 워커가 append)
        data["category_scores"] = self._validate_categories(
            data.get("category_scores", [])
        )

        # question_feedbacks: exchange 수와 일치하도록 검증
        data["question_feedbacks"] = self._validate_feedbacks(
            data.get("question_feedbacks", []), context.exchanges
        )

        # strengths: 최소 2개
        data["strengths"] = self._validate_items_with_evidence(
            data.get("strengths", []), min_count=2, label="강점"
        )

        # improvement_areas: 최소 2개
        data["improvement_areas"] = self._validate_items_with_evidence(
            data.get("improvement_areas", []), min_count=2, label="개선 영역"
        )

        return data

    def _validate_and_fix_grade(self, score: int, grade: str) -> str:
        """점수에 맞는 등급인지 검증하고, 불일치 시 보정한다."""
        expected = self.score_to_grade(score)
        if grade != expected:
            if grade:
                logger.warning(
                    "등급 불일치 보정: score=%d, LLM grade=%s → %s",
                    score,
                    grade,
                    expected,
                )
            return expected
        return grade

    @staticmethod
    def score_to_grade(score: int) -> str:
        """점수를 등급으로 변환한다."""
        for low, high, grade in _GRADE_TABLE:
            if low <= score <= high:
                return grade
        return "Poor"

    @staticmethod
    def _validate_categories(raw: list) -> list[dict]:
        """4개 카테고리 평가를 검증/보정한다. (면접태도는 영상 워커가 별도 append)"""
        result: list[dict] = []
        raw_by_name: dict[str, dict] = {}
        for item in raw if isinstance(raw, list) else []:
            if isinstance(item, dict) and "category" in item:
                raw_by_name[item["category"]] = item

        for cat_name in EVALUATION_CATEGORIES:
            item = raw_by_name.get(cat_name, {})
            cat_score = int(item.get("score", 0))
            cat_score = max(0, min(100, cat_score))
            comment = (
                item.get("comment", "")
                or f"{cat_name} 평가 코멘트가 제공되지 않았습니다."
            )
            result.append(
                {
                    "category": cat_name,
                    "score": cat_score,
                    "comment": comment,
                }
            )
        return result

    @staticmethod
    def _validate_feedbacks(raw: list, exchanges: list[ExchangeData]) -> list[dict]:
        """질문별 피드백을 검증/보정한다."""
        result: list[dict] = []
        raw_by_id: dict[int, dict] = {}
        for item in raw if isinstance(raw, list) else []:
            if isinstance(item, dict) and "turn_id" in item:
                raw_by_id[item["turn_id"]] = item

        for ex in exchanges:
            item = raw_by_id.get(ex.turn_id, {})
            strengths = item.get("strengths", [])
            if not isinstance(strengths, list) or len(strengths) < 1:
                strengths = ["피드백이 제공되지 않았습니다."]
            improvements = item.get("improvements", [])
            if not isinstance(improvements, list) or len(improvements) < 1:
                improvements = ["피드백이 제공되지 않았습니다."]
            model_answer = (
                item.get("model_answer", "") or "모범답변이 제공되지 않았습니다."
            )

            result.append(
                {
                    "turn_id": ex.turn_id,
                    "question": ex.question,
                    "strengths": strengths,
                    "improvements": improvements,
                    "model_answer": model_answer,
                }
            )
        return result

    @staticmethod
    def _validate_items_with_evidence(
        raw: list, *, min_count: int, label: str
    ) -> list[dict]:
        """title/evidence 구조의 항목 리스트를 검증/보정한다."""
        result: list[dict] = []
        for item in raw if isinstance(raw, list) else []:
            if isinstance(item, dict) and item.get("title"):
                result.append(
                    {
                        "title": item["title"],
                        "evidence": item.get("evidence", "")
                        or f"{label} 근거가 제공되지 않았습니다.",
                    }
                )

        while len(result) < min_count:
            result.append(
                {
                    "title": f"추가 {label} {len(result) + 1}",
                    "evidence": f"{label} 분석 근거가 제공되지 않았습니다.",
                }
            )
        return result
