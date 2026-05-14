from __future__ import annotations

from collections.abc import AsyncIterator
from dataclasses import dataclass, field

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage

from booth_rag.config import get_settings
from booth_rag.rag.embeddings import build_embeddings
from booth_rag.rag.graph_store import KnowledgeGraph
from booth_rag.rag.retriever import HybridContext, HybridRetriever
from booth_rag.rag.vector_store import VectorIndex

_SYSTEM_PROMPT_KO = """당신은 미핏(MeFit) 캡스톤 프로젝트의 공식 안내 도우미입니다.

미핏은 국민대학교 캡스톤 54팀의 작품으로, 이력서 기반 AI 면접·시선/표정 분석·발화 분석을 제공하는 면접 준비 플랫폼입니다.

답변 규칙:
1. 한국어로 자연스럽고 친절하게 답변하세요. 부스 방문자가 처음 듣는 사람이라고 가정합니다.
2. 아래 "참고 자료"를 우선 근거로 사용하세요. 자료에 없는 내용은 추측하지 말고 "아직 인덱싱되지 않은 영역"이라고 솔직히 말하세요.
3. 코드 경로나 파일 이름을 언급할 때는 백틱으로 감싸세요 (예: `backend/webapp/...`).
4. 답변 끝에 사용한 자료를 "[1] 경로", "[2] 경로" 형태로 1-3개 인용하세요.
5. 너무 길지 않게, 핵심 → 부연 순으로 5-10문장 이내로 답변하세요.
6. 부스 방문자가 더 알고 싶어할 만한 후속 질문 한 가지를 마지막에 가볍게 제안하세요.
"""

_MAX_HISTORY_TURNS = 8


@dataclass
class ChatTurn:
    role: str
    content: str


@dataclass
class AnswerResult:
    text: str
    citations: list[str] = field(default_factory=list)
    used_offline_fallback: bool = False


class ChatChain:
    def __init__(self, retriever: HybridRetriever):
        self._retriever = retriever
        self._settings = get_settings()
        self._llm = self._build_llm()

    def _build_llm(self):
        if not self._settings.has_openai:
            return None
        from langchain_openai import ChatOpenAI

        return ChatOpenAI(
            api_key=self._settings.openai_api_key,
            model=self._settings.openai_chat_model,
            temperature=0.3,
            streaming=True,
        )

    @property
    def has_llm(self) -> bool:
        return self._llm is not None

    def _build_messages(
        self,
        history: list[ChatTurn],
        question: str,
        context: HybridContext,
    ) -> list[BaseMessage]:
        msgs: list[BaseMessage] = [SystemMessage(content=_SYSTEM_PROMPT_KO)]
        trimmed = history[-_MAX_HISTORY_TURNS * 2 :]
        for turn in trimmed:
            if turn.role == "user":
                msgs.append(HumanMessage(content=turn.content))
            elif turn.role == "assistant":
                msgs.append(AIMessage(content=turn.content))
        ctx_block = context.to_prompt_block() or "(아직 인덱싱된 자료가 없음)"
        msgs.append(
            HumanMessage(
                content=(
                    f"# 참고 자료\n{ctx_block}\n\n"
                    f"# 질문\n{question}\n\n"
                    "위 자료를 근거로 답하세요. 자료에 없는 내용은 추측하지 말 것."
                )
            )
        )
        return msgs

    @staticmethod
    def _citations_for(context: HybridContext) -> list[str]:
        seen: set[str] = set()
        out: list[str] = []
        for c in context.chunks:
            if c.rel_path and c.rel_path not in seen:
                out.append(c.rel_path)
                seen.add(c.rel_path)
            if len(out) >= 3:
                break
        return out

    def _offline_answer(self, question: str, context: HybridContext) -> str:
        header = "🔌 LLM 키가 설정되지 않아 오프라인 fallback 모드입니다."
        if not context.chunks:
            return (
                f"{header}\n\n"
                "아직 인덱싱된 자료가 없어 검색 결과가 없습니다. "
                "`.env` 에 `OPENAI_API_KEY` 를 설정하고, 관리자 페이지에서 코드/문서를 적재해주세요.\n\n"
                f"질문: {question}"
            )
        top = context.chunks[:3]
        bullets = "\n".join(f"- `{c.rel_path}` (L{c.line_start}-{c.line_end})" for c in top)
        excerpt = top[0].text.strip().splitlines()[:6]
        return (
            f"{header}\n\n"
            f"검색된 가장 관련 있는 자료는 다음과 같습니다:\n{bullets}\n\n"
            "발췌 (가장 유사한 청크):\n"
            f"```\n{chr(10).join(excerpt)}\n```\n\n"
            f"질문: {question}\n\n"
            "정식 답변을 받으려면 `OPENAI_API_KEY` 를 설정해주세요."
        )

    async def answer_stream(self, history: list[ChatTurn], question: str) -> AsyncIterator[str]:
        context = self._retriever.retrieve(question)
        if self._llm is None:
            yield self._offline_answer(question, context)
            return
        msgs = self._build_messages(history, question, context)
        async for chunk in self._llm.astream(msgs):
            content = getattr(chunk, "content", "")
            if isinstance(content, list):
                content = "".join(part.get("text", "") if isinstance(part, dict) else str(part) for part in content)
            if content:
                yield content

    async def answer(self, history: list[ChatTurn], question: str) -> AnswerResult:
        context = self._retriever.retrieve(question)
        citations = self._citations_for(context)
        if self._llm is None:
            text = self._offline_answer(question, context)
            return AnswerResult(text=text, citations=citations, used_offline_fallback=True)
        msgs = self._build_messages(history, question, context)
        resp = await self._llm.ainvoke(msgs)
        content = getattr(resp, "content", "")
        if isinstance(content, list):
            content = "".join(part.get("text", "") if isinstance(part, dict) else str(part) for part in content)
        return AnswerResult(text=str(content), citations=citations, used_offline_fallback=False)


def build_chain(persist_chroma_dir=None, persist_graph_dir=None) -> ChatChain:
    embeddings = build_embeddings()
    vector = VectorIndex(embeddings, persist_dir=persist_chroma_dir)
    graph = KnowledgeGraph(persist_dir=persist_graph_dir)
    retriever = HybridRetriever(vector_index=vector, graph=graph)
    return ChatChain(retriever=retriever)
