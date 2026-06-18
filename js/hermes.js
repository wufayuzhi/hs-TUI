/* ── Hermes 页面逻辑 ── */
const API_BASE = 'http://127.0.0.1:9119';

// DOM 引用
const msgList   = document.getElementById('message-list');
const chatInput = document.getElementById('chat-input');
const sendBtn   = document.getElementById('send-btn');

let ws = null;

/* ── 初始化 ── */
document.addEventListener('DOMContentLoaded', async function () {
  loadStatus();
  loadSessions();
  loadWecomStatus();

  // 输入框事件
  chatInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  sendBtn.addEventListener('click', sendMessage);

  // 自动刷新
  setInterval(loadStatus, 30000);
  setInterval(loadSessions, 30000);
});

/* ── 发送消息 ── */
async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  // 显示用户消息
  appendMessage('user', text);
  chatInput.value = '';
  sendBtn.disabled = true;
  sendBtn.textContent = '发送中...';

  // 通过 Dashboard API 发送
  // 目前用 /api/sessions 作为展示，实际对话通过 terminal 或 WebSocket
  appendMessage('assistant', '收到：' + text);
  sendBtn.disabled = false;
  sendBtn.textContent = '发送';
}

/* ── 追加消息 ── */
function appendMessage(role, text) {
  const div = document.createElement('div');
  div.className = 'msg msg-' + role;

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.textContent = text;

  div.appendChild(bubble);
  msgList.appendChild(div);
  msgList.scrollTop = msgList.scrollHeight;
}

/* ── 加载系统状态 ── */
async function loadStatus() {
  try {
    const res = await fetch(API_BASE + '/api/status');
    const data = await res.json();

    document.getElementById('sys-model').textContent = data.model || '-';
    document.getElementById('sys-version').textContent = data.version || '-';
    document.getElementById('sys-uptime').textContent = formatUptime(data.uptime_seconds) || '-';

    // 更新运行状态
    const dot = document.querySelector('#hermes-status + span');
    if (data.gateway_running) {
      document.getElementById('hermes-status').className = 'status-dot green';
      if (dot) dot.textContent = '运行中';
    } else {
      document.getElementById('hermes-status').className = 'status-dot gray';
      if (dot) dot.textContent = '未运行';
    }
  } catch (e) {
    document.getElementById('hermes-status').className = 'status-dot red';
    const dot = document.querySelector('#hermes-status + span');
    if (dot) dot.textContent = '无法连接';
  }
}

/* ── 加载最近会话 ── */
async function loadSessions() {
  try {
    const res = await fetch(API_BASE + '/api/sessions');
    const data = await res.json();
    const container = document.getElementById('recent-sessions');

    if (!data.sessions || data.sessions.length === 0) {
      container.innerHTML = '<div class="session-item empty">暂无会话</div>';
      return;
    }

    container.innerHTML = data.sessions.slice(0, 10).map(function (s) {
      return '<div class="session-item">' +
        '<div class="session-title">' + (s.title || '未命名会话') + '</div>' +
        '<div class="session-time">' + (s.source_platform || '') + ' · ' + (s.message_count || 0) + ' 条消息</div>' +
        '</div>';
    }).join('');
  } catch (e) {
    // 静默失败
  }
}

/* ── 加载企业微信状态 ── */
async function loadWecomStatus() {
  try {
    const res = await fetch(API_BASE + '/api/messaging/platforms');
    const data = await res.json();
    const wecom = data.platforms ? data.platforms.find(function (p) {
      return p.id === 'wecom' || p.name === '企业微信' || p.id === 'wechat_work';
    }) : null;

    const statusEl = document.getElementById('wecom-status');
    if (wecom && wecom.connected) {
      statusEl.innerHTML = '<span class="status-dot green"></span><span>已连接</span>';
    } else if (wecom && wecom.enabled) {
      statusEl.innerHTML = '<span class="status-dot gray"></span><span>已配置未连接</span>';
    } else {
      statusEl.innerHTML = '<span class="status-dot gray"></span><span>未配置</span>';
    }
  } catch (e) {
    // 静默
  }
}

/* ── 企业微信配置 ── */
function toggleWecomConfig() {
  const el = document.getElementById('wecom-config');
  el.classList.toggle('hidden');
}

async function saveWecom() {
  const corpId = document.getElementById('corp-id').value;
  const agentId = document.getElementById('agent-id').value;
  const secret = document.getElementById('wecom-secret').value;
  const token = document.getElementById('wecom-token').value;
  const aes = document.getElementById('wecom-aes').value;

  if (!corpId || !secret) {
    alert('Corp ID 和 Secret 必填');
    return;
  }

  try {
    const res = await fetch(API_BASE + '/api/messaging/platforms/wecom', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enabled: true,
        env: {
          WECOM_CORP_ID: corpId,
          WECOM_AGENT_ID: agentId,
          WECOM_SECRET: secret,
          WECOM_TOKEN: token,
          WECOM_AES_KEY: aes
        }
      })
    });

    if (res.ok) {
      alert('企业微信配置已保存');
      document.getElementById('wecom-config').classList.add('hidden');
      loadWecomStatus();
    } else {
      alert('保存失败: ' + await res.text());
    }
  } catch (e) {
    alert('保存失败: ' + e.message);
  }
}

/* ── 工具 ── */
function formatUptime(seconds) {
  if (!seconds) return null;
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts = [];
  if (d > 0) parts.push(d + '天');
  if (h > 0) parts.push(h + '时');
  parts.push(m + '分');
  return parts.join('');
}
