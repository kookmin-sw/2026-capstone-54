"""Application settings loaded from environment variables."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Annotated

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"

DEFAULT_INCLUDE_DIRS: tuple[str, ...] = (
    "backend",
    "frontend",
    "analysis-resume",
    "analysis-stt",
    "analysis-video",
    "face-analyzer",
    "infra",
    "interview-analysis-report",
    "mefit-diagrams",
    "mefit-tools",
    "scraping",
    "voice-api",
)


class Settings(BaseSettings):
    """Runtime settings. .env takes precedence, then OS env."""

    model_config = SettingsConfigDict(
        env_file=PROJECT_ROOT / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    embedding_backend: str = Field(
        default="local",
        description="local = run sentence-transformers in this process; remote = call an embedding server",
    )
    embedding_local_model: str = Field(
        default="BAAI/bge-m3",
        description="HuggingFace model id (used by local backend and by the embedding server)",
    )
    embedding_device: str = Field(
        default="auto",
        description="auto | cpu | mps | cuda (local backend / server only)",
    )

    remote_embedding_url: str = Field(
        default="http://192.168.0.6:8080",
        description="Base URL of the embedding server (when embedding_backend=remote)",
    )
    remote_embedding_timeout: float = Field(
        default=60.0,
        description="HTTP timeout (seconds) for remote embedding calls",
    )
    remote_embedding_batch_size: int = Field(
        default=32,
        description="Batch size for remote embed_documents",
    )
    embedding_concurrency: int = Field(
        default=4,
        ge=1,
        le=64,
        description="Max files embedded in parallel during ingestion (1 = serial)",
    )

    graph_use_pagerank: bool = Field(
        default=True,
        description="Use personalised PageRank on the knowledge graph during retrieval",
    )
    graph_ppr_weight: float = Field(
        default=0.15,
        ge=0.0,
        le=1.0,
        description="Mixing weight of graph PPR score into the final retrieval score",
    )
    graph_ppr_alpha: float = Field(
        default=0.85,
        ge=0.0,
        le=1.0,
        description="PageRank damping factor (standard 0.85)",
    )
    graph_hub_top_k: int = Field(
        default=5,
        ge=0,
        le=30,
        description="How many global-PageRank hub files to surface in the prompt",
    )

    embedding_server_host: str = Field(
        default="0.0.0.0",
        description="Bind host for the embedding server (run_embedding_server.sh)",
    )
    embedding_server_port: int = Field(
        default=8080,
        description="Bind port for the embedding server",
    )

    openai_api_key: str = Field(default="", description="OpenAI API key (chat LLM only; embeddings are always local)")
    openai_chat_model: str = Field(default="gpt-4o-mini")

    source_repo_path: Path = Field(
        default=Path("/Users/koa/006-capstone-modules"),
        description="Path to the MeFit monorepo for code ingestion",
    )
    ingest_include_dirs: Annotated[tuple[str, ...], NoDecode] = Field(
        default=DEFAULT_INCLUDE_DIRS,
        description="Top-level directories to index under source_repo_path (comma-separated in .env)",
    )

    host: str = "127.0.0.1"
    port: int = 8765
    debug: bool = True

    booth_team_number: str = "54"
    booth_team_name: str = "미핏 (MeFit)"
    booth_domain_url: str = "https://mefit.kr"
    booth_team_page_url: str = "https://kookmin-sw.github.io/2026-capstone-54/"

    admin_token: str = Field(default="", description="Empty -> admin disabled")

    @field_validator("ingest_include_dirs", mode="before")
    @classmethod
    def _split_include_dirs(cls, value: object) -> object:
        if isinstance(value, str):
            parts = [p.strip() for p in value.split(",") if p.strip()]
            return tuple(parts) if parts else DEFAULT_INCLUDE_DIRS
        return value

    @property
    def data_dir(self) -> Path:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        return DATA_DIR

    @property
    def chroma_dir(self) -> Path:
        path = self.data_dir / "chroma"
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def graph_dir(self) -> Path:
        path = self.data_dir / "graph"
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def uploads_dir(self) -> Path:
        path = self.data_dir / "uploads"
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def chat_db_path(self) -> Path:
        return self.data_dir / "chat.db"

    @property
    def has_openai(self) -> bool:
        return bool(self.openai_api_key.strip())

    @property
    def admin_enabled(self) -> bool:
        return bool(self.admin_token.strip())


@lru_cache
def get_settings() -> Settings:
    return Settings()
