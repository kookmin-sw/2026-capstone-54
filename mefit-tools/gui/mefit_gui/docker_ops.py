import os
import shutil
import subprocess
import time
from collections import defaultdict
from typing import Dict, List, Optional, Set, Tuple

import pandas as pd

from .constants import PROJECT_ROOT
from config import get_all_projects, get_project


_COMPOSE_CMD_CACHE: Optional[List[str]] = None


def _should_try_next_compose(stderr: str) -> bool:
    lower = (stderr or "").lower()
    fallback_markers = [
        "is not a docker command",
        "unknown command",
        "command not found",
        "no such file or directory",
        "compose plugin",
    ]
    return any(marker in lower for marker in fallback_markers)


def _set_compose_cache(compose_cmd: List[str]) -> None:
    global _COMPOSE_CMD_CACHE
    _COMPOSE_CMD_CACHE = compose_cmd


def _get_compose_candidates() -> List[List[str]]:
    global _COMPOSE_CMD_CACHE

    candidates: List[List[str]] = []
    if _COMPOSE_CMD_CACHE:
        candidates.append(_COMPOSE_CMD_CACHE)

    if shutil.which("docker"):
        candidates.append(["docker", "compose"])
    if shutil.which("docker-compose"):
        candidates.append(["docker-compose"])

    unique: List[List[str]] = []
    seen: Set[str] = set()
    for cmd in candidates:
        key = " ".join(cmd)
        if key not in seen:
            seen.add(key)
            unique.append(cmd)

    return unique


def run_docker_compose(
    project_dir: str, command: List[str], timeout: int = 30
) -> Tuple[str, str, int]:
    compose_candidates = _get_compose_candidates()
    if not compose_candidates:
        return "", "docker compose command not found", 1

    last_stdout = ""
    last_stderr = ""
    last_code = 1

    for compose_cmd in compose_candidates:
        try:
            result = subprocess.run(
                compose_cmd + command,
                cwd=project_dir,
                capture_output=True,
                text=True,
                timeout=timeout,
            )
            if result.returncode == 0:
                _set_compose_cache(compose_cmd)
                return result.stdout, result.stderr, result.returncode

            last_stdout, last_stderr, last_code = (
                result.stdout,
                result.stderr,
                result.returncode,
            )
            if not _should_try_next_compose(result.stderr):
                return result.stdout, result.stderr, result.returncode
        except subprocess.TimeoutExpired:
            return "", "Command timed out", 1
        except Exception as e:
            last_stderr = str(e)
            last_code = 1

    return last_stdout, last_stderr, last_code


def get_docker_engine_diagnostics() -> Dict[str, str]:
    diagnostics = {
        "docker": "unknown",
        "context": "unknown",
        "compose": "not_found",
        "project_root": PROJECT_ROOT,
    }

    try:
        docker_info = subprocess.run(
            ["docker", "info"], capture_output=True, text=True, timeout=8
        )
        diagnostics["docker"] = "ok" if docker_info.returncode == 0 else "error"
    except Exception as e:
        diagnostics["docker"] = f"error: {e}"

    try:
        context = subprocess.run(
            ["docker", "context", "show"], capture_output=True, text=True, timeout=5
        )
        if context.returncode == 0:
            diagnostics["context"] = context.stdout.strip() or "default"
        else:
            diagnostics["context"] = "error"
    except Exception as e:
        diagnostics["context"] = f"error: {e}"

    for candidate in _get_compose_candidates():
        try:
            result = subprocess.run(
                candidate + ["version"], capture_output=True, text=True, timeout=5
            )
            if result.returncode == 0:
                diagnostics["compose"] = " ".join(candidate)
                _set_compose_cache(candidate)
                break
        except Exception:
            continue

    return diagnostics


def _normalize_compose_state(state: str) -> str:
    normalized = (state or "").strip().lower()
    if normalized == "running":
        return "running"
    if normalized == "restarting":
        return "restarting"
    if normalized in {"created", "exited", "dead", "paused"}:
        return "stopped"
    if not normalized:
        return "not_found"
    return "error"


def get_project_containers(
    project_name: str,
) -> Tuple[List[Dict[str, str]], Optional[str]]:
    project_dir = os.path.join(PROJECT_ROOT, project_name)
    if not os.path.exists(project_dir):
        return [], f"Project directory not found: {project_dir}"

    output, error, returncode = run_docker_compose(
        project_dir, ["ps", "--all", "--format", "json"]
    )
    if returncode != 0:
        return [], (error or output or "Failed to read compose containers").strip()

    if not output.strip():
        return [], None

    containers: List[Dict[str, str]] = []
    for line in output.strip().split("\n"):
        if not line.strip():
            continue
        try:
            import json

            data = json.loads(line)
        except Exception:
            continue

        state = str(data.get("State", "")).lower()
        containers.append(
            {
                "name": data.get("Name") or data.get("Names") or "-",
                "service": data.get("Service") or "-",
                "state": state or "unknown",
                "status": data.get("Status") or "-",
                "id": (data.get("ID") or "")[:12],
                "ui_status": _normalize_compose_state(state),
            }
        )

    containers.sort(key=lambda x: (x.get("service", ""), x.get("name", "")))
    return containers, None


