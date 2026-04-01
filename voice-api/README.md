# Voice API

Text-to-Speech API service using edge-tts (Microsoft Edge TTS).

## Features

- 🎤 Text-to-Speech conversion using edge-tts
- 🌍 Support for 14+ languages
- 🔊 Customizable voice parameters (rate, volume, pitch)
- 🔐 Bearer token authentication via backend API
- 🐳 Docker support
- 🚀 FastAPI framework

## Development Setup

### Prerequisites

- Python 3.14+
- [uv](https://github.com/astral-sh/uv) package manager

### Installation

```bash
# Install dependencies
uv sync

# Install dev dependencies (includes ruff, mypy, pre-commit)
uv sync --extra dev

# Install pre-commit hooks
uv run pre-commit install
```

### Running Locally

```bash
# Run the server
uv run uvicorn app.main:app --reload --port 8001

# Or use the provided script
./tool.sh
```

### Code Quality

This project uses modern Python tooling for code quality:

- **ruff**: Fast Python linter and formatter (replaces black, isort, flake8)
- **mypy**: Static type checker
- **pre-commit**: Git hooks for automated checks

#### Running Checks Manually

```bash
# Run linter
uv run ruff check app/

# Run linter with auto-fix
uv run ruff check --fix app/

# Run formatter
uv run ruff format app/

# Run type checker
uv run mypy app/

# Run all pre-commit hooks
uv run pre-commit run --all-files
```

#### Pre-commit Hooks

Pre-commit hooks run automatically on `git commit`. They will:

1. Run ruff linter with auto-fix
2. Run ruff formatter
3. Check for trailing whitespace
4. Fix end of files
5. Validate YAML, JSON, TOML files
6. Check for large files
7. Check for merge conflicts
8. Run mypy type checker

To skip hooks (not recommended):

```bash
git commit --no-verify
```

### Configuration

Configuration is managed through:

- `pyproject.toml`: Project metadata, dependencies, and tool configurations
- `.pre-commit-config.yaml`: Pre-commit hook configurations
- `app/core/config.py`: Application settings
- `app/core/constants.py`: Language and voice constants

## API Endpoints

### Public Endpoints (No Auth Required)

- `GET /api/v1/languages` - Get supported languages
- `GET /api/v1/voices-by-language` - Get voices grouped by language
- `GET /api/v1/parameters` - Get parameter ranges

### Protected Endpoints (Auth Required)

- `GET /api/v1/voices` - Get all 322 voices from edge-tts
- `POST /api/v1/tts` - Convert text to speech

## Docker

```bash
# Build image
docker build -t voice-api .

# Run container
docker-compose up -d
```

## Project Structure

```
voice-api/
├── app/
│   ├── api/
│   │   ├── routes/          # API route modules
│   │   │   ├── language.py  # Language endpoints
│   │   │   ├── parameter.py # Parameter endpoints
│   │   │   ├── voice.py     # Voice endpoints
│   │   │   └── tts.py       # TTS endpoints
│   │   ├── schemas/         # Pydantic schemas
│   │   │   ├── language.py  # Language schemas
│   │   │   ├── parameter.py # Parameter schemas
│   │   │   ├── voice.py     # Voice schemas
│   │   │   └── tts.py       # TTS schemas
│   │   └── dependencies.py  # FastAPI dependencies
│   ├── core/
│   │   ├── config.py        # App configuration
│   │   └── constants.py     # Language/voice constants
│   ├── services/
│   │   ├── auth.py          # Authentication service
│   │   └── tts.py           # TTS service
│   └── main.py              # FastAPI app
├── pyproject.toml           # Project config & dependencies
├── .pre-commit-config.yaml  # Pre-commit hooks
└── Dockerfile               # Docker configuration
```

## Contributing

1. Install pre-commit hooks: `uv run pre-commit install`
2. Make your changes
3. Run checks: `uv run pre-commit run --all-files`
4. Commit your changes (hooks will run automatically)
5. Submit a pull request

## License

MIT
