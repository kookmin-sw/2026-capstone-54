"""
SQLAlchemy DB 연결 설정.

config.py의 DATABASE_URL을 사용하여 엔진과 세션 팩토리를 구성하고,
get_session 컨텍스트 매니저를 제공한다.
"""

from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from config import DATABASE_URL

engine = create_engine(
    DATABASE_URL,
    # AWS RDS 환경에서 장시간 idle 후 끊긴 커넥션을 재사용하지 않도록 방지
    pool_pre_ping=True,
    # RDS의 기본 idle connection timeout(보통 8분)보다 짧게 주기적 갱신
    pool_recycle=300,
)
SessionLocal = sessionmaker(bind=engine)


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