def get_project_status(project_name: str) -> Dict[str, Dict]:
    project = get_project(project_name)
    if not project:
        return {}

    containers, error = get_project_containers(project_name)
    if error:
        return {
            service.name: {
                "status": "error",
                "container_id": "",
                "created": "",
                "state": error,
            }
            for service in project.services
        }

    grouped: Dict[str, List[Dict[str, str]]] = defaultdict(list)
    for container in containers:
        grouped[container.get("service", "")].append(container)

    statuses: Dict[str, Dict[str, str]] = {}
    priority = {"running": 5, "restarting": 4, "stopped": 3, "not_found": 2, "error": 1}

    for service in project.services:
        service_containers = grouped.get(service.name, [])
        if not service_containers:
            statuses[service.name] = {
                "status": "not_found",
                "container_id": "",
                "created": "",
                "state": "Service not found in compose output",
            }
            continue

        service_containers.sort(
            key=lambda c: priority.get(c.get("ui_status", "error"), 0), reverse=True
        )
        top = service_containers[0]
        statuses[service.name] = {
            "status": top.get("ui_status", "error"),
            "container_id": top.get("id", ""),
            "created": "",
            "state": top.get("status") or top.get("state") or "",
        }

    return statuses


def get_all_projects_status() -> Dict[str, Dict[str, Dict]]:
    return {
        project.name: get_project_status(project.name) for project in get_all_projects()
    }


def get_docker_stats(container_filter: str = "") -> pd.DataFrame:
    try:
        result = subprocess.run(
            [
                "docker",
                "stats",
                "--no-stream",
                "--format",
                "{{.Container}},{{.Name}},{{.CPUPerc}},{{.MemUsage}},{{.MemPerc}},{{.NetIO}},{{.BlockIO}}",
            ],
            capture_output=True,
            text=True,
            timeout=10,
        )
        if result.returncode != 0:
            return pd.DataFrame()

        data = []
        for line in result.stdout.strip().split("\n"):
            if not line:
                continue
            parts = line.split(",")
            if len(parts) >= 6:
                name = parts[1]
                if container_filter and container_filter not in name:
                    continue
                data.append(
                    {
                        "Container": parts[0][:12],
                        "Name": name,
                        "CPU": parts[2],
                        "Memory Usage": parts[3],
                        "Memory %": parts[4],
                        "Net I/O": parts[5],
                        "Block I/O": parts[6] if len(parts) > 6 else "",
                    }
                )

        return pd.DataFrame(data)
    except Exception:
        return pd.DataFrame()


def get_container_logs(project_name: str, service_name: str, lines: int = 50) -> str:
    project_dir = os.path.join(PROJECT_ROOT, project_name)
    if not os.path.exists(project_dir):
        return f"Error: Project directory not found: {project_dir}"

    output, error, returncode = run_docker_compose(
        project_dir, ["logs", "--tail", str(lines), service_name], timeout=15
    )
    return output if returncode == 0 else f"Error: {error or output}"


def start_project(project_name: str) -> Tuple[bool, str]:
    subprocess.run(["docker", "network", "create", "mefit-local"], capture_output=True)
    project_dir = os.path.join(PROJECT_ROOT, project_name)
    if not os.path.exists(project_dir):
        return False, f"Project directory not found: {project_dir}"

    output, error, returncode = run_docker_compose(project_dir, ["up", "-d"])
    if returncode == 0:
        time.sleep(2)
        return True, "Started successfully"
    return False, error or output


def stop_project(project_name: str) -> Tuple[bool, str]:
    project_dir = os.path.join(PROJECT_ROOT, project_name)
    if not os.path.exists(project_dir):
        return False, f"Project directory not found: {project_dir}"

    output, error, returncode = run_docker_compose(project_dir, ["down"])
    if returncode == 0:
        return True, "Stopped successfully"
    return False, error or output


def restart_project(project_name: str) -> Tuple[bool, str]:
    ok, _ = stop_project(project_name)
    if ok:
        time.sleep(1)
        return start_project(project_name)
    return False, "Failed to stop project"


def start_service(project_name: str, service_name: str) -> Tuple[bool, str]:
    project_dir = os.path.join(PROJECT_ROOT, project_name)
    if not os.path.exists(project_dir):
        return False, f"Project directory not found: {project_dir}"

    output, error, returncode = run_docker_compose(
        project_dir, ["up", "-d", service_name]
    )
    if returncode == 0:
        return True, f"Service '{service_name}' started"
    return False, error or output


def stop_service(project_name: str, service_name: str) -> Tuple[bool, str]:
    project_dir = os.path.join(PROJECT_ROOT, project_name)
    if not os.path.exists(project_dir):
        return False, f"Project directory not found: {project_dir}"

    output, error, returncode = run_docker_compose(project_dir, ["stop", service_name])
    if returncode == 0:
        return True, f"Service '{service_name}' stopped"
    return False, error or output
