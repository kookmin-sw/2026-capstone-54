"""
SQLAlchemy DB 연결 설정.

config.py의 DATABASE_URL을 사용하여 엔진과 세션 팩토리를 구성하고,
get_session 컨텍스트 매니저를 제공한다.
"""

import os
from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from config import DATABASE_URL

# 풀 크기는 backend RDS 의 max_connections (현재 79) 를 공유하므로 작게 고정.
# Celery prefork worker child 1 개 기준 pool_size + max_overflow = 4.
# concurrency=2 환경에서 최악의 경우에도 8 conn 으로 캡됨.
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=2,
    max_overflow=2,
    pool_timeout=10,
    connect_args={
        "application_name": os.getenv(
            "DB_APPLICATION_NAME", "mefit-interview-analysis-report"
        ),
    },
)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


@contextmanager
def get_session():
    """SQLAlchemy 세션 컨텍스트 매니저. commit/rollback을 자동 처리한다."""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
