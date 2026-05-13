"""
MeFit Tools GUI - Streamlit Dashboard
"""

import time
from datetime import datetime

import streamlit as st

from config import QUICK_LINKS, get_all_projects, get_project
from mefit_gui.docker_ops import get_docker_engine_diagnostics
from mefit_gui.dashboard import render_all_projects_view, render_single_project_view
from mefit_gui.logs_view import render_logs_css, render_logs_workspace


def _render_base_css() -> None:
    st.markdown(
        """
    <style>
    .main-header {
        font-size: 2rem;
        font-weight: bold;
        color: #1E88E5;
        padding: 1rem 0;
    }
    .project-card {
        background-color: #f8f9fa;
        border-radius: 10px;
        padding: 1rem;
        margin: 0.5rem 0;
        border-left: 4px solid #1E88E5;
    }
    .status-running { color: #4CAF50; font-weight: bold; }
    .status-stopped { color: #9E9E9E; font-weight: bold; }
    .status-error { color: #F44336; font-weight: bold; }
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
    }
    .stTabs [data-baseweb="tab"] {
        padding: 10px 20px;
    }
    </style>
    """,
        unsafe_allow_html=True,
    )


def _render_sidebar() -> tuple[str, bool, int, str]:
    with st.sidebar:
        st.header("⚙️ Settings")

        if "view_mode" not in st.session_state:
            st.session_state["view_mode"] = "Dashboard"
        pending_view_mode = st.session_state.pop("pending_view_mode", None)
        if pending_view_mode in {"Dashboard", "Logs"}:
            st.session_state["view_mode"] = pending_view_mode

        view_mode = st.radio(
            "View",
            options=["Dashboard", "Logs"],
            key="view_mode",
            horizontal=True,
        )

        st.divider()

        diagnostics = get_docker_engine_diagnostics()
        docker_ok = diagnostics.get("docker") == "ok"
        compose_ok = diagnostics.get("compose") != "not_found"
        diag_badge = "🟢" if docker_ok and compose_ok else "🔴"
        st.caption(
            f"{diag_badge} Docker: `{diagnostics.get('docker')}` | Context: `{diagnostics.get('context')}`"
        )
        st.caption(f"Compose: `{diagnostics.get('compose')}`")
        st.caption(f"PROJECT_ROOT: `{diagnostics.get('project_root')}`")

        st.divider()

        selected_project = "All"
        if view_mode == "Dashboard":
            selected_project = st.selectbox(
                "📁 Select Project",
                options=["All"] + [p.name for p in get_all_projects()],
                key="selected_project",
                format_func=lambda x: "All Projects"
                if x == "All"
                else get_project(x).display_name,
            )
        else:
            st.caption(
                "Logs 모드에서는 아래 Workspace에서 프로젝트/서비스를 선택합니다."
            )

        st.divider()

        auto_refresh = st.checkbox("🔄 Auto Refresh (10s)")
        refresh_interval = 10 if auto_refresh else 0

        st.divider()
        st.subheader("🔗 Quick Links")
        for name, url in QUICK_LINKS.items():
            st.markdown(f"[{name}]({url})")

        st.divider()
        with st.expander("ℹ️ Help"):
            st.markdown(
                """
            **사용법:**
            1. 프로젝트 선택 또는 전체 보기
            2. Start/Stop 버튼으로 제어
            3. 로그 확인은 Logs 모드 참고

            **상태 표시:**
            - 🟢 RUNNING: 실행 중
            - ⚪ STOPPED: 중지됨
            - 🔴 ERROR: 오류 발생
            """
            )

    return selected_project, auto_refresh, refresh_interval, view_mode


def main() -> None:
    st.set_page_config(
        page_title="MeFit Tools Dashboard",
        page_icon="🚀",
        layout="wide",
        initial_sidebar_state="expanded",
    )

    _render_base_css()
    render_logs_css()

    st.markdown(
        '<p class="main-header">🚀 MeFit Tools Dashboard</p>', unsafe_allow_html=True
    )
    st.markdown(f"_{datetime.now().strftime('%Y-%m-%d %H:%M:%S')} 기준_")

    selected_project, auto_refresh, refresh_interval, view_mode = _render_sidebar()

    if view_mode == "Logs":
        render_logs_workspace(selected_project)
    else:
        if selected_project == "All":
            render_all_projects_view()
        else:
            render_single_project_view(selected_project)

    if auto_refresh:
        time.sleep(refresh_interval)
        st.rerun()


if __name__ == "__main__":
    main()
