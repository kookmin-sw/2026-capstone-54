import os


_TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))
_DEFAULT_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(_TOOLS_DIR)))
_ENV_PROJECT_ROOT = os.environ.get("PROJECT_ROOT", "").strip()

if _ENV_PROJECT_ROOT:
    PROJECT_ROOT = _ENV_PROJECT_ROOT
elif os.environ.get("IN_DOCKER") == "1":
    PROJECT_ROOT = "/app"
else:
    PROJECT_ROOT = _DEFAULT_PROJECT_ROOT
