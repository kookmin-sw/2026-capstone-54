import json
import logging
import sys


class JsonFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            "timestamp": self.formatTime(record),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if hasattr(record, "_extra"):
            log_data.update(record._extra)
        return json.dumps(log_data, ensure_ascii=False)


class StructuredLogger:
    def __init__(self, name: str):
        self._logger = logging.getLogger(name)
        if not self._logger.handlers:
            handler = logging.StreamHandler(sys.stdout)
            handler.setFormatter(JsonFormatter())
            self._logger.addHandler(handler)
            self._logger.setLevel(logging.INFO)
            self._logger.propagate = False

    def info(self, message: str, **kwargs):
        record = self._logger.makeRecord(
            self._logger.name, logging.INFO, "", 0, message, (), None
        )
        record._extra = kwargs
        self._logger.handle(record)

    def error(self, message: str, **kwargs):
        record = self._logger.makeRecord(
            self._logger.name, logging.ERROR, "", 0, message, (), None
        )
        record._extra = kwargs
        self._logger.handle(record)


def get_logger(name: str) -> StructuredLogger:
    return StructuredLogger(name)
