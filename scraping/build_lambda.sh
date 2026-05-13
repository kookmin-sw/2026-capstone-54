#!/bin/bash
# ============================================================
# Lambda 배포 패키지 빌드 스크립트
#
# 실행 환경: AWS CloudShell (Amazon Linux 2023)
#   → Lambda 런타임과 OS가 동일해서 바이너리 호환 보장
#
# 생성 결과물:
#   dist/function.zip      → Lambda 함수 코드 + Python 의존성
#   dist/chromium-layer.zip → Playwright Chromium 브라우저 바이너리
# ============================================================
set -e

echo "=============================="
echo "  Lambda 패키지 빌드 시작"
echo "=============================="

# ── 이전 빌드 결과 정리 ──────────────────────────────────────
rm -rf dist/
mkdir -p dist/function dist/layer

# ── uv 설치 ──────────────────────────────────────────────────
if ! command -v uv &> /dev/null; then
    echo "[1/5] uv 설치 중..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    source $HOME/.local/bin/env
else
    echo "[1/5] uv 이미 설치됨"
fi

# ── Python 의존성 설치 (Lambda 호환 Linux 바이너리) ───────────
echo "[2/5] Python 의존성 설치 중..."
uv export --no-dev --no-hashes -o /tmp/requirements.txt
pip install -r /tmp/requirements.txt \
    --target dist/function \
    --upgrade \
    --quiet

# ── 소스 코드 복사 ────────────────────────────────────────────
echo "[3/5] 소스 코드 복사 중..."
cp pipeline.py config.py lambda_handler.py dist/function/
cp -r extractors plugins utils dist/function/

# ── Chromium 브라우저 바이너리 설치 (레이어용) ────────────────
# PLAYWRIGHT_BROWSERS_PATH=dist/layer 로 설치하면
# 레이어 zip 내부 경로가 chromium-{version}/... 가 됨
# Lambda에서 레이어는 /opt/ 에 마운트되므로
# /opt/chromium-{version}/chrome-linux/chrome 로 접근 가능
echo "[4/5] Chromium 브라우저 설치 중 (시간이 걸릴 수 있습니다)..."
PLAYWRIGHT_BROWSERS_PATH=dist/layer playwright install chromium

# ── zip 압축 ────────────────────────────────────────────────
echo "[5/5] zip 압축 중..."

# 함수 패키지
cd dist/function
zip -r ../function.zip . -q
cd ../..

# Chromium 레이어 패키지
cd dist/layer
zip -r ../chromium-layer.zip . -q
cd ../..

# ── 결과 출력 ────────────────────────────────────────────────
echo ""
echo "=============================="
echo "  빌드 완료!"
echo "=============================="
echo ""
echo "  function.zip      : $(du -sh dist/function.zip | cut -f1)"
echo "  chromium-layer.zip: $(du -sh dist/chromium-layer.zip | cut -f1)"
echo ""
echo "다음 단계:"
echo "  1. [Actions] → [Download] 로 두 zip 파일을 로컬에 다운로드"
echo "  2. AWS Lambda 콘솔에서 레이어 생성 후 함수에 연결"
echo "  3. 환경 변수 설정: PLAYWRIGHT_BROWSERS_PATH=/opt"
