#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="${SCRIPT_DIR}"
OUT_DIR="${ROOT_DIR}/out"

SUBDIRS=(
  "activity_diagrams"
  "class_diagrams"
  "sequence_diagrams"
  "component_diagrams"
  "usecase_diagrams"
  "mindmaps"
  "gantt"
)

CLEAN=0
ONLY=""
FORMAT="all"

print_help() {
  cat <<'EOF'
MeFit Diagrams — PUML to PNG + PDF.

Usage:
  ./generate.sh                        all subdirs (PNG + SVG + PDF)
  ./generate.sh --clean                clean out/ first
  ./generate.sh --only <subdir>        only one subdir
  ./generate.sh --format png|pdf|all   output format (default: all)
  ./generate.sh --help

Dependencies:
  plantuml          (brew install plantuml)
  rsvg-convert      (brew install librsvg)        SVG -> PDF (preferred)
  inkscape          (brew install inkscape)       SVG -> PDF (alt)
  imagemagick       (brew install imagemagick)    PNG -> PDF (fallback)
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --clean) CLEAN=1; shift ;;
    --only) ONLY="$2"; shift 2 ;;
    --format) FORMAT="$2"; shift 2 ;;
    -h|--help) print_help; exit 0 ;;
    *) echo "Unknown option: $1" >&2; print_help >&2; exit 1 ;;
  esac
done

case "${FORMAT}" in
  all|png|pdf) ;;
  *) echo "Invalid --format: ${FORMAT} (allowed: all, png, pdf)" >&2; exit 1 ;;
esac

if [[ -t 1 ]]; then
  RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[1;33m'
  BLUE=$'\033[0;34m'; CYAN=$'\033[0;36m'; NC=$'\033[0m'
else
  RED=""; GREEN=""; YELLOW=""; BLUE=""; CYAN=""; NC=""
fi

log_info() { printf "%s[INFO]%s %s\n" "${BLUE}" "${NC}" "$*"; }
log_ok()   { printf "%s[ OK ]%s %s\n" "${GREEN}" "${NC}" "$*"; }
log_warn() { printf "%s[WARN]%s %s\n" "${YELLOW}" "${NC}" "$*"; }
log_err()  { printf "%s[ERR ]%s %s\n" "${RED}" "${NC}" "$*"; }
log_head() { printf "%s%s%s\n" "${CYAN}" "$*" "${NC}"; }

PDF_TOOL=""

resolve_pdf_tool() {
  if [[ "${FORMAT}" == "png" ]]; then
    PDF_TOOL="none"
    return
  fi
  if command -v rsvg-convert &>/dev/null; then
    PDF_TOOL="rsvg"
  elif command -v inkscape &>/dev/null; then
    PDF_TOOL="inkscape"
  elif command -v magick &>/dev/null; then
    PDF_TOOL="magick"
  elif command -v convert &>/dev/null; then
    PDF_TOOL="convert"
  fi
}

check_deps() {
  if ! command -v plantuml &>/dev/null; then
    log_err "plantuml not found. Install: brew install plantuml"
    exit 1
  fi
  log_ok "plantuml: $(plantuml -version 2>&1 | head -1)"

  resolve_pdf_tool

  case "${PDF_TOOL}" in
    rsvg)     log_ok "PDF tool: rsvg-convert (SVG -> PDF, vector)" ;;
    inkscape) log_ok "PDF tool: inkscape (SVG -> PDF, vector)" ;;
    magick)   log_warn "PDF tool: ImageMagick magick (PNG -> PDF, raster)" ;;
    convert)  log_warn "PDF tool: ImageMagick convert (PNG -> PDF, raster)" ;;
    none)     ;;
    "")
      log_err "No PDF conversion tool found."
      log_err "  Recommended: brew install librsvg"
      log_err "  Alternative: brew install inkscape"
      log_err "  Fallback   : brew install imagemagick"
      exit 1
      ;;
  esac
}

is_vector_pdf_tool() {
  [[ "${PDF_TOOL}" == "rsvg" || "${PDF_TOOL}" == "inkscape" ]]
}

is_raster_pdf_tool() {
  [[ "${PDF_TOOL}" == "magick" || "${PDF_TOOL}" == "convert" ]]
}

format_includes_png() {
  [[ "${FORMAT}" == "all" || "${FORMAT}" == "png" ]]
}

format_includes_pdf() {
  [[ "${FORMAT}" == "all" || "${FORMAT}" == "pdf" ]]
}

format_includes_svg() {
  [[ "${FORMAT}" == "all" ]]
}

svg_to_pdf() {
  local svg="$1" pdf="$2"
  case "${PDF_TOOL}" in
    rsvg)     rsvg-convert -f pdf -o "${pdf}" "${svg}" ;;
    inkscape) inkscape "${svg}" --export-type=pdf --export-filename="${pdf}" >/dev/null 2>&1 ;;
    *) return 1 ;;
  esac
}

png_to_pdf() {
  local png="$1" pdf="$2"
  case "${PDF_TOOL}" in
    magick)  magick "${png}" "${pdf}" ;;
    convert) convert "${png}" "${pdf}" ;;
    *) return 1 ;;
  esac
}

render_png() {
  plantuml -tpng -charset UTF-8 -o "$2" "$1"
}

render_svg() {
  plantuml -tsvg -charset UTF-8 -o "$2" "$1"
}

ensure_png() {
  local puml="$1" out_subdir="$2" base="$3"
  local png="${out_subdir}/${base}.png"
  [[ -f "${png}" ]] && return 0
  render_png "${puml}" "${out_subdir}" >/dev/null 2>&1
}

