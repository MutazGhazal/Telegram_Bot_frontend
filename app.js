import { SUPABASE_URL, SUPABASE_KEY, API_BASE_URL } from './config.js';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const authView = document.getElementById('auth-view');
const appView = document.getElementById('app-view');
const authMessage = document.getElementById('auth-message');
const botMessage = document.getElementById('bot-message');
const userEmail = document.getElementById('user-email');
const botsList = document.getElementById('bots-list');
const botSelector = document.getElementById('bot-selector');
const botStartBtn = document.getElementById('bot-start');
const botStopBtn = document.getElementById('bot-stop');
const botRestartBtn = document.getElementById('bot-restart');
const botStatusBtn = document.getElementById('bot-status');
const botStatusText = document.getElementById('bot-status-text');
const botControlMessage = document.getElementById('bot-control-message');
const botDeleteBtn = document.getElementById('bot-delete');
const botDetailName = document.getElementById('bot-detail-name');
const botDetailId = document.getElementById('bot-detail-id');
const botDetailUsername = document.getElementById('bot-detail-username');
const botDetailModel = document.getElementById('bot-detail-model');
const botDetailActive = document.getElementById('bot-detail-active');
const botDetailCreated = document.getElementById('bot-detail-created');
const trainingForm = document.getElementById('training-form');
const trainingFileInput = document.getElementById('training-file');
const trainingDeleteBtn = document.getElementById('training-delete');
const trainingMessage = document.getElementById('training-message');
const trainingInfo = document.getElementById('training-info');
const whatsappConnectBtn = document.getElementById('whatsapp-connect');
const whatsappDisconnectBtn = document.getElementById('whatsapp-disconnect');
const whatsappStatusBtn = document.getElementById('whatsapp-status');
const whatsappStatusText = document.getElementById('whatsapp-status-text');
const whatsappMeta = document.getElementById('whatsapp-meta');
const whatsappMessage = document.getElementById('whatsapp-message');
const whatsappQrCard = document.getElementById('whatsapp-qr-card');
const whatsappQrImage = document.getElementById('whatsapp-qr');
const whatsappQrHint = document.getElementById('whatsapp-qr-hint');
const filesRoot = document.getElementById('files-root');
const filesPathInput = document.getElementById('files-path');
const filesList = document.getElementById('files-list');
const filesMessage = document.getElementById('files-message');
const filesRefresh = document.getElementById('files-refresh');
const filesUp = document.getElementById('files-up');
const tabButtons = document.querySelectorAll('.tab-button');
const tabPages = document.querySelectorAll('.tab-page');

const authForm = document.getElementById('auth-form');
const authSubmit = document.getElementById('auth-submit');
const authModeInputs = document.querySelectorAll('input[name="auth_mode"]');
const botForm = document.getElementById('bot-form');
const logoutBtn = document.getElementById('logout-btn');

const apiBaseUrl = API_BASE_URL?.replace(/\/$/, '');
let currentFilesPath = '';
let currentSession = null;
let botsCache = [];
let botInfo = null;
let whatsappPollTimer = null;

const showMessage = (target, message, isError = true) => {
  target.textContent = message;
  target.style.color = isError ? '#ef4444' : '#16a34a';
};

const clearMessage = (target) => {
  target.textContent = '';
};

const formatBytes = (value) => {
  if (value === null || value === undefined) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const buildApiUrl = (path) => `${apiBaseUrl || ''}${path}`;

const requireSession = (messageTarget) => {
  if (!currentSession) {
    showMessage(messageTarget, 'الرجاء تسجيل الدخول أولاً.');
    return false;
  }
  return true;
};

const getSelectedBotId = () => {
  const value = botSelector?.value?.trim();
  return value || null;
};

const apiRequest = async (path, options = {}) => {
  const response = await fetch(buildApiUrl(path), options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'فشل الاتصال بالخادم.');
  }
  return payload;
};

const startWhatsappPolling = () => {
  if (whatsappPollTimer) {
    clearInterval(whatsappPollTimer);
  }

  let attempts = 0;
  whatsappPollTimer = setInterval(async () => {
    attempts += 1;
    await refreshWhatsappStatus();
    if (attempts >= 20) {
      clearInterval(whatsappPollTimer);
      whatsappPollTimer = null;
    }
  }, 1500);
};

