(() => {
  const tokenEl = document.getElementById('admin-token');
  if (!tokenEl) return;

  const checkBtn = document.getElementById('check-token');
  const statusOut = document.getElementById('status-output');
  const ingestBtn = document.getElementById('ingest-codebase');
  const watchBtn = document.getElementById('watch-progress');
  const ingestOut = document.getElementById('ingest-output');
  const maxFilesEl = document.getElementById('max-files');
  const dirsEl = document.getElementById('dirs');
  const docFileEl = document.getElementById('doc-file');
  const uploadBtn = document.getElementById('upload-doc');
  const uploadOut = document.getElementById('upload-output');
  const resetBtn = document.getElementById('reset-index');
  const resetOut = document.getElementById('reset-output');

  function token() {
    const t = tokenEl.value.trim();
    if (!t) {
      alert('관리자 토큰을 입력하세요.');
      throw new Error('no token');
    }
    return t;
  }

  function authHeaders(extra = {}) {
    return { 'X-Admin-Token': token(), ...extra };
  }

  async function fetchJson(url, opts = {}) {
    const res = await fetch(url, opts);
    const text = await res.text();
    let body;
    try { body = JSON.parse(text); } catch (_) { body = text; }
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}\n${typeof body === 'string' ? body : JSON.stringify(body, null, 2)}`);
    }
    return body;
  }

  checkBtn.addEventListener('click', async () => {
    statusOut.textContent = '확인 중...';
    try {
      const body = await fetchJson('/api/admin/status', { headers: authHeaders() });
      statusOut.textContent = JSON.stringify(body, null, 2);
    } catch (e) {
      statusOut.textContent = `❌ ${e.message}`;
    }
  });

  let pollTimer = null;

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  function startPolling() {
    stopPolling();
    pollTimer = setInterval(async () => {
      try {
        const body = await fetchJson('/api/admin/progress', { headers: authHeaders() });
        const lp = body.last_progress;
        if (lp) {
          ingestOut.textContent =
            `phase=${lp.phase}  (${lp.current}/${lp.total}  ${lp.pct}%)\n` +
            `message=${lp.message}\n` +
            (body.is_ingesting ? '🔄 진행 중...' : '✅ 종료');
        }
        if (!body.is_ingesting && lp && lp.phase === 'done') {
          stopPolling();
        }
      } catch (e) {
        ingestOut.textContent = `❌ ${e.message}`;
        stopPolling();
      }
    }, 1500);
  }

  ingestBtn.addEventListener('click', async () => {
    ingestOut.textContent = '코드베이스 적재를 백그라운드에서 시작합니다...';
    try {
      const max = maxFilesEl.value ? Number(maxFilesEl.value) : null;
      const dirs = (dirsEl && dirsEl.value.trim()) || '';
      const qs = new URLSearchParams();
      if (max) qs.set('max_files', String(max));
      if (dirs) qs.set('dirs', dirs);
      const url = '/api/admin/ingest-codebase' + (qs.toString() ? `?${qs}` : '');
      const body = await fetchJson(url, { method: 'POST', headers: authHeaders() });
      ingestOut.textContent = JSON.stringify(body, null, 2);
      startPolling();
    } catch (e) {
      ingestOut.textContent = `❌ ${e.message}`;
    }
  });

  if (watchBtn) {
    watchBtn.addEventListener('click', () => {
      if (pollTimer) {
        stopPolling();
        ingestOut.textContent += '\n\n(모니터링 중단)';
      } else {
        startPolling();
      }
    });
  }

  uploadBtn.addEventListener('click', async () => {
    if (!docFileEl.files || !docFileEl.files[0]) {
      alert('업로드할 파일을 선택하세요.');
      return;
    }
    uploadOut.textContent = '업로드 & 적재 중...';
    try {
      const fd = new FormData();
      fd.append('file', docFileEl.files[0]);
      const body = await fetchJson('/api/admin/upload', {
        method: 'POST',
        headers: authHeaders(),
        body: fd,
      });
      uploadOut.textContent = JSON.stringify(body, null, 2);
    } catch (e) {
      uploadOut.textContent = `❌ ${e.message}`;
    }
  });

  resetBtn.addEventListener('click', async () => {
    if (!confirm('정말로 모든 인덱스를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    resetOut.textContent = '초기화 중...';
    try {
      const body = await fetchJson('/api/admin/reset', { method: 'POST', headers: authHeaders() });
      resetOut.textContent = JSON.stringify(body, null, 2);
    } catch (e) {
      resetOut.textContent = `❌ ${e.message}`;
    }
  });
})();
