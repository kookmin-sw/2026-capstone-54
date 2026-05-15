from __future__ import annotations

from booth_rag.utils.secret_filter import is_secret_file, redact_secrets


def test_redacts_aws_access_key():
    text = "key = AKIAIOSFODNN7EXAMPLE"
    result = redact_secrets(text)
    assert "AKIAIOSFODNN7EXAMPLE" not in result.text
    assert result.redactions >= 1


def test_redacts_openai_key_format():
    text = 'OPENAI_API_KEY="sk-proj-abcdefghijklmnopqrstuvwxyz0123456789"'
    result = redact_secrets(text)
    assert "sk-proj-abcdefghijklmnopqrstuvwxyz0123456789" not in result.text
    assert result.redactions >= 1


def test_redacts_password_assignment():
    text = 'password = "supersecret123"'
    result = redact_secrets(text)
    assert "supersecret123" not in result.text


def test_does_not_redact_plain_text():
    text = "이것은 일반 텍스트입니다. 비밀이 없습니다."
    result = redact_secrets(text)
    assert result.text == text
    assert result.redactions == 0


def test_is_secret_file_detects_env():
    assert is_secret_file(".env")
    assert is_secret_file(".env.local")
    assert is_secret_file(".env.production")
    assert is_secret_file("id_rsa")
    assert is_secret_file("server.pem")


def test_is_secret_file_ignores_normal_files():
    assert not is_secret_file("README.md")
    assert not is_secret_file("main.py")
    assert not is_secret_file("config.yaml")
