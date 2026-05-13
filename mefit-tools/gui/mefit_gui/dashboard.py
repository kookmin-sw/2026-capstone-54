from datetime import datetime
from typing import Dict, Optional, Set

import streamlit as st

from config import QUICK_LINKS, ProjectInfo, get_all_projects, get_project
from .docker_ops import (
    get_all_projects_status,
    get_docker_stats,
    get_project_containers,
    get_project_status,
    restart_project,
    start_project,
    start_service,
    stop_project,
    stop_service,
)
from .logs_view import open_service_logs


def render_status_badge(status: str) -> str:
    icons = {
        "running": "🟢",
        "stopped": "⚪",
        "not_found": "⚫",
        "error": "🔴",
        "restarting": "🟡",
    }
    labels = {
        "running": "RUNNING",
        "stopped": "STOPPED",
        "not_found": "NOT FOUND",
        "error": "ERROR",
        "restarting": "RESTARTING",
    }
    icon = icons.get(status, "❓")
    label = labels.get(status, status.upper())
    return f"{icon} {label}"


def render_service_card(project: ProjectInfo, statuses: Dict[str, Dict]) -> None:
    for service in project.services:
        status = statuses.get(service.name, {})
        status_text = status.get("status", "not_found")

        col1, col2, col3, col4 = st.columns([3, 1, 1, 1])
        with col1:
            st.markdown(f"**{service.display_name}**")
            st.caption(service.name)
        with col2:
            st.markdown(render_status_badge(status_text))
        with col3:
            if service.port:
                st.write(f"Port: `{service.port}`")
        with col4:
            if service.url:
                st.markdown(f"[→ URL]({service.url})")
        st.divider()


def render_project_toggle(
    project: ProjectInfo, statuses: Dict[str, Dict]
) -> Optional[bool]:
    running_count = sum(1 for s in statuses.values() if s.get("status") == "running")
    total_count = len(project.services)
    is_running = running_count == total_count and total_count > 0

    col1, col2, col3 = st.columns([3, 1, 1])
    with col1:
        status_icon = "🟢" if is_running else "⚪"
        st.markdown(f"{status_icon} **{project.display_name}**")
        st.caption(project.description)

    with col2:
        if st.button("▶ Start", key=f"start_{project.name}", disabled=is_running):
            ok, msg = start_project(project.name)
            if ok:
                st.success("Started!")
                st.rerun()
            else:
                st.error(f"Failed: {msg}")
            return True

    with col3:
        if st.button("■ Stop", key=f"stop_{project.name}", disabled=not is_running):
            ok, msg = stop_project(project.name)
            if ok:
                st.success("Stopped!")
                st.rerun()
            else:
                st.error(f"Failed: {msg}")
            return True

    return None


def render_containers_expander(project: ProjectInfo) -> None:
    containers, error = get_project_containers(project.name)
    expander_label = f"🐳 Containers ({len(containers)}) - {project.display_name}"

    with st.expander(expander_label, expanded=False):
        top_col1, top_col2, top_col3 = st.columns([1, 1, 4])
        with top_col1:
            if st.button(
                "🔄", key=f"container_refresh_{project.name}", help="Refresh containers"
            ):
                st.rerun()
        with top_col2:
            if st.button(
                "▶ All",
                key=f"container_start_all_{project.name}",
                help="Start all services",
            ):
                ok, msg = start_project(project.name)
                if ok:
                    st.success(msg)
                    st.rerun()
                else:
                    st.error(msg)
        with top_col3:
            if st.button(
                "■ All",
                key=f"container_stop_all_{project.name}",
                help="Stop all services",
            ):
                ok, msg = stop_project(project.name)
                if ok:
                    st.success(msg)
                    st.rerun()
                else:
                    st.error(msg)

        if error:
            st.error(error)
            return
        if not containers:
            st.caption("No compose containers found")
            return

        seen_service_actions: Set[str] = set()
        for idx, container in enumerate(containers):
            col1, col2, col3, col4, col5 = st.columns([3, 2, 2, 2, 3])
            service_name = container["service"]
            ui_status = container["ui_status"]
            with col1:
                st.markdown(f"{render_status_badge(ui_status)} **{container['name']}**")
                st.caption(f"service: {service_name}")
            with col2:
                st.write(f"State: `{container['state']}`")
            with col3:
                st.write(f"ID: `{container['id'] or '-'} `")
            with col4:
                st.write(container["status"])
            with col5:
                btn_col1, btn_col2, btn_col3 = st.columns(3)
                already_rendered = service_name in seen_service_actions
                if not already_rendered:
                    seen_service_actions.add(service_name)

                with btn_col1:
                    if st.button(
                        "Start",
                        key=f"container_start_{project.name}_{idx}_{container['name']}",
                        help=f"Start {service_name}",
                        disabled=already_rendered or ui_status == "running",
                    ):
                        ok, msg = start_service(project.name, service_name)
                        if ok:
                            st.success(msg)
                            st.rerun()
                        else:
                            st.error(msg)
                with btn_col2:
                    if st.button(
                        "Stop",
                        key=f"container_stop_{project.name}_{idx}_{container['name']}",
                        help=f"Stop {service_name}",
                        disabled=already_rendered or ui_status != "running",
                    ):
                        ok, msg = stop_service(project.name, service_name)
                        if ok:
                            st.success(msg)
                            st.rerun()
                        else:
                            st.error(msg)
                with btn_col3:
                    if st.button(
                        "Logs",
                        key=f"container_logs_{project.name}_{idx}_{container['name']}",
                        help=f"Open logs for {service_name}",
                    ):
                        open_service_logs(project.name, service_name)

            if idx < len(containers) - 1:
                st.divider()


