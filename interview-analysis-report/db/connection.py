"""
SQLAlchemy DB 연결 설정.

config.py의 DATABASE_URL을 사용하여 엔진과 세션 팩토리를 구성하고,
get_session 컨텍스트 매니저를 제공한다.
"""

from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from config import DATABASE_URL

engine = create_engine(DATABASE_URL)
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