const setBotControlsEnabled = (enabled) => {
  const controls = [
    botStartBtn,
    botStopBtn,
    botRestartBtn,
    botStatusBtn,
    botDeleteBtn,
    trainingFileInput,
    trainingDeleteBtn,
    whatsappConnectBtn,
    whatsappDisconnectBtn,
    whatsappStatusBtn
  ];

  controls.forEach((control) => {
    if (control) {
      control.disabled = !enabled;
    }
  });
};

const switchTab = (pageName) => {
  tabButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.page === pageName);
  });
  tabPages.forEach((page) => {
    page.classList.toggle('active', page.dataset.page === pageName);
  });
};

const toggleViews = (session) => {
  if (session) {
    authView.classList.add('hidden');
    appView.classList.remove('hidden');
    userEmail.textContent = session.user.email;
  } else {
    authView.classList.remove('hidden');
    appView.classList.add('hidden');
    userEmail.textContent = '';
  }
};

const loadBots = async (session) => {
  botsList.innerHTML = '';
  if (!session) return;

  const { data, error } = await supabase
    .from('user_bots')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    showMessage(botMessage, 'فشل جلب البوتات.');
    return;
  }

  if (!data?.length) {
    botsCache = [];
    botSelector.innerHTML = '<option value="">لا يوجد بوتات</option>';
    botSelector.disabled = true;
    botStatusText.textContent = '—';
    trainingInfo.textContent = '—';
    whatsappStatusText.textContent = '—';
    whatsappMeta.textContent = '';
    setBotControlsEnabled(false);
    botInfo = null;
    renderBotDetails();
    botsList.innerHTML = '<li>لا يوجد بوتات حالياً</li>';
    return;
  }

  botsCache = data;
  setBotControlsEnabled(true);

  data.forEach((bot) => {
    const item = document.createElement('li');
    item.textContent = `${bot.bot_name} (${bot.id})`;
    botsList.appendChild(item);
  });

  botSelector.innerHTML = '';
  botSelector.disabled = false;
  data.forEach((bot) => {
    const option = document.createElement('option');
    option.value = bot.id;
    option.textContent = `${bot.bot_name} (${bot.id})`;
    botSelector.appendChild(option);
  });

  if (!botSelector.value && data.length) {
    botSelector.value = data[0].id;
  }

  await refreshBotInfo();

  await Promise.all([
    refreshBotStatus(),
    refreshTrainingInfo(),
    refreshWhatsappStatus()
  ]);
};

const renderFiles = (payload) => {
  filesList.innerHTML = '';
  filesRoot.textContent = payload.root || '—';
  currentFilesPath = payload.path || '';
  filesPathInput.value = currentFilesPath;

  if (!payload.items?.length) {
    filesList.innerHTML = '<li>لا توجد ملفات داخل هذا المسار.</li>';
    return;
  }

  payload.items.forEach((item) => {
    const row = document.createElement('li');
    row.className = 'file-row';

    const name = document.createElement('button');
    name.type = 'button';
    name.className = 'file-link';
    name.textContent = item.type === 'directory' ? `📁 ${item.name}` : item.name;
    name.dataset.path = item.path;
    name.dataset.type = item.type;

    const meta = document.createElement('span');
    meta.className = 'file-meta';
    meta.textContent =
      item.type === 'directory'
        ? 'مجلد'
        : `${formatBytes(item.size)}${item.modifiedAt ? ' • ' + new Date(item.modifiedAt).toLocaleString('ar') : ''}`;

    row.appendChild(name);
    row.appendChild(meta);
    filesList.appendChild(row);
  });
};

const loadFiles = async (pathValue = '') => {
  clearMessage(filesMessage);
  const queryPath = pathValue ?? '';
  const url = buildApiUrl(`/api/files?path=${encodeURIComponent(queryPath)}`);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || 'فشل تحميل الملفات.');
    }

    const data = await response.json();
    renderFiles(data);
  } catch (error) {
    filesList.innerHTML = '';
    showMessage(filesMessage, error.message || 'فشل تحميل الملفات.');
  }
};

