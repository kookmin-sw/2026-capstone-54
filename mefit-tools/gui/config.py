"""
MeFit Tools GUI - Project Configuration
========================================
프로젝트별 설정 및 메타데이터 관리
"""

from dataclasses import dataclass
from typing import List, Optional


@dataclass
class ServiceInfo:
    """개별 서비스 정보"""

    name: str
    display_name: str
    description: str
    port: Optional[int] = None
    url: Optional[str] = None


@dataclass
class ProjectInfo:
    """프로젝트 전체 정보"""

    name: str
    display_name: str
    description: str
    services: List[ServiceInfo]
    directory: str


# ============================================
# 프로젝트 정의
# ============================================

PROJECTS = {
    "backend": ProjectInfo(
        name="backend",
        display_name="Backend",
        description="Django Backend (webapp, postgres, redis, celery)",
        directory="backend",
        services=[
            ServiceInfo(
                "webapp",
                "Web App",
                "Django web application",
                port=8000,
                url="http://localhost:8000",
            ),
            ServiceInfo("postgres", "PostgreSQL", "PostgreSQL database"),
            ServiceInfo("redis", "Redis", "Redis cache & broker"),
            ServiceInfo("celery-worker", "Celery Worker", "Background task worker"),
            ServiceInfo("celery-beat", "Celery Beat", "Scheduled task scheduler"),
            ServiceInfo(
                "s3mock",
                "S3 Mock",
                "Local S3 mock server",
                port=9090,
                url="http://localhost:9090",
            ),
            ServiceInfo(
                "flower",
                "Flower",
                "Celery monitoring",
                port=5555,
                url="http://localhost:5555/admin/flower",
            ),
        ],
    ),
    "voice-api": ProjectInfo(
        name="voice-api",
        display_name="Voice API",
        description="FastAPI Voice Service (TTS/STT)",
        directory="voice-api",
        services=[
            ServiceInfo(
                "voice-api",
                "Voice API",
                "FastAPI voice service",
                port=8001,
                url="http://localhost:8001",
            ),
        ],
    ),
    "scraping": ProjectInfo(
        name="scraping",
        display_name="Scraping",
        description="Web Scraping Celery Worker",
        directory="scraping",
        services=[
            ServiceInfo("scraper-worker", "Scraper Worker", "Web scraping worker"),
        ],
    ),
    "analysis-resume": ProjectInfo(
        name="analysis-resume",
        display_name="Resume Analysis",
        description="Resume Analysis Celery Worker",
        directory="analysis-resume",
        services=[
            ServiceInfo(
                "analysis-resume-worker", "Resume Worker", "Resume analysis worker"
            ),
        ],
    ),
    "interview-analysis-report": ProjectInfo(
        name="interview-analysis-report",
        display_name="Interview Analysis",
        description="Interview Analysis Celery Worker",
        directory="interview-analysis-report",
        services=[
            ServiceInfo(
                "analysis-worker", "Interview Worker", "Interview analysis worker"
            ),
        ],
    ),
}

# ============================================
# 바로가기 URL 정의
# ============================================

QUICK_LINKS = {
    "Frontend": "http://localhost:5173",
    "Backend API": "http://localhost:8000",
    "Flower (Celery)": "http://localhost:5555/admin/flower",
    "S3 Mock": "http://localhost:9090",
    "Voice API": "http://localhost:8001",
}

# ============================================
# 헬퍼 함수
# ============================================


def get_project(project_name: str) -> Optional[ProjectInfo]:
    """프로젝트 이름으로 프로젝트 정보 조회"""
    return PROJECTS.get(project_name)


def get_all_projects() -> List[ProjectInfo]:
    """모든 프로젝트 목록 반환"""
    return list(PROJECTS.values())


def get_project_service_names(project_name: str) -> List[str]:
    """프로젝트의 모든 서비스 이름 반환"""
    project = get_project(project_name)
    if project:
        return [s.name for s in project.services]
    return []
