(() => {
  const messagesEl = document.getElementById('messages');
  const formEl = document.getElementById('chat-form');
  const inputEl = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  const sessionListEl = document.getElementById('session-list');
  const newSessionBtn = document.getElementById('new-session');
  const sessionSearchEl = document.getElementById('session-search');
  const modalEl = document.getElementById('source-modal');
  const modalBodyEl = document.getElementById('source-modal-body');
  const modalCloseEl = document.getElementById('source-modal-close');

  let currentSessionId = null;
  let isStreaming = false;
  let allSessions = [];

  const BUILD_ID = document.querySelector('meta[name="build-id"]')?.content || '';
  const AVATAR_KINDS = ['friendly', 'normal', 'pressure'];
  function buildAvatar() {
    const kind = AVATAR_KINDS[Math.floor(Math.random() * AVATAR_KINDS.length)];
    const img = document.createElement('img');
    img.className = 'message-avatar';
    img.alt = '';
    img.src = `/static/img/avatar-${kind}.png${BUILD_ID ? `?v=${BUILD_ID}` : ''}`;
    img.dataset.kind = kind;
    return img;
  }

  inputEl.addEventListener('input', () => {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 160) + 'px';
  });

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      formEl.requestSubmit();
    }
  });

  document.querySelectorAll('.suggestion').forEach((btn) => {
    btn.addEventListener('click', () => {
      inputEl.value = btn.dataset.q || btn.textContent;
      inputEl.dispatchEvent(new Event('input'));
      inputEl.focus();
    });
  });

  newSessionBtn.addEventListener('click', () => createSession());

  if (sessionSearchEl) {
    sessionSearchEl.addEventListener('input', () => {
      renderSessionList(allSessions, sessionSearchEl.value.trim());
    });
  }

  formEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = inputEl.value.trim();
    if (!text || isStreaming) return;
    if (!currentSessionId) {
      await createSession({ silent: true });
    }
    await sendMessage(text);
  });

  modalCloseEl.addEventListener('click', closeModal);
  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modalEl.hasAttribute('hidden')) closeModal();
  });

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderMarkdownLite(s) {
    let out = escapeHtml(s);
    out = out.replace(/```([a-zA-Z0-9]*)\n([\s\S]*?)```/g, (_, _lang, code) =>
      `<pre><code>${code}</code></pre>`,
    );
    out = out.replace(/`([^`\n]+)`/g, '<code>$1</code>');
    out = out.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    return out;
  }

  function clearWelcome() {
    const welcome = messagesEl.querySelector('.welcome');
    if (welcome) welcome.remove();
  }

  function openModal(sources) {
    if (!sources || !sources.length) return;
    modalBodyEl.innerHTML = sources
      .map((s) => {
        const path = escapeHtml(s.rel_path || '');
        const lineStart = Number(s.line_start || 0);
        const lineEnd = Number(s.line_end || 0);
        const linesLabel = lineStart || lineEnd ? `L${lineStart}-${lineEnd}` : '';
        const kindLabel = escapeHtml(s.source_kind || s.kind || 'chunk');
        const symbolLabel = s.symbol ? `· ${escapeHtml(s.symbol)}` : '';
        const text = escapeHtml(s.text || '(빈 청크)');
        return `
          <article class="source-card">
            <div class="source-card-head">
              <span class="source-card-kind">${kindLabel}</span>
              <span class="source-card-path">${path}</span>
              ${linesLabel ? `<span class="source-card-lines">${linesLabel}</span>` : ''}
              ${symbolLabel ? `<span class="source-card-symbol">${symbolLabel}</span>` : ''}
            </div>
            <pre class="source-card-body">${text}</pre>
          </article>
        `;
      })
      .join('');
    modalEl.removeAttribute('hidden');
    modalEl.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    modalEl.setAttribute('hidden', '');
    modalEl.setAttribute('aria-hidden', 'true');
    modalBodyEl.innerHTML = '';
  }

  function buildCopyButton(getText) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'action-icon-btn';
    btn.title = '답변 복사';
    btn.innerHTML = '📋 <span class="copy-label">복사</span>';
    btn.addEventListener('click', async () => {
      const text = getText();
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        const label = btn.querySelector('.copy-label');
        const original = label ? label.textContent : '';
        if (label) label.textContent = '복사됨';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.classList.remove('copied');
          if (label) label.textContent = original;
        }, 1500);
      } catch (_) {
        btn.title = '복사 실패';
      }
    });
    return btn;
  }

  function buildSourceButton(sources) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'source-btn';
    btn.title = '답변 근거 확인';
    btn.innerHTML = `🔍 근거 <span class="source-count">${sources.length}</span>`;
    btn.addEventListener('click', () => openModal(sources));
    return btn;
  }

  function buildActions(getText, sources) {
    const wrap = document.createElement('div');
    wrap.className = 'message-actions';
    wrap.appendChild(buildCopyButton(getText));
    if (sources && sources.length) {
      wrap.appendChild(buildSourceButton(sources));
    }
    return wrap;
  }

  function buildMeta(metrics) {
    if (!metrics) return null;
    const total = Number(metrics.total_ms || 0);
    const retrieval = Number(metrics.retrieval_ms || 0);
    if (!total && !retrieval) return null;
    const wrap = document.createElement('div');
    wrap.className = 'message-meta';
    wrap.innerHTML =
      `<span>⚡ <code>${(total / 1000).toFixed(2)}s</code> 응답</span>` +
      `<span>· 검색 <code>${retrieval.toFixed(0)}ms</code></span>` +
      (Array.isArray(metrics.queries_used) && metrics.queries_used.length > 1
        ? `<span>· 쿼리 ${metrics.queries_used.length}개</span>`
        : '');
    return wrap;
  }

  function buildFollowups(questions, container) {
    if (!questions || !questions.length) return null;
    const wrap = document.createElement('div');
    wrap.className = 'followups';
    const label = document.createElement('div');
    label.className = 'followups-label';
    label.textContent = '이어서 물어보기';
    wrap.appendChild(label);
    questions.slice(0, 3).forEach((q) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'followup-btn';
      btn.textContent = q;
      btn.addEventListener('click', () => sendFollowup(q, container));
      wrap.appendChild(btn);
    });
    return wrap;
  }

  function appendMessage(role, content, sources, followups, metrics) {
    clearWelcome();
    const wrap = document.createElement('div');
    wrap.className = `message ${role}`;

    if (role === 'assistant') {
      wrap.appendChild(buildAvatar());
      const contentBox = document.createElement('div');
      contentBox.className = 'message-content';
      const bubble = document.createElement('div');
      bubble.className = 'message-bubble';
      bubble.innerHTML = renderMarkdownLite(content);
      contentBox.appendChild(bubble);
      contentBox.appendChild(buildActions(() => bubble.innerText, sources || []));
      wrap.appendChild(contentBox);

      const meta = buildMeta(metrics);
      if (meta) wrap.appendChild(meta);

      const fu = buildFollowups(followups, wrap);
      if (fu) wrap.appendChild(fu);
    } else {
      const bubble = document.createElement('div');
      bubble.className = 'message-bubble';
      bubble.innerHTML = renderMarkdownLite(content);
      wrap.appendChild(bubble);
    }

    messagesEl.appendChild(wrap);
    scrollToBottom();
    return { wrap };
  }

  function appendStreamingAssistant() {
    clearWelcome();
    const wrap = document.createElement('div');
    wrap.className = 'message assistant';
    wrap.appendChild(buildAvatar());
    const contentBox = document.createElement('div');
    contentBox.className = 'message-content';
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.innerHTML = '<span class="typing-indicator"></span>';
    contentBox.appendChild(bubble);
    wrap.appendChild(contentBox);
    messagesEl.appendChild(wrap);
    scrollToBottom();
    return { wrap, contentBox, bubble };
  }

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function loadSessions() {
    const res = await fetch('/api/sessions');
    const data = await res.json();
    allSessions = data.sessions || [];
    renderSessionList(allSessions, sessionSearchEl ? sessionSearchEl.value.trim() : '');
  }

  function renderSessionList(sessions, filter) {
    const needle = (filter || '').toLowerCase();
    const visible = needle
      ? sessions.filter((s) => (s.title || '').toLowerCase().includes(needle))
      : sessions;

    if (!visible.length) {
      sessionListEl.innerHTML = needle
        ? `<div class="empty-hint">"${escapeHtml(filter)}" 와 일치하는 대화가 없습니다.</div>`
        : '<div class="empty-hint">아직 대화가 없습니다.<br />질문을 입력해보세요.</div>';
      return;
    }
    sessionListEl.innerHTML = '';
    visible.forEach((s) => {
      const item = document.createElement('div');
      item.className = 'session-item' + (s.id === currentSessionId ? ' active' : '');
      item.innerHTML = `
        <span class="session-title">${escapeHtml(s.title)}</span>
        <button class="session-delete" title="삭제">×</button>
      `;
      item.querySelector('.session-title').addEventListener('click', () => loadSession(s.id));
      item.querySelector('.session-delete').addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm('이 대화를 삭제할까요?')) return;
        await fetch(`/api/sessions/${s.id}`, { method: 'DELETE' });
        if (currentSessionId === s.id) {
          currentSessionId = null;
          messagesEl.innerHTML = '';
          location.reload();
        }
        loadSessions();
      });
      sessionListEl.appendChild(item);
    });
  }

  async function createSession({ silent } = {}) {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '새 대화' }),
    });
    const data = await res.json();
    currentSessionId = data.id;
    if (!silent) {
      messagesEl.innerHTML = '';
      appendWelcomeBack();
    }
    await loadSessions();
    return data.id;
  }

  function appendWelcomeBack() {
    const div = document.createElement('div');
    div.className = 'welcome';
    div.innerHTML = '<p class="welcome-sub">새 대화를 시작했습니다. 무엇이든 물어보세요.</p>';
    messagesEl.appendChild(div);
  }

  function parseStoredCitations(raw) {
    if (!raw) return { sources: [], followups: [], metrics: null };
    try {
      const obj = JSON.parse(raw);
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        return {
          sources: Array.isArray(obj.sources) ? obj.sources : [],
          followups: Array.isArray(obj.followups) ? obj.followups : [],
          metrics: obj.metrics || null,
        };
      }
      if (Array.isArray(obj)) {
        return {
          sources: obj.map((p) => ({ rel_path: String(p), text: '' })),
          followups: [],
          metrics: null,
        };
      }
    } catch (_) {
      /* legacy plain string */
    }
    return { sources: [], followups: [], metrics: null };
  }

  async function loadSession(sessionId) {
    if (isStreaming) return;
    currentSessionId = sessionId;
    const res = await fetch(`/api/sessions/${sessionId}`);
    const data = await res.json();
    messagesEl.innerHTML = '';
    (data.messages || []).forEach((m) => {
      const { sources, followups, metrics } = parseStoredCitations(m.citations);
      const role = m.role === 'system' ? 'assistant' : m.role;
      appendMessage(role, m.content, sources, followups, metrics);
    });
    if (!data.messages || !data.messages.length) {
      appendWelcomeBack();
    }
    await loadSessions();
  }

  async function sendFollowup(text, sourceWrap) {
    if (isStreaming || !text) return;
    sourceWrap.querySelectorAll('.followup-btn').forEach((b) => (b.disabled = true));
    await sendMessage(text);
  }

  async function sendMessage(text) {
    appendMessage('user', text);
    inputEl.value = '';
    inputEl.style.height = 'auto';
    isStreaming = true;
    sendBtn.disabled = true;
    const { wrap, contentBox, bubble } = appendStreamingAssistant();
    let collected = '';
    let finalSources = [];
    let finalMetrics = null;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify({ session_id: currentSessionId, message: text }),
      });
      if (!res.ok) {
        const errText = await res.text();
        bubble.innerHTML = `❌ 오류: ${escapeHtml(errText.slice(0, 200))}`;
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      const sseSplit = /\r\n\r\n|\n\n/;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split(sseSplit);
        buf = parts.pop();
        for (const part of parts) {
          if (!part.trim()) continue;
          handleSseEvent(part, wrap, contentBox, bubble, {
            onToken: (chunk) => {
              collected += chunk;
              bubble.innerHTML = renderMarkdownLite(collected) + '<span class="typing-indicator"></span>';
              scrollToBottom();
            },
            onSources: (sources) => {
              finalSources = sources;
            },
            onMetrics: (metrics) => {
              finalMetrics = metrics;
            },
          });
        }
      }
      bubble.innerHTML = renderMarkdownLite(collected || '(응답 없음)');
      contentBox.appendChild(buildActions(() => bubble.innerText, finalSources));
      const meta = buildMeta(finalMetrics);
      if (meta) wrap.appendChild(meta);
      scrollToBottom();
    } catch (err) {
      bubble.innerHTML = `❌ 네트워크 오류: ${escapeHtml(String(err))}`;
    } finally {
      isStreaming = false;
      sendBtn.disabled = false;
      inputEl.focus();
      await loadSessions();
    }
  }

  function handleSseEvent(raw, wrap, contentBox, bubble, callbacks) {
    const lines = raw.split(/\r\n|\n/);
    let event = 'message';
    const dataLines = [];
    for (const line of lines) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
    }
    const dataStr = dataLines.join('\n');
    if (!dataStr) return;
    let data;
    try {
      data = JSON.parse(dataStr);
    } catch (_) {
      return;
    }
    if (event === 'token' && data.text) {
      callbacks.onToken(data.text);
    } else if (event === 'done') {
      const sources = Array.isArray(data.sources) ? data.sources : [];
      callbacks.onSources(sources);
      if (data.metrics) callbacks.onMetrics(data.metrics);
    } else if (event === 'followups') {
      const followups = Array.isArray(data.followups) ? data.followups : [];
      if (followups.length) {
        wrap.querySelectorAll('.followups').forEach((n) => n.remove());
        const fu = buildFollowups(followups, wrap);
        if (fu) {
          wrap.appendChild(fu);
          scrollToBottom();
        }
      }
    } else if (event === 'error') {
      bubble.innerHTML = `❌ ${escapeHtml(data.error || 'unknown error')}`;
    }
  }

  loadSessions();
})();