const renderBotDetails = () => {
  const botId = getSelectedBotId();
  const bot = botsCache.find((item) => String(item.id) === String(botId));
  const aiModel = botInfo?.ai?.model || bot?.ai_model || '—';
  const aiProvider = botInfo?.ai?.provider || 'openrouter';

  if (!bot) {
    botDetailName.textContent = '—';
    botDetailId.textContent = '—';
    botDetailUsername.textContent = '—';
    botDetailModel.textContent = '—';
    botDetailActive.textContent = '—';
    botDetailCreated.textContent = '—';
    return;
  }

  botDetailName.textContent = bot.bot_name || '—';
  botDetailId.textContent = bot.id || '—';
  botDetailUsername.textContent = bot.bot_username || '—';
  botDetailModel.textContent = `${aiModel} (${aiProvider})`;
  botDetailActive.textContent = bot.is_active ? 'نشط' : 'متوقف';
  botDetailCreated.textContent = bot.created_at
    ? new Date(bot.created_at).toLocaleString('ar')
    : '—';
};

const refreshBotInfo = async () => {
  const botId = getSelectedBotId();
  if (!botId) {
    botInfo = null;
    renderBotDetails();
    return;
  }

  try {
    const payload = await apiRequest(`/api/bots/${botId}/info`);
    botInfo = payload;
    renderBotDetails();
  } catch {
    botInfo = null;
    renderBotDetails();
  }
};

const refreshBotStatus = async () => {
  clearMessage(botControlMessage);
  const botId = getSelectedBotId();
  if (!botId) {
    botStatusText.textContent = '—';
    return;
  }

  try {
    const payload = await apiRequest(`/api/bots/${botId}/status`);
    botStatusText.textContent = payload.running ? 'يعمل الآن' : 'متوقف';
  } catch (error) {
    showMessage(botControlMessage, error.message || 'فشل جلب الحالة.');
  }
};

const refreshTrainingInfo = async () => {
  clearMessage(trainingMessage);
  const botId = getSelectedBotId();
  if (!botId) {
    trainingInfo.textContent = '—';
    return;
  }

  try {
    const payload = await apiRequest(`/api/prompts/${botId}`);
    if (!payload || !payload.file_name) {
      trainingInfo.textContent = 'لا يوجد ملف تدريب.';
      trainingDeleteBtn.disabled = true;
      return;
    }

    trainingInfo.textContent = `${payload.file_name} (${payload.file_type || 'غير معروف'})`;
    trainingDeleteBtn.disabled = false;
  } catch (error) {
    trainingInfo.textContent = '—';
    trainingDeleteBtn.disabled = true;
    showMessage(trainingMessage, error.message || 'فشل جلب بيانات التدريب.');
  }
};

const refreshWhatsappStatus = async () => {
  clearMessage(whatsappMessage);
  const botId = getSelectedBotId();
  if (!botId) {
    whatsappStatusText.textContent = '—';
    whatsappMeta.textContent = '';
    return;
  }

  try {
    const payload = await apiRequest(`/api/whatsapp/${botId}/status`);
    const statusLabels = {
      connected: 'متصل',
      connecting: 'جاري الربط',
      qr: 'بانتظار المسح',
      error: 'خطأ',
      disconnected: 'غير متصل'
    };
    whatsappStatusText.textContent =
      statusLabels[payload.status] || payload.status || 'غير متصل';

    const details = [
      payload.phone ? `الهاتف: ${payload.phone}` : null,
      payload.sessionName ? `الجلسة: ${payload.sessionName}` : null,
      payload.webhookUrl ? `Webhook: ${payload.webhookUrl}` : null
    ]
      .filter(Boolean)
      .join(' • ');

    whatsappMeta.textContent = details;

    const qrCode = payload.qrCode || payload.lastQr;
    if (qrCode) {
      const src = qrCode.startsWith('data:image')
        ? qrCode
        : `data:image/png;base64,${qrCode}`;
      whatsappQrImage.src = src;
      whatsappQrCard.classList.remove('hidden');
      whatsappQrHint.textContent = payload.lastQrAt
        ? `آخر تحديث: ${new Date(payload.lastQrAt).toLocaleString('ar')}`
        : 'قم بمسح QR من واتساب للربط.';
    } else {
      whatsappQrCard.classList.add('hidden');
      whatsappQrImage.removeAttribute('src');
      whatsappQrHint.textContent = '';
    }

    if (payload.error) {
      showMessage(whatsappMessage, payload.error);
    }
  } catch (error) {
    whatsappStatusText.textContent = '—';
    whatsappMeta.textContent = '';
    whatsappQrCard.classList.add('hidden');
    whatsappQrImage.removeAttribute('src');
    whatsappQrHint.textContent = '';
    showMessage(whatsappMessage, error.message || 'فشل جلب حالة واتساب.');
  }
};