ensure_svg() {
  local puml="$1" out_subdir="$2" base="$3"
  local svg="${out_subdir}/${base}.svg"
  [[ -f "${svg}" ]] && return 0
  render_svg "${puml}" "${out_subdir}" >/dev/null 2>&1
}

process_puml() {
  local puml="$1" subdir="$2"
  local out_subdir="${OUT_DIR}/${subdir}"
  local base
  base="$(basename "${puml}" .puml)"
  local rel_out="${out_subdir#${ROOT_DIR}/}"

  mkdir -p "${out_subdir}"

  if format_includes_png; then
    if render_png "${puml}" "${out_subdir}" 2>/tmp/puml_err.$$; then
      log_ok "  PNG: ${rel_out}/${base}.png"
    else
      log_err "  PNG failed: ${puml#${ROOT_DIR}/}"
      cat /tmp/puml_err.$$ >&2 || true
      rm -f /tmp/puml_err.$$
      return 1
    fi
    rm -f /tmp/puml_err.$$
  fi

  if format_includes_svg || (format_includes_pdf && is_vector_pdf_tool); then
    if render_svg "${puml}" "${out_subdir}" 2>/tmp/puml_err.$$; then
      format_includes_svg && log_ok "  SVG: ${rel_out}/${base}.svg"
    else
      format_includes_pdf && log_warn "  SVG failed; will try raster fallback"
      cat /tmp/puml_err.$$ >&2 || true
    fi
    rm -f /tmp/puml_err.$$
  fi

  if format_includes_pdf; then
    local ok=0
    local svg="${out_subdir}/${base}.svg"
    local png="${out_subdir}/${base}.png"
    local pdf="${out_subdir}/${base}.pdf"

    if is_vector_pdf_tool && [[ -f "${svg}" ]]; then
      if svg_to_pdf "${svg}" "${pdf}" 2>/tmp/pdf_err.$$; then
        log_ok "  PDF: ${rel_out}/${base}.pdf (vector)"
        ok=1
      fi
    fi

    if (( ok == 0 )) && is_raster_pdf_tool; then
      ensure_png "${puml}" "${out_subdir}" "${base}" || true
      if [[ -f "${png}" ]] && png_to_pdf "${png}" "${pdf}" 2>/tmp/pdf_err.$$; then
        log_ok "  PDF: ${rel_out}/${base}.pdf (raster)"
        ok=1
      fi
    fi

    if (( ok == 0 )); then
      log_err "  PDF failed: ${puml#${ROOT_DIR}/}"
      cat /tmp/pdf_err.$$ >&2 || true
      rm -f /tmp/pdf_err.$$
      return 1
    fi
    rm -f /tmp/pdf_err.$$
  fi

  return 0
}

process_subdir() {
  local subdir="$1"
  local subdir_path="${ROOT_DIR}/${subdir}"

  if [[ ! -d "${subdir_path}" ]]; then
    log_warn "skip (missing): ${subdir}/"
    return 0
  fi

  local puml_files=()
  while IFS= read -r -d '' f; do
    puml_files+=("$f")
  done < <(find "${subdir_path}" -maxdepth 1 -type f -name "*.puml" -print0 | sort -z)

  if (( ${#puml_files[@]} == 0 )); then
    log_warn "skip (no .puml): ${subdir}/"
    return 0
  fi

  log_head "─────────────────────────────────────────────"
  log_head " ${subdir}/  (${#puml_files[@]} files)"
  log_head "─────────────────────────────────────────────"

  local sub_ok=0 sub_fail=0
  for puml in "${puml_files[@]}"; do
    log_info "▶ $(basename "${puml}")"
    if process_puml "${puml}" "${subdir}"; then
      sub_ok=$((sub_ok + 1))
    else
      sub_fail=$((sub_fail + 1))
    fi
  done

  TOTAL_FILES=$((TOTAL_FILES + sub_ok + sub_fail))
  TOTAL_OK=$((TOTAL_OK + sub_ok))
  TOTAL_FAIL=$((TOTAL_FAIL + sub_fail))
}

main() {
  log_head "═════════════════════════════════════════════"
  log_head " MeFit Diagrams — Build"
  log_head "═════════════════════════════════════════════"
  log_info "Root  : ${ROOT_DIR}"
  log_info "Out   : ${OUT_DIR}"
  log_info "Format: ${FORMAT}"
  [[ -n "${ONLY}" ]] && log_info "Only  : ${ONLY}"

  check_deps

  if (( CLEAN == 1 )) && [[ -d "${OUT_DIR}" ]]; then
    log_warn "cleaning ${OUT_DIR}"
    rm -rf "${OUT_DIR}"
  fi
  mkdir -p "${OUT_DIR}"

  TOTAL_FILES=0
  TOTAL_OK=0
  TOTAL_FAIL=0

  if [[ -n "${ONLY}" ]]; then
    process_subdir "${ONLY}"
  else
    for subdir in "${SUBDIRS[@]}"; do
      process_subdir "${subdir}"
    done
  fi

  log_head "═════════════════════════════════════════════"
  log_head " Done"
  log_head "═════════════════════════════════════════════"
  log_info "Total : ${TOTAL_FILES}"
  log_ok   "OK    : ${TOTAL_OK}"
  if (( TOTAL_FAIL > 0 )); then
    log_err  "Fail  : ${TOTAL_FAIL}"
    log_info "Out   : ${OUT_DIR}"
    exit 1
  fi
  log_info "Fail  : 0"
  log_info "Out   : ${OUT_DIR}"
}

main "$@"