def render_all_projects_view() -> None:
    st.markdown("### 🔗 Quick Access")
    cols = st.columns(len(QUICK_LINKS))
    for idx, (name, url) in enumerate(QUICK_LINKS.items()):
        with cols[idx]:
            st.markdown(f"**{name}**")
            st.link_button("Open", url, type="secondary")

    st.divider()

    all_statuses = get_all_projects_status()
    running_projects = 0
    error_projects = 0
    total_projects = len(get_all_projects())

    for _, statuses in all_statuses.items():
        if statuses and all(s.get("status") == "running" for s in statuses.values()):
            running_projects += 1
        if statuses and any(s.get("status") == "error" for s in statuses.values()):
            error_projects += 1

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Total Projects", total_projects)
    with col2:
        st.metric(
            "Running", running_projects, delta=running_projects - total_projects // 2
        )
    with col3:
        st.metric("Stopped", total_projects - running_projects)
    with col4:
        st.metric("Error", error_projects)

    st.divider()

    for project in get_all_projects():
        statuses = all_statuses.get(project.name, {})
        with st.container():
            render_project_toggle(project, statuses)

            running_count = sum(
                1 for s in statuses.values() if s.get("status") == "running"
            )
            st.progress(
                running_count / len(project.services) if project.services else 0,
                text=f"{running_count}/{len(project.services)} services running",
            )
            render_containers_expander(project)
            st.divider()

    st.markdown("### 📊 Resource Usage")
    col1, col2 = st.columns([1, 4])
    with col1:
        if st.button("🔄 Refresh Stats", key="refresh_stats_all"):
            st.session_state["stats_last_refresh_all"] = datetime.now().strftime(
                "%H:%M:%S"
            )
            st.rerun()
    with col2:
        now = datetime.now().strftime("%H:%M:%S")
        st.caption(
            f"Last updated: {st.session_state.get('stats_last_refresh_all', now)}"
        )

    with st.expander("Show Docker Stats"):
        stats_df = get_docker_stats("mefit")
        if not stats_df.empty:
            st.dataframe(stats_df, use_container_width=True, hide_index=True)
        else:
            st.info("No containers running or docker stats unavailable")


def render_single_project_view(project_name: str) -> None:
    project = get_project(project_name)
    if not project:
        st.error(f"Project '{project_name}' not found")
        return

    statuses = get_project_status(project_name)

    col1, col2 = st.columns([3, 1])
    with col1:
        st.subheader(f"📁 {project.display_name}")
        st.caption(project.description)
    with col2:
        if st.button("🔄 Restart All", type="secondary"):
            ok, msg = restart_project(project_name)
            if ok:
                st.success("Restarted!")
                st.rerun()
            else:
                st.error(f"Failed: {msg}")

    st.divider()
    st.markdown("### 📋 Services")
    render_service_card(project, statuses)
    render_containers_expander(project)

    st.divider()
    st.markdown("### 📊 Resource Usage")
    col1, col2 = st.columns([1, 4])
    with col1:
        if st.button("🔄 Refresh Stats", key=f"refresh_stats_{project_name}"):
            st.session_state[f"stats_last_refresh_{project_name}"] = (
                datetime.now().strftime("%H:%M:%S")
            )
            st.rerun()
    with col2:
        now = datetime.now().strftime("%H:%M:%S")
        st.caption(
            f"Last updated: {st.session_state.get(f'stats_last_refresh_{project_name}', now)}"
        )

    stats_df = get_docker_stats(project_name)
    if not stats_df.empty:
        st.dataframe(stats_df, use_container_width=True, hide_index=True)
    else:
        st.info("No containers running")

    st.divider()
    st.info("서비스별 로그는 사이드바의 Logs 모드에서 확인하세요.")