filesRefresh.addEventListener('click', () => {
  loadFiles(currentFilesPath);
});

filesUp.addEventListener('click', () => {
  if (!currentFilesPath) {
    loadFiles('');
    return;
  }

  const nextPath = currentFilesPath.split('/').slice(0, -1).join('/');
  loadFiles(nextPath);
});

filesPathInput.addEventListener('change', () => {
  loadFiles(filesPathInput.value.trim());
});

filesList.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const button = target.closest('button.file-link');
  if (!button) return;

  if (button.dataset.type === 'directory') {
    loadFiles(button.dataset.path);
  }
});

const updateAuthButton = () => {
  const mode = document.querySelector('input[name="auth_mode"]:checked')?.value;
  authSubmit.textContent = mode === 'register' ? 'تسجيل' : 'تسجيل الدخول';
};

authModeInputs.forEach((input) => {
  input.addEventListener('change', updateAuthButton);
});

authForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  authMessage.textContent = '';
  const email = authForm.email.value;
  const password = authForm.password.value;
  const mode = document.querySelector('input[name="auth_mode"]:checked')?.value;

  if (mode === 'register') {
    const { error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      showMessage(authMessage, error.message);
      return;
    }

    showMessage(authMessage, 'تم إرسال رابط التحقق لبريدك.', false);
    return;
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    showMessage(authMessage, error.message);
  }
});

botForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  botMessage.textContent = '';

  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;

  if (!session) {
    showMessage(botMessage, 'الرجاء تسجيل الدخول أولاً.');
    return;
  }

  const botToken = botForm.bot_token.value;

  if (apiBaseUrl) {
    try {
      await apiRequest('/api/bots/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: session.user.id,
          bot_token: botToken
        })
      });
      showMessage(botMessage, 'تم حفظ البوت بنجاح.', false);
      botForm.reset();
      loadBots(session);
    } catch (error) {
      showMessage(botMessage, error.message || 'فشل حفظ البوت.');
    }
    return;
  }

  const { error } = await supabase.from('user_bots').insert({
    user_id: session.user.id,
    bot_name: 'Telegram Bot',
    bot_token: botToken
  });

  if (error) {
    showMessage(
      botMessage,
      'فشل الحفظ. تحقق من سياسات RLS في Supabase.'
    );
    return;
  }

  showMessage(botMessage, 'تم حفظ البوت بنجاح.', false);
  botForm.reset();
  loadBots(session);
});

tabButtons.forEach((button) => {
  button.addEventListener('click', () => {
    switchTab(button.dataset.page);
  });
});

botSelector.addEventListener('change', () => {
  refreshBotInfo();
  refreshBotStatus();
  refreshTrainingInfo();
  refreshWhatsappStatus();
});

botStartBtn.addEventListener('click', async () => {
  clearMessage(botControlMessage);
  if (!requireSession(botControlMessage)) return;
  const botId = getSelectedBotId();
  if (!botId) {
    showMessage(botControlMessage, 'اختر بوتاً أولاً.');
    return;
  }

  try {
    await apiRequest(`/api/bots/${botId}/start`, { method: 'POST' });
    botStatusText.textContent = 'يعمل الآن';
    showMessage(botControlMessage, 'تم تشغيل البوت بنجاح.', false);
  } catch (error) {
    showMessage(botControlMessage, error.message || 'تعذر تشغيل البوت.');
  }
});

botStopBtn.addEventListener('click', async () => {
  clearMessage(botControlMessage);
  if (!requireSession(botControlMessage)) return;
  const botId = getSelectedBotId();
  if (!botId) {
    showMessage(botControlMessage, 'اختر بوتاً أولاً.');
    return;
  }

  try {
    await apiRequest(`/api/bots/${botId}/stop`, { method: 'POST' });
    botStatusText.textContent = 'متوقف';
    showMessage(botControlMessage, 'تم إيقاف البوت بنجاح.', false);
  } catch (error) {
    showMessage(botControlMessage, error.message || 'تعذر إيقاف البوت.');
  }
});

botRestartBtn.addEventListener('click', async () => {
  clearMessage(botControlMessage);
  if (!requireSession(botControlMessage)) return;
  const botId = getSelectedBotId();
  if (!botId) {
    showMessage(botControlMessage, 'اختر بوتاً أولاً.');
    return;
  }

  try {
    await apiRequest(`/api/bots/${botId}/restart`, { method: 'POST' });
    botStatusText.textContent = 'يعمل الآن';
    showMessage(botControlMessage, 'تمت إعادة تشغيل البوت.', false);
  } catch (error) {
    showMessage(botControlMessage, error.message || 'تعذر إعادة التشغيل.');
  }
});

