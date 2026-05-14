(() => {
  const messagesEl = document.getElementById('messages');
  const formEl = document.getElementById('chat-form');
  const inputEl = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  const sessionListEl = document.getElementById('session-list');
  const newSessionBtn = document.getElementById('new-session');

  let currentSessionId = null;
  let isStreaming = false;

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

  formEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = inputEl.value.trim();
    if (!text || isStreaming) return;
    if (!currentSessionId) {
      await createSession({ silent: true });
    }
    await sendMessage(text);
  });

  function escapeHtml(s) {
    return s
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

  function appendMessage(role, content, citations) {
    clearWelcome();
    const wrap = document.createElement('div');
    wrap.className = `message ${role}`;
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.innerHTML = renderMarkdownLite(content);
    wrap.appendChild(bubble);
    if (citations && citations.length) {
      const cit = document.createElement('div');
      cit.className = 'message-citations';
      cit.innerHTML = '🔗 ' + citations.map((c) => `<code>${escapeHtml(c)}</code>`).join(' · ');
      wrap.appendChild(cit);
    }
    messagesEl.appendChild(wrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return bubble;
  }

  function appendStreamingAssistant() {
    clearWelcome();
    const wrap = document.createElement('div');
    wrap.className = 'message assistant';
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.innerHTML = '<span class="typing-indicator"></span>';
    wrap.appendChild(bubble);
    const cit = document.createElement('div');
    cit.className = 'message-citations';
    cit.style.display = 'none';
    wrap.appendChild(cit);
    messagesEl.appendChild(wrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return { bubble, cit, wrap };
  }

  async function loadSessions() {
    const res = await fetch('/api/sessions');
    const data = await res.json();
    renderSessionList(data.sessions || []);
  }

  function renderSessionList(sessions) {
    if (!sessions.length) {
      sessionListEl.innerHTML = '<div class="empty-hint">아직 대화가 없습니다.<br />질문을 입력해보세요.</div>';
      return;
    }
    sessionListEl.innerHTML = '';
    sessions.forEach((s) => {
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

  async function loadSession(sessionId) {
    if (isStreaming) return;
    currentSessionId = sessionId;
    const res = await fetch(`/api/sessions/${sessionId}`);
    const data = await res.json();
    messagesEl.innerHTML = '';
    (data.messages || []).forEach((m) => {
      let citations = null;
      if (m.citations) {
        try { citations = JSON.parse(m.citations); } catch (_) { citations = null; }
      }
      appendMessage(m.role === 'system' ? 'assistant' : m.role, m.content, citations);
    });
    if (!data.messages || !data.messages.length) {
      appendWelcomeBack();
    }
    await loadSessions();
  }

  async function sendMessage(text) {
    appendMessage('user', text);
    inputEl.value = '';
    inputEl.style.height = 'auto';
    isStreaming = true;
    sendBtn.disabled = true;
    const { bubble, cit } = appendStreamingAssistant();
    let collected = '';

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
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
          handleSseEvent(part, bubble, cit, (chunk) => {
            collected += chunk;
            bubble.innerHTML = renderMarkdownLite(collected) + '<span class="typing-indicator"></span>';
            messagesEl.scrollTop = messagesEl.scrollHeight;
          });
        }
      }
      bubble.innerHTML = renderMarkdownLite(collected || '(응답 없음)');
    } catch (err) {
      bubble.innerHTML = `❌ 네트워크 오류: ${escapeHtml(String(err))}`;
    } finally {
      isStreaming = false;
      sendBtn.disabled = false;
      inputEl.focus();
      await loadSessions();
    }
  }

  function handleSseEvent(raw, bubble, cit, onToken) {
    const lines = raw.split(/\r\n|\n/);
    let event = 'message';
    let dataLines = [];
    for (const line of lines) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
    }
    const dataStr = dataLines.join('\n');
    if (!dataStr) return;
    let data;
    try { data = JSON.parse(dataStr); } catch (_) { return; }
    if (event === 'token' && data.text) {
      onToken(data.text);
    } else if (event === 'done') {
      if (data.citations && data.citations.length) {
        cit.style.display = '';
        cit.innerHTML = '🔗 ' + data.citations.map((c) => `<code>${escapeHtml(c)}</code>`).join(' · ');
      }
    } else if (event === 'error') {
      bubble.innerHTML = `❌ ${escapeHtml(data.error || 'unknown error')}`;
    }
  }

  loadSessions();
})();
