"""Detect and mask secrets in text/code so they never enter the RAG index."""

from __future__ import annotations

import re
from dataclasses import dataclass

_SECRET_PATTERNS: tuple[tuple[str, re.Pattern[str]], ...] = (
    ("aws_access_key", re.compile(r"AKIA[0-9A-Z]{16}")),
    ("aws_secret_key", re.compile(r"(?<![A-Za-z0-9/+=])[A-Za-z0-9/+=]{40}(?![A-Za-z0-9/+=])")),
    ("openai_key", re.compile(r"sk-(?:proj-)?[A-Za-z0-9_\-]{20,}")),
    ("anthropic_key", re.compile(r"sk-ant-[A-Za-z0-9_\-]{20,}")),
    ("google_api_key", re.compile(r"AIza[0-9A-Za-z\-_]{35}")),
    ("github_token", re.compile(r"gh[pousr]_[A-Za-z0-9]{36,255}")),
    ("slack_token", re.compile(r"xox[baprs]-[A-Za-z0-9-]{10,}")),
    ("private_key", re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----")),
    ("jwt", re.compile(r"eyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}")),
    ("django_secret", re.compile(r"django-insecure-[A-Za-z0-9!@#$%^&*()_+\-=]{20,}")),
    (
        "generic_password_assignment",
        re.compile(
            r"""(?ix)
            \b(password|passwd|secret|api[_-]?key|access[_-]?token|auth[_-]?token)
            \s*[:=]\s*
            ['"]([^'"\s]{6,})['"]
            """
        ),
    ),
)

_SECRET_FILENAMES: frozenset[str] = frozenset(
    {
        ".env",
        ".env.local",
        ".env.development",
        ".env.production",
        ".env.staging",
        ".env.litellm-secret",
        "credentials.json",
        "service-account.json",
        "id_rsa",
        "id_ed25519",
        "secrets.yaml",
        "secrets.yml",
    }
)

_SECRET_PATH_HINTS: tuple[str, ...] = (
    "/secrets/",
    "/.aws/",
    "/.ssh/",
)


@dataclass(frozen=True)
class FilterResult:
    text: str
    redactions: int


def is_secret_file(filename: str, full_path: str = "") -> bool:
    name = filename.lower()
    if name in _SECRET_FILENAMES:
        return True
    if name.endswith((".pem", ".key", ".pfx", ".p12")):
        return True
    if name.startswith(".env"):
        return True
    lowered_path = full_path.lower()
    return any(hint in lowered_path for hint in _SECRET_PATH_HINTS)


def redact_secrets(text: str) -> FilterResult:
    """Redact known secret patterns. Returns sanitized text and count."""
    if not text:
        return FilterResult(text=text, redactions=0)

    total = 0
    out = text
    for label, pattern in _SECRET_PATTERNS:

        def _sub(match: re.Match[str], _label: str = label) -> str:
            nonlocal total
            total += 1
            return f"[REDACTED:{_label}]"

        out = pattern.sub(_sub, out)
    return FilterResult(text=out, redactions=total)