botStatusBtn.addEventListener('click', () => {
  refreshBotStatus();
});

botDeleteBtn.addEventListener('click', async () => {
  clearMessage(botControlMessage);
  if (!requireSession(botControlMessage)) return;
  const botId = getSelectedBotId();
  if (!botId) {
    showMessage(botControlMessage, 'اختر بوتاً أولاً.');
    return;
  }

  const confirmed = window.confirm('هل تريد حذف البوت نهائيًا؟');
  if (!confirmed) return;

  try {
    await apiRequest(`/api/bots/${botId}`, { method: 'DELETE' });
    showMessage(botControlMessage, 'تم حذف البوت بنجاح.', false);
    await loadBots(currentSession);
  } catch (error) {
    showMessage(botControlMessage, error.message || 'فشل حذف البوت.');
  }
});

trainingForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearMessage(trainingMessage);
  if (!requireSession(trainingMessage)) return;
  const botId = getSelectedBotId();
  if (!botId) {
    showMessage(trainingMessage, 'اختر بوتاً أولاً.');
    return;
  }

  const file = trainingFileInput.files?.[0];
  if (!file) {
    showMessage(trainingMessage, 'اختر ملفاً أولاً.');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    await apiRequest(`/api/prompts/${botId}/upload`, {
      method: 'POST',
      body: formData
    });
    trainingFileInput.value = '';
    showMessage(trainingMessage, 'تم رفع ملف التدريب بنجاح.', false);
    refreshTrainingInfo();
  } catch (error) {
    showMessage(trainingMessage, error.message || 'فشل رفع الملف.');
  }
});

trainingDeleteBtn.addEventListener('click', async () => {
  clearMessage(trainingMessage);
  if (!requireSession(trainingMessage)) return;
  const botId = getSelectedBotId();
  if (!botId) {
    showMessage(trainingMessage, 'اختر بوتاً أولاً.');
    return;
  }

  try {
    await apiRequest(`/api/prompts/${botId}`, { method: 'DELETE' });
    showMessage(trainingMessage, 'تم حذف ملف التدريب.', false);
    refreshTrainingInfo();
  } catch (error) {
    showMessage(trainingMessage, error.message || 'فشل حذف ملف التدريب.');
  }
});

whatsappConnectBtn.addEventListener('click', async () => {
  clearMessage(whatsappMessage);
  if (!requireSession(whatsappMessage)) return;
  const botId = getSelectedBotId();
  if (!botId) {
    showMessage(whatsappMessage, 'اختر بوتاً أولاً.');
    return;
  }

  try {
    await apiRequest(`/api/whatsapp/${botId}/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    showMessage(whatsappMessage, 'تم إنشاء QR للربط. امسحه فوراً.', false);
    refreshWhatsappStatus();
    startWhatsappPolling();
  } catch (error) {
    showMessage(whatsappMessage, error.message || 'فشل ربط واتساب.');
  }
});

whatsappDisconnectBtn.addEventListener('click', async () => {
  clearMessage(whatsappMessage);
  if (!requireSession(whatsappMessage)) return;
  const botId = getSelectedBotId();
  if (!botId) {
    showMessage(whatsappMessage, 'اختر بوتاً أولاً.');
    return;
  }

  try {
    await apiRequest(`/api/whatsapp/${botId}/disconnect`, {
      method: 'POST'
    });
    showMessage(whatsappMessage, 'تم فصل واتساب.', false);
    refreshWhatsappStatus();
    if (whatsappPollTimer) {
      clearInterval(whatsappPollTimer);
      whatsappPollTimer = null;
    }
  } catch (error) {
    showMessage(whatsappMessage, error.message || 'فشل فصل واتساب.');
  }
});

whatsappStatusBtn.addEventListener('click', () => {
  refreshWhatsappStatus();
});

logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
});

supabase.auth.onAuthStateChange((_event, session) => {
  currentSession = session;
  toggleViews(session);
  loadBots(session);
});

const init = async () => {
  const { data } = await supabase.auth.getSession();
  currentSession = data.session;
  updateAuthButton();
  toggleViews(data.session);
  switchTab('bots');
  loadBots(data.session);
  loadFiles('');
};

init();
