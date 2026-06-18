/* ── Hermes 页面逻辑 ── */
var API_BASE = 'http://127.0.0.1:9119';

// DOM 引用
var msgList   = document.getElementById('message-list');
var chatInput = document.getElementById('chat-input');
var sendBtn   = document.getElementById('send-btn');
var infoToggle = document.getElementById('info-toggle');
var infoDrawer = document.getElementById('info-drawer');

/* ── 辅助：判断是否为移动端（不含右侧侧栏） ── */
function isMobile() { return window.innerWidth < 900; }

/* ── 初始化 ── */
document.addEventListener('DOMContentLoaded', function () {
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

  // 信息面板切换（移动端）
  if (infoToggle) {
    infoToggle.addEventListener('click', function () {
      infoDrawer.classList.toggle('hidden');
    });
  }

  // 窗口变化：抽屉状态自动处理
  window.addEventListener('resize', function () {
    if (!isMobile() && infoDrawer) {
      infoDrawer.classList.add('hidden');
    }
  });

  // 自动增高输入框
  chatInput.addEventListener('input', autoResize);
});

/* ── 输入框自动增高 ── */
function autoResize() {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 120) + 'px';
}

/* ── 发送消息 ── */
function sendMessage() {
  var text = chatInput.value.trim();
  if (!text) return;

  appendMessage('user', text);
  chatInput.value = '';
  chatInput.style.height = 'auto';
  sendBtn.disabled = true;
  sendBtn.textContent = '发送中...';

  // 临时回复（后续可接真实 WebSocket）
  setTimeout(function () {
    appendMessage('assistant', '收到：' + text);
    sendBtn.disabled = false;
    sendBtn.textContent = '发送';
  }, 300);
}

/* ── 追加消息 ── */
function appendMessage(role, text) {
  var div = document.createElement('div');
  div.className = 'msg msg-' + role;

  var bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.textContent = text;

  div.appendChild(bubble);
  msgList.appendChild(div);
  msgList.scrollTop = msgList.scrollHeight;
}

/* ── 更新两侧的状态元素 ── */
function setText(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = val || '-';
}
function setHTML(id, html) {
  var el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

/* ── 加载系统状态 ── */
function loadStatus() {
  fetch(API_BASE + '/api/status')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      setText('sys-model', data.model);
      setText('sys-version', data.version);
      setText('sys-uptime', formatUptime(data.uptime_seconds));
      setText('sys-model-d', data.model);
      setText('sys-version-d', data.version);
      setText('sys-uptime-d', formatUptime(data.uptime_seconds));

      var cls = data.gateway_running ? 'green' : 'gray';
      var txt = data.gateway_running ? '运行中' : '未运行';
      var dots = document.querySelectorAll('#hermes-status, #hermes-status-d');
      dots.forEach(function (d) { d.className = 'status-dot ' + cls; });
      var statusTexts = document.querySelectorAll('#status-text, #status-text-d');
      statusTexts.forEach(function (t) { if (t) t.textContent = txt; });
    })
    .catch(function () {
      var dots = document.querySelectorAll('#hermes-status, #hermes-status-d');
      dots.forEach(function (d) { d.className = 'status-dot red'; });
      var statusTexts = document.querySelectorAll('#status-text, #status-text-d');
      statusTexts.forEach(function (t) { if (t) t.textContent = '无法连接'; });
    });
}

/* ── 加载最近会话 ── */
function loadSessions() {
  fetch(API_BASE + '/api/sessions')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var html = '';
      if (!data.sessions || data.sessions.length === 0) {
        html = '<div class="session-item empty">暂无会话</div>';
      } else {
        html = data.sessions.slice(0, 8).map(function (s) {
          return '<div class="session-item">' +
            '<div class="session-title">' + (s.title || '未命名会话') + '</div>' +
            '<div class="session-time">' + (s.source_platform || '') +
            (s.message_count ? ' · ' + s.message_count + ' 条消息' : '') + '</div></div>';
        }).join('');
      }
      setHTML('recent-sessions', html);
      setHTML('recent-sessions-desktop', html);
    })
    .catch(function () {});
}

