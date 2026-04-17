import re
import time
from html import escape
from typing import List, Optional, Tuple

import streamlit as st

from config import get_all_projects, get_project
from .docker_ops import get_container_logs


def open_service_logs(project_name: str, service_name: str) -> None:
    st.session_state["pending_selected_project"] = project_name
    st.session_state["pending_log_focus_service"] = service_name
    st.session_state["pending_view_mode"] = "Logs"
    st.rerun()


def _filter_log_lines(
    logs: str, query: str, case_sensitive: bool, regex_enabled: bool
) -> Tuple[str, int]:
    if not query.strip():
        total = len(logs.splitlines()) if logs else 0
        return logs, total

    lines = logs.splitlines()
    if regex_enabled:
        flags = 0 if case_sensitive else re.IGNORECASE
        try:
            pattern = re.compile(query, flags)
            filtered = [line for line in lines if pattern.search(line)]
        except re.error as e:
            return f"[Regex Error] {e}\n\n{logs}", 0
    else:
        needle = query if case_sensitive else query.lower()
        filtered = []
        for line in lines:
            source = line if case_sensitive else line.lower()
            if needle in source:
                filtered.append(line)

    return "\n".join(filtered), len(filtered)


def _detect_log_level(line: str) -> Optional[str]:
    match = re.search(
        r"\b(ERROR|WARN(?:ING)?|INFO|DEBUG|TRACE|CRITICAL|FATAL)\b", line, re.IGNORECASE
    )
    if not match:
        return None
    raw = match.group(1).upper()
    if raw == "WARNING":
        return "WARN"
    if raw == "FATAL":
        return "CRITICAL"
    return raw


def _render_highlighted_logs(logs: str) -> str:
    class_map = {
        "ERROR": "log-error",
        "WARN": "log-warn",
        "INFO": "log-info",
        "DEBUG": "log-debug",
        "TRACE": "log-trace",
        "CRITICAL": "log-critical",
    }

    rendered_lines: List[str] = []
    for line in logs.splitlines():
        safe_line = escape(line)
        level = _detect_log_level(line)
        css_class = class_map.get(level or "")
        if css_class:
            rendered_lines.append(f'<span class="{css_class}">{safe_line}</span>')
        else:
            rendered_lines.append(safe_line)

    # markdown/html 렌더링 경로에서 개행이 한 줄로 붙는 문제를 방지하기 위해
    # 명시적으로 <br/> 라인을 사용한다.
    return "<br/>".join(rendered_lines)


def render_logs_css() -> None:
    st.markdown(
        """
    <style>
    .logs-box {
        height: 520px;
        overflow-y: auto;
        background-color: #0E1117;
        color: #FAFAFA;
        border-radius: 6px;
        border: 1px solid #262730;
        padding: 0.75rem;
    }
    .logs-content {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
        font-family: "Source Code Pro", Menlo, Monaco, Consolas, "Courier New", monospace;
        font-size: 0.83rem;
        line-height: 1.35;
    }
    .log-error { color: #FF6B6B; font-weight: 700; }
    .log-warn { color: #FFD166; font-weight: 700; }
    .log-info { color: #4DABF7; }
    .log-debug { color: #B197FC; }
    .log-trace { color: #94D82D; }
    .log-critical { color: #FF8787; font-weight: 800; }
    </style>
    """,
        unsafe_allow_html=True,
    )


def render_logs_panel(
    project_name: str,
    service_name: str,
    lines: int,
    search_query: str,
    case_sensitive: bool,
    regex_enabled: bool,
    highlight_levels: bool,
) -> None:
    logs = get_container_logs(project_name, service_name, lines)
    filtered_logs, match_count = _filter_log_lines(
        logs, search_query, case_sensitive, regex_enabled
    )
    total_lines = len(logs.splitlines()) if logs else 0

    st.caption(f"Total lines: {total_lines} / Matches: {match_count}")

    view_logs = filtered_logs[-12000:] if len(filtered_logs) > 12000 else filtered_logs
    if highlight_levels:
        highlighted_html = _render_highlighted_logs(view_logs)
        st.markdown(
            f'<div class="logs-box"><div class="logs-content">{highlighted_html}</div></div>',
            unsafe_allow_html=True,
        )
    else:
        st.text_area(
            "Logs",
            value=view_logs,
            height=520,
            key=f"logs_text_{project_name}_{service_name}",
            disabled=True,
        )

    st.download_button(
        label="⬇️ Download logs",
        data=filtered_logs,
        file_name=f"{project_name}_{service_name}_logs.txt",
        mime="text/plain",
        key=f"download_logs_{project_name}_{service_name}",
    )


def render_logs_workspace(selected_project: str) -> None:
    st.markdown("### 📜 Logs Workspace")

    all_projects = get_all_projects()
    project_names = [p.name for p in all_projects]

    pending_project = st.session_state.pop("pending_selected_project", None)
    if pending_project and pending_project in project_names:
        st.session_state["logs_project_selector"] = pending_project

    default_project = (
        selected_project if selected_project in project_names else project_names[0]
    )
    if "logs_project_selector" not in st.session_state:
        st.session_state["logs_project_selector"] = default_project

    logs_project = st.selectbox(
        "Project",
        options=project_names,
        key="logs_project_selector",
        format_func=lambda x: get_project(x).display_name,
    )

    project_info = get_project(logs_project)
    service_options = [s.name for s in project_info.services] if project_info else []
    service_display = (
        {s.name: s.display_name for s in project_info.services} if project_info else {}
    )

    pending_service = st.session_state.pop("pending_log_focus_service", None)
    if pending_service and pending_service in service_options:
        st.session_state["logs_service_selector"] = pending_service

    if (
        "logs_service_selector" not in st.session_state
        or st.session_state.get("logs_service_selector") not in service_options
    ):
        st.session_state["logs_service_selector"] = (
            service_options[0] if service_options else ""
        )

    logs_service = st.selectbox(
        "Service",
        options=service_options,
        key="logs_service_selector",
        format_func=lambda name: service_display.get(name, name),
    )

    ctl1, ctl2, ctl3, ctl4 = st.columns([1.2, 1.2, 1.2, 1.4])
    with ctl1:
        lines = st.selectbox(
            "Lines", [50, 100, 200, 500, 1000], index=2, key="logs_lines"
        )
    with ctl2:
        follow = st.checkbox("Follow", value=False, key="logs_follow")
    with ctl3:
        refresh_every = st.selectbox(
            "Refresh(sec)", [2, 5, 10, 15], index=1, key="logs_refresh_every"
        )
    with ctl4:
        if st.button("🔄 Refresh Now", key="logs_refresh_now"):
            st.rerun()

    search_col1, search_col2, search_col3 = st.columns([3, 1, 1])
    with search_col1:
        search_query = st.text_input(
            "Search",
            value="",
            key="logs_search_query",
            placeholder="키워드 또는 정규식 입력",
        )
    with search_col2:
        case_sensitive = st.checkbox("Case", value=False, key="logs_case_sensitive")
    with search_col3:
        regex_enabled = st.checkbox("Regex", value=False, key="logs_regex_enabled")

    highlight_levels = st.checkbox(
        "🎨 Highlight log levels", value=True, key="logs_highlight_levels"
    )

    if logs_project and logs_service:
        render_logs_panel(
            logs_project,
            logs_service,
            lines,
            search_query,
            case_sensitive,
            regex_enabled,
            highlight_levels,
        )

    if follow:
        time.sleep(refresh_every)
        st.rerun()
