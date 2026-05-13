"""
구조화 로깅 유틸리티.
structlog을 활용하여 JSON 형태의 로그를 출력합니다.
"""

import logging
import sys

import structlog

from app import config


def _setup_logging() -> None:
  logging.basicConfig(
    format="%(message)s",
    stream=sys.stdout,
    level=getattr(logging, config.LOG_LEVEL.upper(), logging.INFO),
  )
  structlog.configure(
    processors=[
      structlog.stdlib.add_log_level,
      structlog.stdlib.add_logger_name,
      structlog.processors.TimeStamper(fmt="iso"),
      structlog.processors.StackInfoRenderer(),
      structlog.processors.format_exc_info,
      structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
  )


_setup_logging()


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
  return structlog.get_logger(name)