/* ── 加载企业微信状态 ── */
function loadWecomStatus() {
  fetch(API_BASE + '/api/messaging/platforms')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var wecom = data.platforms ? data.platforms.find(function (p) {
        return p.id === 'wecom' || p.name === '企业微信' || p.id === 'wechat_work';
      }) : null;

      var html;
      if (wecom && wecom.connected) {
        html = '<span class="status-dot green"></span><span>已连接</span>';
      } else if (wecom && wecom.enabled) {
        html = '<span class="status-dot gray"></span><span>已配置未连接</span>';
      } else {
        html = '<span class="status-dot gray"></span><span>未配置</span>';
      }
      setHTML('wecom-status', html);
      setHTML('wecom-status-desktop', html);
    })
    .catch(function () {});
}

/* ── 企业微信配置（移动端） ── */
function toggleWecomConfig() {
  var el = document.getElementById('wecom-config');
  el.classList.toggle('hidden');
}

function saveWecom() {
  var corpId = document.getElementById('corp-id').value;
  var agentId = document.getElementById('agent-id').value;
  var secret = document.getElementById('wecom-secret').value;
  var token = document.getElementById('wecom-token').value;
  var aes = document.getElementById('wecom-aes').value;

  if (!corpId || !secret) { alert('Corp ID 和 Secret 必填'); return; }

  fetch(API_BASE + '/api/messaging/platforms/wecom', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      enabled: true,
      env: { WECOM_CORP_ID: corpId, WECOM_AGENT_ID: agentId, WECOM_SECRET: secret, WECOM_TOKEN: token, WECOM_AES_KEY: aes }
    })
  }).then(function (r) {
    if (r.ok) {
      alert('企业微信配置已保存');
      document.getElementById('wecom-config').classList.add('hidden');
      loadWecomStatus();
    } else { r.text().then(function (t) { alert('保存失败: ' + t); }); }
  }).catch(function (e) { alert('保存失败: ' + e.message); });
}

/* ── 企业微信配置（桌面端） ── */
function toggleWecomConfigDesktop() {
  var el = document.getElementById('wecom-config-desktop');
  el.classList.toggle('hidden');
}

function saveWecomDesktop() {
  var corpId = document.getElementById('corp-id-d').value;
  var agentId = document.getElementById('agent-id-d').value;
  var secret = document.getElementById('wecom-secret-d').value;
  var token = document.getElementById('wecom-token-d').value;
  var aes = document.getElementById('wecom-aes-d').value;

  if (!corpId || !secret) { alert('Corp ID 和 Secret 必填'); return; }

  fetch(API_BASE + '/api/messaging/platforms/wecom', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      enabled: true,
      env: { WECOM_CORP_ID: corpId, WECOM_AGENT_ID: agentId, WECOM_SECRET: secret, WECOM_TOKEN: token, WECOM_AES_KEY: aes }
    })
  }).then(function (r) {
    if (r.ok) {
      alert('企业微信配置已保存');
      document.getElementById('wecom-config-desktop').classList.add('hidden');
      loadWecomStatus();
    } else { r.text().then(function (t) { alert('保存失败: ' + t); }); }
  }).catch(function (e) { alert('保存失败: ' + e.message); });
}

/* ── 工具 ── */
function formatUptime(seconds) {
  if (!seconds) return null;
  var d = Math.floor(seconds / 86400);
  var h = Math.floor((seconds % 86400) / 3600);
  var m = Math.floor((seconds % 3600) / 60);
  var parts = [];
  if (d > 0) parts.push(d + '天');
  if (h > 0) parts.push(h + '时');
  parts.push(m + '分');
  return parts.join('');
}
