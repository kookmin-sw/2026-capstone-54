# 청킹 전략 개선 방안

## 현재 문제

`embed_resume.py`의 `chunk_text()` 함수가 고정 글자 수(500자)로 텍스트를 자르고 있어서,
단어나 문장 중간에서 끊기는 문제가 발생합니다.

```python
# 현재 구현 — 글자 수 기반 고정 분할
def chunk_text(text, chunk_size=500, overlap=50):
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return [c.strip() for c in chunks if c.strip()]
```

이 방식의 문제:
- "DevOps AWS를 이용한 서버 관리 및 유지보" / "수를 할 수 있습니다" 처럼 문장이 잘림
- 잘린 청크의 임베딩 벡터가 원래 의미를 제대로 반영하지 못함
- 검색 시 유사도가 전반적으로 낮게 나옴 (distance 0.79~0.85)

## 개선 방안

### 방안 1: Recursive Character Splitting (권장, 즉시 적용 가능)

LangChain의 `RecursiveCharacterTextSplitter`와 동일한 전략을 직접 구현합니다.
분할 우선순위를 `\n\n` → `\n` → `. ` → ` ` → `""` 순서로 시도하여
단락 → 문장 → 단어 경계에서 자릅니다.

```python
SEPARATORS = ["\n\n", "\n", ". ", " ", ""]

def chunk_text_recursive(text, chunk_size=500, overlap=50, separators=None):
    if separators is None:
        separators = SEPARATORS

    final_chunks = []
    separator = separators[-1]

    for sep in separators:
        if sep in text:
            separator = sep
            break

    splits = text.split(separator) if separator else list(text)

    current_chunk = []
    current_length = 0

    for split in splits:
        piece = split + separator if separator else split
        piece_len = len(piece)

        if current_length + piece_len > chunk_size and current_chunk:
            chunk_text_str = "".join(current_chunk).strip()
            if chunk_text_str:
                final_chunks.append(chunk_text_str)

            # overlap 처리: 뒤에서부터 overlap 글자만큼 유지
            while current_length > overlap and current_chunk:
                removed = current_chunk.pop(0)
                current_length -= len(removed)

        current_chunk.append(piece)
        current_length += piece_len

    if current_chunk:
        chunk_text_str = "".join(current_chunk).strip()
        if chunk_text_str:
            final_chunks.append(chunk_text_str)

    return final_chunks
```

장점:
- 외부 의존성 없음 (순수 Python)
- 문장/단락 경계를 존중
- 기존 config의 CHUNK_SIZE, CHUNK_OVERLAP 그대로 사용 가능

### 방안 2: LangChain 라이브러리 사용

analysis-resume에 `langchain-text-splitters` 패키지를 추가하고 직접 사용합니다.

```python
from langchain_text_splitters import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,
    separators=["\n\n", "\n", ". ", " ", ""],
)
chunks = splitter.split_text(text)
```

장점:
- 검증된 구현, 엣지 케이스 처리 완료
- 한국어 포함 다국어 지원

단점:
- langchain 의존성 추가 (analysis-resume은 경량 프로젝트)

### 방안 3: Semantic Chunking

인접 문장의 임베딩 유사도를 비교하여 의미가 크게 바뀌는 지점에서 분할합니다.

```
문장1 ─ 문장2 ─ 문장3 │ 문장4 ─ 문장5 │ 문장6
       유사          급변          유사
       ──청크1──     ──청크2──     ──청크3──
```

장점:
- 의미 단위로 가장 정확한 분할
- 검색 품질 최상

단점:
- 청킹 단계에서 임베딩 API 호출 필요 (비용 증가)
- 구현 복잡도 높음
- 이력서는 보통 짧은 문서라서 과도할 수 있음

## 이력서 특화 고려사항

이력서는 일반 문서와 다른 특성이 있습니다:

1. 구조화된 섹션이 있음 (경력, 학력, 기술 스택 등)
2. 보통 1~5페이지로 짧음
3. 줄바꿈(`\n`)이 섹션 구분자 역할을 함

따라서 이력서에는 방안 1의 Recursive 방식이 가장 적합합니다.
분할 우선순위를 이력서에 맞게 조정하면 더 좋습니다:

```python
RESUME_SEPARATORS = [
    "\n\n",      # 섹션 구분 (경력 / 학력 / 기술 등)
    "\n",        # 항목 구분 (각 경력 항목, 각 프로젝트)
    ". ",        # 문장 경계
    ", ",        # 나열 항목 (기술 스택 등)
    " ",         # 단어 경계
    "",          # 최후 수단
]
```

## 권장 적용 순서

1. 방안 1을 `analysis-resume/app/tasks/embed_resume.py`의 `chunk_text()`에 적용
2. 기존 이력서 데이터 재처리 (임베딩 재생성)
3. 검색 플레이그라운드에서 유사도 개선 확인
4. 필요 시 chunk_size를 300~800 범위에서 실험

## 참고 자료

- [LangChain RecursiveCharacterTextSplitter](https://docs.langchain.com/oss/python/integrations/splitters/recursive_text_splitter)
- [Semantic Chunking Best Practices](https://www.extend.ai/resources/semantic-chunking-methods-5-best-practices-rag-results)
- [RAG Chunking Strategies](https://zenvanriel.nl/ai-engineer-blog/chunking-strategies-for-rag-systems/)

Content was rephrased for compliance with licensing restrictions.
