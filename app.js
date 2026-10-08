/* ============================================================
   蛋仔单词本 · Eggy Vocab
   - 艾宾浩斯遗忘曲线 (9 级) 驱动的单词记忆
   - 纯前端，多平台网页可访问
   - 云同步：房间码 (paste.rs 匿名存储) + JSON/CSV 导入导出
   ============================================================ */

(() => {
  "use strict";

  // ─────────── 常量 ───────────
  const STORE_KEY = "eggy_vocab_state_v2";   // v2 = 日语课本词库
  const PREFS_KEY = "eggy_vocab_prefs_v1";
  const DAY_MS = 24 * 60 * 60 * 1000;
  const DAILY_PRACTICE_SECONDS = 15 * 60;
  const WEEKLY_PRACTICE_SECONDS = 75 * 60;
  const MAX_QUESTION_SECONDS = 3 * 60;
  const SEED = window.SEED_WORDS || {};
  const EN = window.SEED_EN || {};   // 课本英语注释
  // 打包离线版会在 index.html 标记此模式：不允许任何数据上传或网络请求。
  const OFFLINE_MODE = document.documentElement.dataset.eggyOffline === "true";

  // ─────────── 艾宾浩斯 9 级曲线 (间隔) ───────────
  const EBB = [
    { level: 0, label: "第1次", interval: 5 * 60 * 1000,        hint: "5 分钟" },
    { level: 1, label: "第2次", interval: 30 * 60 * 1000,       hint: "30 分钟" },
    { level: 2, label: "第3次", interval: 12 * 60 * 60 * 1000,  hint: "12 小时" },
    { level: 3, label: "第4次", interval: 1 * DAY_MS,           hint: "1 天" },
    { level: 4, label: "第5次", interval: 2 * DAY_MS,           hint: "2 天" },
    { level: 5, label: "第6次", interval: 4 * DAY_MS,           hint: "4 天" },
    { level: 6, label: "第7次", interval: 7 * DAY_MS,           hint: "7 天" },
    { level: 7, label: "第8次", interval: 15 * DAY_MS,          hint: "15 天" },
    { level: 8, label: "第9次", interval: 30 * DAY_MS,          hint: "30 天" }
  ];
  const GRAD_LEVEL = 9; // 走完 9 级 = 毕业

  // ─────────── 初始 state ───────────
  const newState = () => ({
    schema: 2,
    words: {},            // term(lowercase) → word object
    order: [],            // 添加顺序的 key 列表
    history: [],          // 每日统计
    practice: {},         // YYYY-MM-DD -> { deviceId: seconds }，跨设备按设备累计
    streak: { current: 0, best: 0, lastDay: null },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    deviceId: makeId("device")
  });

  const newWord = (term, cn) => ({
    term,                 // 原样显示
    key: term.toLowerCase().trim(),
    cn: cn || "",
    reading: "",          // 日语罗马字读音
    pos: "",
    forms: {},            // { "漢字":..., ... }
    examples: [],         // [{en, cn}]
    level: 0,             // 0..8 (已复习次数-1), -1 表示未开始
    due: Date.now(),      // 下次复习时间戳
    graduated: false,
    totalReviews: 0,
    correct: 0,
    lapses: 0,
    addedAt: Date.now(),
    reviewedAt: 0,         // 最近一次真实作答；跨设备冲突时以它为准
    updatedAt: Date.now(),
    contentUpdatedAt: Date.now()
  });

  // ─────────── prefs ───────────
  const defaultPrefs = () => ({
    dailyGoal: 20,
    reviewPerRound: 10,
    graduation: "curve",         // "curve" | "5times"
    kanaRatio: 0.5,              // 拼读音（拼写）题占比，默认 50%
    autoTTS: true,
    ttsRate: 0.9,
    ttsVoice: "ja-JP",
    gistToken: "",               // GitHub personal token (gist 权限)
    gistId: "",                  // Gist ID（首次推送自动创建）
    lastSyncAt: null,
    roomCode: "",                // 房间码 (textdb.dev 免登录同步)
    roomHistory: [],             // 本设备用过的房间码（误建新房间后可找回）
    lastRoomSyncAt: null,
    apiTranslate: "https://api.mymemory.translated.net/get?q={w}&langpair=ja|zh-CN",
    apiExamples: ""              // 留空 = 用内置种子库
  });

  // ─────────── 存储 ───────────
  // 不把同步凭证混进状态；所有 ID 都优先使用浏览器加密随机数。
  function makeId(prefix) {
    const bytes = new Uint8Array(12);
    if (window.crypto?.getRandomValues) {
      window.crypto.getRandomValues(bytes);
      return `${prefix}-${Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("")}`;
    }
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
  const load = (k, fb) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : fb(); } catch (_) { return fb(); } };
  const save = (k, v) => {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; }
    catch (_) { return false; }
  };

  let state = load(STORE_KEY, newState);
  let prefs = Object.assign(defaultPrefs(), load(PREFS_KEY, () => ({})));

  function normalizeState() {
    if (!state || typeof state !== "object") state = newState();
    if (!state.words || typeof state.words !== "object") state.words = {};
    if (!Array.isArray(state.order)) state.order = Object.keys(state.words);
    if (!Array.isArray(state.history)) state.history = [];
    if (!state.practice || typeof state.practice !== "object" || Array.isArray(state.practice)) state.practice = {};
    if (!state.streak || typeof state.streak !== "object") state.streak = { current: 0, best: 0, lastDay: null };
    if (!state.deviceId) state.deviceId = makeId("device");
    state.schema = 2;
    Object.keys(state.practice).forEach(day => {
      const devices = state.practice[day];
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !devices || typeof devices !== "object" || Array.isArray(devices)) {
        delete state.practice[day]; return;
      }
      Object.keys(devices).forEach(deviceId => {
        const seconds = Math.max(0, Math.round(Number(devices[deviceId]) || 0));
        if (seconds) devices[deviceId] = seconds;
        else delete devices[deviceId];
      });
    });
    Object.values(state.words).forEach(w => {
      if (!w || typeof w !== "object") return;
      w.reviewedAt = Number(w.reviewedAt || 0);
      w.updatedAt = Number(w.updatedAt || w.reviewedAt || w.addedAt || 0);
      w.contentUpdatedAt = Number(w.contentUpdatedAt || w.addedAt || 0);
    });
  }
  normalizeState();
  function persist() {
    state.updatedAt = Date.now();
    if (!save(STORE_KEY, state)) setTimeout(() => toast("本机存储空间不足，请立即导出 JSON 备份", "rose"), 0);
  }
  function persistPrefs() {
    if (!save(PREFS_KEY, prefs)) setTimeout(() => toast("设置未能保存，请检查浏览器存储空间", "rose"), 0);
  }

  // ─────────── 课本词库预置 (首次运行注入 Lesson 3 全部词汇) ───────────
  function seedIfEmpty() {
    if (Object.keys(state.words).length > 0) return;
    Object.keys(SEED).forEach(t => {
      const s = SEED[t];
      const w = newWord(t, s.cn);
      w.pos = s.pos || "";
      w.reading = s.reading || "";
      w.en = EN[t] || "";
      if (s.kanji) w.forms["漢字"] = s.kanji;
      w.examples = (s.examples || []).map(e => ({ en: e.en, cn: e.cn }));
      w.level = -1; // 未开始
      w.due = Date.now();
      state.words[w.key] = w;
      state.order.push(w.key);
    });
    persist();
  }
  seedIfEmpty();

  // 英语释义迁移：已有进度数据自动补 en 字段（一次性）
  (function migrateEn() {
    let n = 0;
    Object.values(state.words).forEach(w => {
      if (w.en === undefined) { w.en = EN[w.term] || EN[w.key] || ""; n++; }
    });
    if (n) persist();
  })();

  // 释义显示：英语优先（课本注释），中文辅助
  function glossOf(w) {
    if (!w) return "（无释义）";
    const parts = [];
    if (w.en) parts.push(w.en);
    if (w.cn) parts.push(w.cn);
    return parts.join(" · ") || "（无释义）";
  }

  // 出题时把释义里与答案相同的假名替换为 ◯，防止释义本身泄露读音/写法
  function maskAnswer(text, answer) {
    if (!text || !answer) return text || "";
    let out = "";
    for (const ch of text) out += answer.includes(ch) ? "◯" : ch;
    return out;
  }

  // ─────────── 课本顺序索引（SEED 的键顺序 = 课本出现顺序） ───────────
  const SEED_RANK = {};
  Object.keys(SEED).forEach((k, i) => { SEED_RANK[k] = i; });

  // ─────────── TTS ───────────
  let voiceCache = null;
  let jaWarned = false;
  function pickVoice(lang) {
    if (!("speechSynthesis" in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    voiceCache = voices.find(v => new RegExp("^" + lang.replace("-", "[-_]"), "i").test(v.lang)) ||
                 voices.find(v => new RegExp(lang.split("-")[0], "i").test(v.lang)) ||
                 voices[0] || null;
    return voiceCache;
  }
  function japaneseVoiceAvailable() {
    if (!("speechSynthesis" in window)) return false;
    return window.speechSynthesis.getVoices().some(v => /^ja/i.test(v.lang));
  }
  if ("speechSynthesis" in window) window.speechSynthesis.onvoiceschanged = () => { voiceCache = null; };
  let recordedAudio = null;
  let speechRequest = 0;
  function speak(text, lang) {
    const request = ++speechRequest;
    if (recordedAudio) { recordedAudio.pause(); recordedAudio = null; }
    window.speechSynthesis?.cancel();
    const path = window.EGGY_AUDIO?.[text];
    if (path && (!lang || /^ja/i.test(lang))) {
      const audio = new Audio(path);
      recordedAudio = audio;
      audio.playbackRate = Math.min(1.4, Math.max(0.6, Number(prefs.ttsRate) || 0.95)) / 0.95;
      audio.play().catch(() => {
        if (request === speechRequest) toast("音频播放失败，请再点一次朗读，并确认 audio 文件夹完整", "rose");
      });
      return;
    }
    if (!text || !("speechSynthesis" in window)) { if (text) toast("本设备不支持朗读", "rose"); return; }
    try {
      const target = lang || prefs.ttsVoice || "ja-JP";
      // 日语朗读前自检：没有日语语音包时明确提醒，避免用中文/英语声音读出乱音
      if (/^ja/i.test(target) && !japaneseVoiceAvailable()) {
        toast("这个自定义词没有配音，本设备也未安装日语语音", "rose");
        return;
      }
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = target;
      u.rate = prefs.ttsRate || 0.95;
      const v = pickVoice(u.lang);
      if (v) u.voice = v;
      window.speechSynthesis.speak(u);
    } catch (_) {}
  }

  // ─────────── 工具 ───────────
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = $("#root");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  const todayKey = (ts = Date.now()) => { const d = new Date(ts); d.setHours(0,0,0,0); return d.getTime(); };
  const localDateKey = (ts = Date.now()) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  function practiceSecondsForDate(day) {
    return Object.values(state.practice?.[day] || {}).reduce((sum, seconds) => sum + Math.max(0, Number(seconds) || 0), 0);
  }
  function addPracticeSeconds(seconds) {
    const amount = Math.max(0, Math.min(MAX_QUESTION_SECONDS, Math.round(Number(seconds) || 0)));
    if (!amount) return 0;
    const day = localDateKey();
    const deviceId = state.deviceId || "legacy-device";
    state.practice[day] ||= {};
    state.practice[day][deviceId] = Math.max(0, Number(state.practice[day][deviceId]) || 0) + amount;
    const keep = Object.keys(state.practice).sort().slice(-400);
    const keepSet = new Set(keep);
    Object.keys(state.practice).forEach(k => { if (!keepSet.has(k)) delete state.practice[k]; });
    persist();
    return amount;
  }
  function formatPracticeTime(seconds, compact = false) {
    const total = Math.max(0, Math.round(Number(seconds) || 0));
    if (compact) return `${Math.round(total / 60)} 分钟`;
    if (total < 60) return `${total} 秒`;
    const minutes = Math.floor(total / 60), remain = total % 60;
    return remain ? `${minutes}分${remain}秒` : `${minutes}分钟`;
  }

  let toastTimer = null;
  function toast(msg, kind = "") {
    const el = $("#toast");
    el.textContent = msg;
    el.className = "toast show " + kind;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2000);
  }

  // ─────────── 艾宾浩斯调度 ───────────
  function dueOfWord(w) {
    if (w.graduated) return null;
    if (w.level < 0) return w.due; // 未开始
    return w.due;
  }
  function scheduleNext(w, correct) {
    const now = Date.now();
    w.totalReviews++;
    w.reviewedAt = now;
    w.updatedAt = now;
    if (correct) {
      w.correct++;
      // 完成第 9 档的 30 天复习后才毕业。旧逻辑在排到 30 天前就毕业了。
      if (w.level >= GRAD_LEVEL - 1 && prefs.graduation === "curve") {
        w.graduated = true;
        w.due = null;
      } else if (prefs.graduation === "5times" && w.correct >= 5) {
        w.graduated = true;
        w.due = null;
      } else {
        w.level = Math.min(GRAD_LEVEL - 1, w.level + 1);
        const idx = Math.max(0, w.level);
        w.due = now + EBB[Math.min(idx, EBB.length - 1)].interval;
      }
    } else {
      w.lapses++;
      w.level = Math.max(-1, w.level - 2); // 倒退 2 级
      // 立刻重来：30 秒后再次出现
      w.due = now + 30 * 1000;
    }
    persist();
  }

  function dueWords(limit) {
    const now = Date.now();
    return Object.values(state.words)
      .filter(w => !w.graduated && (w.level < 0 || (w.due && w.due <= now)))
      .sort((a, b) => (a.due || 0) - (b.due || 0))
      .slice(0, limit || prefs.reviewPerRound);
  }

  function reviewCount() { return dueWords(99999).length; }
  function graduatedList() { return Object.values(state.words).filter(w => w.graduated); }

  // ─────────── streak ───────────
  function bumpStreak() {
    const t = todayKey();
    const last = state.streak.lastDay;
    if (!last) { state.streak = { current: 1, best: 1, lastDay: t }; }
    else if (t === last) { /* 已计 */ }
    else if (t - last <= 2 * DAY_MS) { state.streak.current++; state.streak.best = Math.max(state.streak.best, state.streak.current); state.streak.lastDay = t; }
    else { state.streak = { current: 1, best: Math.max(state.streak.best, 1), lastDay: t }; }
    persist();
  }

  // ─────────── 路由 ───────────
  let currentTab = "words";
  let session = null; // {queue, idx, results}
  let practiceMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  let questionTimer = null;

  function beginQuestionTiming() {
    questionTimer = {
      visibleSince: document.visibilityState === "visible" ? Date.now() : 0,
      activeMs: 0,
      answered: false
    };
  }
  function pauseQuestionTiming(now = Date.now()) {
    if (!questionTimer || questionTimer.answered || !questionTimer.visibleSince) return;
    questionTimer.activeMs += Math.max(0, now - questionTimer.visibleSince);
    questionTimer.visibleSince = 0;
  }
  function resumeQuestionTiming(now = Date.now()) {
    if (!questionTimer || questionTimer.answered || questionTimer.visibleSince) return;
    questionTimer.visibleSince = now;
  }
  function recordAnsweredQuestion() {
    if (!questionTimer || questionTimer.answered) return 0;
    pauseQuestionTiming();
    questionTimer.answered = true;
    const seconds = Math.min(MAX_QUESTION_SECONDS, Math.max(1, Math.round(questionTimer.activeMs / 1000)));
    if (session) session.practiceSeconds = (session.practiceSeconds || 0) + seconds;
    return addPracticeSeconds(seconds);
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") resumeQuestionTiming();
    else pauseQuestionTiming();
  });

  function setTab(t) {
    // 复习进行中点其它 Tab：确认后放弃本轮并真正切换
    if (session && !session.done) {
      if (!confirm("复习还没做完，确定要退出吗？\n（已答过的题进度保留，没答完的不计入本轮）")) return;
      questionTimer = null;
      session = null;
    }
    currentTab = t;
    $$("#tabbar button").forEach(b => b.classList.toggle("active", b.dataset.tab === t));
    render();
  }
  $("#tabbar").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    setTab(b.dataset.tab);
  });

  function updateBadges() {
    const due = reviewCount();
    $("#dotReview").classList.toggle("show", due > 0);
    $("#dotReview").textContent = "";
    // 今日目标改为实际做题时间（打开页面不计时）
    const todayMinutes = Math.round(practiceSecondsForDate(localDateKey()) / 60);
    $("#todayGoalBadge").textContent = `🎯 ${todayMinutes}/15分`;
  }

  function render() {
    updateBadges();
    if (session && !session.done) return renderStudy();
    if (session && session.done) return renderComplete();
    switch (currentTab) {
      case "words":     return renderWords();
      case "review":    return renderReview();
      case "library":   return renderLibrary();
      case "graduated": return renderGraduated();
      case "practice":  return renderPracticeHistory();
      case "settings":  return renderSettings();
    }
  }

  // ================================================================
  //  TAB 1 · 单词
  // ================================================================
  function renderWords() {
    const total = Object.keys(state.words).length;
    const due = reviewCount();
    const grad = graduatedList().length;
    const todayDone = (state.history.find(h => h.date === todayKey()) || {}).reviewed || 0;

    root.innerHTML = `
      <div class="stat-strip">
        <div class="s"><div class="v">${total}</div><div class="l">单词</div></div>
        <div class="s"><div class="v">${due}</div><div class="l">待复习</div></div>
        <div class="s"><div class="v">${grad}</div><div class="l">已毕业</div></div>
        <div class="s"><div class="v">${todayDone}</div><div class="l">今日</div></div>
        <div class="s"><div class="v">${state.streak.current}</div><div class="l">连续</div></div>
      </div>

      <div class="card">
        <div class="card-head"><h2>快速添加</h2><span class="sub">输入日语词 + 中文，回车即存</span></div>
        <div class="quick-add">
          <div class="inputs">
            <input id="termInp" placeholder="日语词汇，如 かぞく" autocomplete="off" autocapitalize="off" spellcheck="false"/>
            <input id="cnInp" placeholder="中文意思（可留空自动补全）" autocomplete="off"/>
          </div>
          <div class="row">
            <button class="btn btn-pink" id="addBtn">＋ 加入单词本</button>
            <button class="btn btn-egg" id="batchBtn">批量</button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <h2>我的单词</h2>
          <span class="sub">${total} 词</span>
        </div>
        <div class="filter-row">
          <input id="searchInp" placeholder="🔍 搜索单词..." style="flex:1;padding:8px 12px;border:1.5px solid var(--line-strong);border-radius:999px;font-size:13px;background:var(--panel-2);outline:none"/>
          <select id="sortSel" style="padding:8px 12px;border:1.5px solid var(--line-strong);border-radius:999px;font-size:13px;background:var(--panel-2);outline:none">
            <option value="textbook" selected>课本顺序</option>
            <option value="recent">最近添加</option>
            <option value="due">待复习优先</option>
            <option value="alpha">五十音顺序</option>
          </select>
        </div>
        <div class="word-grid" id="wordGrid"></div>
      </div>
    `;

    // 添加单词
    $("#addBtn").addEventListener("click", addWord);
    $("#termInp").addEventListener("keydown", e => { if (e.key === "Enter") addWord(); });
    $("#cnInp").addEventListener("keydown", e => { if (e.key === "Enter") addWord(); });
    $("#batchBtn").addEventListener("click", () => {
      const text = prompt("批量添加：每行一个词，用逗号/空格/制表符分隔日语和中文。\n例如：\nかぞく 家人\nがっこう 学校\nにほんじん,日本人");
      if (!text) return;
      const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);
      let n = 0;
      lines.forEach(line => {
        const parts = line.split(/[,\t，、:：|]|\s{2,}/).map(s => s.trim()).filter(Boolean);
        if (parts.length >= 2) { addTerm(parts[0], parts[1]); n++; }
        else if (parts.length === 1) { addTerm(parts[0], ""); n++; }
      });
      toast(`已添加 ${n} 个单词`, "gold");
      render();
    });

    // 搜索/排序
    $("#searchInp").addEventListener("input", drawGrid);
    $("#sortSel").addEventListener("change", drawGrid);

    drawGrid();
  }

  async function addWord() {
    const term = $("#termInp").value.trim();
    let cn = $("#cnInp").value.trim();
    if (!term) { toast("请输入单词", "rose"); return; }
    addTerm(term, cn);
    $("#termInp").value = ""; $("#cnInp").value = "";
    // 自动联网补释义
    if (!cn) {
      const auto = await fetchTranslation(term);
      if (auto) { const w = state.words[term.toLowerCase().trim()]; if (w && !w.cn) { w.cn = auto; persist(); } }
    }
    // 自动补例句
    const w = state.words[term.toLowerCase().trim()];
    if (w && w.examples.length === 0) {
      const ex = await fetchExamples(term);
      if (ex && ex.length) { w.examples = ex; persist(); }
    }
    toast(`已添加「${term}」`, "gold");
    render();
  }

  function addTerm(term, cn) {
    const key = term.toLowerCase().trim();
    if (!key) return null;
    if (state.words[key]) { toast(`「${term}」已存在`, "rose"); return null; }
    const w = newWord(term, cn);
    // 从课本词库补全
    const s = SEED[key];
    if (s) {
      if (!cn) w.cn = s.cn;
      w.pos = s.pos || "";
      w.reading = s.reading || "";
      w.en = EN[key] || "";
      if (s.kanji) w.forms["漢字"] = s.kanji;
      w.examples = (s.examples || []).map(e => ({ en: e.en, cn: e.cn }));
    }
    w.level = -1;
    w.due = Date.now();
    state.words[key] = w;
    state.order.push(key);
    persist();
    return w;
  }

  function drawGrid() {
    const grid = $("#wordGrid"); if (!grid) return;
    const q = ($("#searchInp")?.value || "").toLowerCase().trim();
    const sort = $("#sortSel")?.value || "textbook";
    let list = Object.values(state.words);
    if (q) list = list.filter(w => w.term.toLowerCase().includes(q.toLowerCase()) || (w.cn || "").includes(q) || (w.en || "").toLowerCase().includes(q.toLowerCase()));
    if (sort === "textbook") {
      // 课本出现顺序：SEED 里的词按课本顺序，自己加的词排在课本词后面（按添加顺序）
      list.sort((a, b) => {
        const ra = SEED_RANK[a.key] !== undefined ? SEED_RANK[a.key] : 100000 + Math.max(0, state.order.indexOf(a.key));
        const rb = SEED_RANK[b.key] !== undefined ? SEED_RANK[b.key] : 100000 + Math.max(0, state.order.indexOf(b.key));
        return ra - rb;
      });
    }
    else if (sort === "recent") list.sort((a, b) => state.order.indexOf(b.key) - state.order.indexOf(a.key));
    else if (sort === "due") list.sort((a, b) => (a.due || 0) - (b.due || 0));
    else list.sort((a, b) => a.term.localeCompare(b.term, "ja"));

    grid.innerHTML = list.map(w => {
      const isDue = !w.graduated && (w.level < 0 || (w.due && w.due <= Date.now()));
      const badge = w.graduated ? '<span class="lv-badge grad">🎓 毕业</span>'
        : (w.level < 0 ? '<span class="lv-badge">新词</span>' : `<span class="lv-badge">Lv.${w.level + 1}</span>`);
      const dueTag = w.graduated ? '<span class="due-tag done">已掌握</span>'
        : isDue ? '<span class="due-tag">待复习</span>'
        : '<span class="due-tag soon">' + fmtDue(w.due) + '</span>';
      return `
        <div class="word-card" data-key="${esc(w.key)}">
          ${badge}
          <div class="term">${esc(w.term)}</div>
          ${w.reading ? `<div class="cn" style="opacity:.65;font-size:11px">${esc(w.reading)}</div>` : ""}
          <div class="cn">${esc(glossOf(w))}</div>
          ${dueTag}
        </div>`;
    }).join("") || `<div class="empty" style="grid-column:1/-1"><span class="egg">🥚</span>还没有单词，快添加几个吧！</div>`;

    $$(".word-card", grid).forEach(c => c.addEventListener("click", () => openWordModal(state.words[c.dataset.key])));
  }

  function fmtDue(ts) {
    if (!ts) return "—";
    const diff = ts - Date.now();
    if (diff <= 0) return "现在";
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m} 分钟后`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} 小时后`;
    const d = Math.floor(h / 24);
    return `${d} 天后`;
  }

  // ================================================================
  //  TAB 2 · 开始复习
  // ================================================================
  function renderReview() {
    const due = dueWords(prefs.reviewPerRound);
    if (due.length === 0) {
      root.innerHTML = `
        <div class="card empty">
          <span class="egg">🥚</span>
          <h2 style="margin:6px 0">暂无需要复习的单词</h2>
          <p class="muted">去「单词」页添加新词，或等一会儿艾宾浩斯曲线会安排到期复习。</p>
          <button class="btn btn-pink" id="goAddBtn">去添加单词</button>
        </div>`;
      $("#goAddBtn").addEventListener("click", () => setTab("words"));
      return;
    }
    root.innerHTML = `
      <div class="card" style="text-align:center">
        <div class="card-head"><h2>开始复习</h2><span class="sub">${due.length} 词 · 本轮</span></div>
        <p class="muted">答对升 1 级、答错降 2 级。完成 30 天后的最终复习才毕业 🎓</p>
        <p class="muted" style="margin-bottom:14px">今日做题时间：${formatPracticeTime(practiceSecondsForDate(localDateKey()), true)} / 15 分钟</p>
        <button class="btn btn-pink lg" id="startBtn">开始复习 →</button>
      </div>
      <div class="card">
        <div class="card-head"><h2>艾宾浩斯曲线</h2></div>
        <table class="ebb-table">
          <tr><th>复习</th><th>间隔</th><th>说明</th></tr>
          ${EBB.map(e => `<tr class="${e.level===0?'cur':''}"><td>${e.label}</td><td>${e.hint}</td><td>${ebbDesc(e.level)}</td></tr>`).join("")}
          <tr><td><b>30 天后答对</b></td><td>🎓</td><td>毕业，进入长期记忆</td></tr>
        </table>
      </div>`;
    $("#startBtn").addEventListener("click", startSession);
  }

  function ebbDesc(i) {
    const map = ["刚学完，马上要考", "短时巩固", "睡前再想一遍", "次日回顾", "隔天再认", "四天后巩固", "一周关键节点", "半月巩固", "一月长期记忆"];
    return map[i] || "";
  }

  function startSession() {
    session = {
      queue: dueWords(prefs.reviewPerRound),
      idx: 0,
      results: [],
      startTime: Date.now(),
      practiceSeconds: 0,
      done: false
    };
    if (session.queue.length === 0) { session = null; toast("暂无待复习", "gold"); setTab("review"); return; }
    bumpStreak();
    render();
  }

  // ================================================================
  //  学习引擎
  // ================================================================
  function renderStudy() {
    const w = session.queue[session.idx];
    if (!w) { finishSession(); return; }

    const mode = pickMode(w);
    root.innerHTML = `
      <div class="dots-row">
        <div class="dots">${session.queue.map((_, i) =>
          `<span class="dot ${i < session.idx ? "done" : ""} ${i === session.idx ? "active" : ""}"></span>`).join("")}
        </div>
        <button class="quit-btn" id="quitBtn">✕ 退出</button>
      </div>
      <div class="study-card" id="studyCard">
        <span class="tag">${modeLabel(mode)}</span>
        <span class="lvl">${w.level < 0 ? "新词" : "Lv." + (w.level + 1)}</span>
        <div id="studyBody"></div>
      </div>
    `;
    beginQuestionTiming();
    $("#quitBtn").addEventListener("click", () => {
      if (!confirm("复习还没做完，确定要退出吗？\n（已答过的题进度保留，没答完的不计入本轮）")) return;
      questionTimer = null;
      session = null;
      setTab("review");
    });
    mountMode(mode, w);
  }

  function pickMode(w) {
    const r = Math.random();
    // 拼读音（日语特有的拼写测试）：默认占一半 —— 点击五十音拼出读音，最练拼写
    let ratio = (typeof prefs.kanaRatio === "number") ? prefs.kanaRatio : 0.5;
    ratio = Math.min(0.9, Math.max(0, ratio));
    // 读音过长的词（>9 个假名，如 ちゅうがくいちねんせい）不出拼写题，避免孩子受挫；改用其他题型
    const len = ((w && w.term) || "").replace(/[～~]/g, "").length;
    const canSpell = len > 0 && len <= 9;
    if (canSpell && r < ratio) return "kana";
    // 剩余部分在 翻卡 / 日→中 / 中→日 / 听力 之间分配
    const rest = (r - (canSpell ? ratio : 0)) / Math.max(0.0001, 1 - (canSpell ? ratio : 0));
    if (rest < 0.22) return "flashcard";
    if (rest < 0.55) return "en2cn";      // 看日语选中文
    if (rest < 0.85) return "cn2en";      // 看中文选日语
    return "listening";                   // 听音选
  }
  function modeLabel(m) {
    return { flashcard: "翻卡", en2cn: "日→中", cn2en: "中→日", listening: "听力", kana: "拼读音" }[m];
  }

  function mountMode(mode, w) {
    const body = $("#studyBody");
    if (mode === "flashcard") return mountFlashcard(body, w);
    if (mode === "en2cn") return mountChoice(body, w, "en2cn");
    if (mode === "cn2en") return mountChoice(body, w, "cn2en");
    if (mode === "listening") return mountListening(body, w);
    if (mode === "kana") return mountKanaBuild(body, w);
  }

  // 翻卡
  function mountFlashcard(body, w) {
    body.innerHTML = `
      <div class="big">${esc(w.term)}</div>
      ${w.reading ? `<div class="sub" style="opacity:.7">${esc(w.reading)}</div>` : ""}
      <div class="sub">${esc(glossOf(w))}</div>
      <div class="speaker" id="spk">🔊</div>
      <p class="muted" style="margin-top:16px">先在心里回忆释义，再自评</p>
      <div class="ctl-grid">
        <button class="ctl again" id="ctlAgain">😰 不记得</button>
        <button class="ctl good" id="ctlGood">😊 记得</button>
      </div>
    `;
    $("#spk").addEventListener("click", () => speak(w.term));
    $("#ctlAgain").addEventListener("click", () => grade(w, false, "flashcard"));
    $("#ctlGood").addEventListener("click", () => grade(w, true, "flashcard"));
  }

  // 选择题
  function mountChoice(body, w, dir) {
    const distract = pickDistractors(w, 12);
    const isEn2Cn = dir === "en2cn";
    const stem = isEn2Cn ? w.term : maskAnswer(glossOf(w), w.term);
    const correctVal = isEn2Cn ? maskAnswer(glossOf(w), w.term) : w.term;
    // 选项文本去重：干扰项若与正确答案或彼此文本相同则剔除
    const opts = [correctVal];
    for (const x of distract) {
      if (opts.length >= 4) break;
      const t = isEn2Cn ? maskAnswer(glossOf(x), w.term) : x.term;
      if (!opts.includes(t)) opts.push(t);
    }
    const options = shuffle(opts);
    body.innerHTML = `
      <div class="big">${esc(stem)}</div>
      <div class="sub">${isEn2Cn ? "选出正确的意思" : "选出正确的日语词汇"}</div>
      <div class="choices" id="choices">
        ${options.map(o => `<button class="choice" data-val="${esc(o)}">${esc(o)}</button>`).join("")}
      </div>
    `;
    $$(".choice", body).forEach(btn => {
      btn.addEventListener("click", () => {
        const isRight = btn.dataset.val === correctVal;
        $$(".choice", body).forEach(b => {
          b.disabled = true;
          if (b.dataset.val === correctVal) b.classList.add("right");
          else if (b === btn) b.classList.add("wrong");
        });
        if (prefs.autoTTS) speak(w.term);
        recordAnsweredQuestion();
        addNextBtn(body, w, isRight, dir);
      });
    });
  }

  // 听力
  function mountListening(body, w) {
    const distract = pickDistractors(w, 3);
    const options = shuffle([w, ...distract].map(x => x.term));
    body.innerHTML = `
      <div class="big" style="color:var(--ink-soft)">🔊 听音选择</div>
      <div class="sub">点击播放，选出你听到的单词</div>
      <button class="btn btn-egg" id="playBtn" style="margin-top:12px">▶ 播放发音</button>
      <div class="choices" id="choices">
        ${options.map(o => `<button class="choice" data-val="${esc(o)}">${esc(o)}</button>`).join("")}
      </div>
    `;
    const play = () => speak(w.term);
    $("#playBtn").addEventListener("click", play);
    setTimeout(play, 200);
    $$(".choice", body).forEach(btn => {
      btn.addEventListener("click", () => {
        const isRight = btn.dataset.val === w.term;
        $$(".choice", body).forEach(b => {
          b.disabled = true;
          if (b.dataset.val === w.term) b.classList.add("right");
          else if (b === btn) b.classList.add("wrong");
        });
        recordAnsweredQuestion();
        addNextBtn(body, w, isRight, "listening");
      });
    });
  }

  function pickDistractors(w, n) {
    const pool = Object.values(state.words).filter(x => x.key !== w.key);
    return shuffle(pool).slice(0, n);
  }

  // 拼读音（日语特有考察）：上面显示汉字，下方点击五十音图按键拼出正确读音
  function mountKanaBuild(body, w) {
    // 「～」是助词/后缀标记，不参与拼写，只拼假名部分（如 ぎりの～ → 拼 ぎりの）
    const answer = (w.term || "").replace(/[～~]/g, "");
    const kanji = (w.forms && (w.forms["漢字"] || w.forms["汉字"])) || "";
    // 有汉字写法 → 大字显示汉字；纯假名词（如 かぞく）→ 显示释义，绝不显示答案本身
    const hasKanji = kanji && kanji !== answer;
    const promptBig = hasKanji
      ? `<div class="big" style="letter-spacing:.06em">${esc(kanji)}</div>`
      : `<div class="big" style="font-size:22px;line-height:1.4">${esc(maskAnswer(w.en || w.cn || "这个词", w.term))}</div>`;
    const promptSub = hasKanji
      ? esc(maskAnswer(glossOf(w), w.term))
      : "拼出这个词的日语读法";
    const KANA_ORDER =
      "あいうえお" +
      "かきくけこがぎぐげご" +
      "さしすせそざじずぜぞ" +
      "たちつてとだぢづでど" +
      "なにぬねの" +
      "はひふへほばびぶべぼぱぴぷぺぽ" +
      "まみむめも" +
      "やゆよゃゅょ" +
      "らりるれろ" +
      "わをんっー";
    const need = Array.from(new Set(answer.split("")));
    // 干扰键：从五十音图里随机补足，让键盘保持在 14~20 个键（孩子友好）
    const extraPool = KANA_ORDER.split("").filter(c => !need.includes(c));
    const extras = shuffle(extraPool).slice(0, Math.max(8, 16 - need.length));
    // 若读音里含片假名（如 アメリカじん），追加片假名键 + 片假名干扰键
    const kataNeed = need.filter(c => !KANA_ORDER.includes(c));
    const kataPool = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン".split("").filter(c => !need.includes(c));
    const kataExtras = kataNeed.length ? shuffle(kataPool).slice(0, 6) : [];
    const ordOf = c => { const i = KANA_ORDER.indexOf(c); return i < 0 ? 1000 + c.charCodeAt(0) : i; };
    const keys = [...need, ...extras, ...kataExtras].sort((a, b) => ordOf(a) - ordOf(b));

    body.innerHTML = `
      ${promptBig}
      <div class="sub">${promptSub}</div>
      <div class="kana-slots" id="kanaSlots">
        ${answer.split("").map(() => `<span class="kana-slot"></span>`).join("")}
      </div>
      <div class="kana-msg" id="kanaMsg"></div>
      <div class="kana-pad" id="kanaPad">
        ${keys.map(k => `<button class="kana-key" data-k="${esc(k)}">${esc(k)}</button>`).join("")}
      </div>
      <div class="row" style="justify-content:center;margin-top:12px">
        <button class="btn btn-ghost" id="kanaDel">⌫ 删一个</button>
        <button class="btn btn-ghost" id="kanaClear">清空</button>
      </div>
    `;

    let built = [];
    const slots = $$(".kana-slot", body);
    const msg = $("#kanaMsg");
    const paint = () => slots.forEach((s, i) => {
      s.textContent = built[i] || "";
      s.classList.toggle("filled", !!built[i]);
    });
    const lock = () => {
      $$(".kana-key", body).forEach(b => (b.disabled = true));
      $("#kanaDel").disabled = true;
      $("#kanaClear").disabled = true;
    };
    const check = () => {
      if (built.length < answer.length) return;
      const ok = built.join("") === answer;
      lock();
      // 逐字判分：拼对的假名标绿，拼错的假名标红，错在哪一目了然
      slots.forEach((s, i) => s.classList.add(built[i] === answer[i] ? "right" : "wrong"));
      msg.innerHTML = ok
        ? `<span class="ok">🎉 正确！${esc(w.term)}${w.reading ? ` <small>(${esc(w.reading)})</small>` : ""}</span>`
        : `<span class="no">红色假名拼错了。正确读音：<b>${esc(w.term)}</b>${w.reading ? ` <small>(${esc(w.reading)})</small>` : ""}</span>`;
      if (prefs.autoTTS) speak(w.term);
      recordAnsweredQuestion();
      addNextBtn(body, w, ok, "kana");
    };
    $$(".kana-key", body).forEach(btn => btn.addEventListener("click", () => {
      if (built.length >= answer.length) return;
      built.push(btn.dataset.k);
      paint();
      check();
    }));
    $("#kanaDel").addEventListener("click", () => { built.pop(); paint(); });
    $("#kanaClear").addEventListener("click", () => { built = []; paint(); });
    paint();
  }

  function pickDistractors(w, n) {
    const pool = Object.values(state.words).filter(x => x.key !== w.key);
    return shuffle(pool).slice(0, n);
  }
  function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  function grade(w, correct, mode) {
    recordAnsweredQuestion();
    scheduleNext(w, correct);
    session.results.push({ key: w.key, correct, mode });
    session.idx++;
    if (session.idx >= session.queue.length) finishSession();
    else render();
  }

  // 答题后停住显示结果，由用户点击「下一题」再继续（不再自动跳题）
  function addNextBtn(body, w, correct, mode) {
    const row = document.createElement("div");
    row.className = "next-row";
    row.innerHTML = `
      <span class="next-verdict ${correct ? "good" : "bad"}">${correct ? "🎉 答对了" : "❌ 答错了，看清楚再点下一步"}</span>
      <button class="btn btn-pink" id="nextBtn">下一题 →</button>
    `;
    body.appendChild(row);
    $("#nextBtn", body).addEventListener("click", () => grade(w, correct, mode));
  }

  function finishSession() {
    questionTimer = null;
    session.done = true;
    session.endTime = Date.now();
    const total = session.results.length;
    const correct = session.results.filter(r => r.correct).length;
    const today = todayKey();
    const rec = state.history.find(h => h.date === today);
    if (rec) { rec.reviewed += total; rec.correct += correct; }
    else state.history.push({ date: today, reviewed: total, correct });
    state.history = state.history.slice(-120);
    persist();
    render();
    // 有房间码时复习完自动上传进度
    if (prefs.roomCode) roomPush(true);
  }

  function renderComplete() {
    const total = session.results.length;
    const correct = session.results.filter(r => r.correct).length;
    const pct = total ? Math.round(correct / total * 100) : 0;
    const practiceTime = formatPracticeTime(session.practiceSeconds || 0);
    root.innerHTML = `
      <div class="card complete">
        <div class="egg">🥚</div>
        <h2>复习完成！</h2>
        <p class="muted">答对的词进入下一级，答错的会很快再见一次。</p>
        <div class="summary">
          <div class="stat"><div class="v">${total}</div><div class="l">复习数</div></div>
          <div class="stat"><div class="v">${pct}%</div><div class="l">正确率</div></div>
          <div class="stat"><div class="v" style="font-size:18px">${practiceTime}</div><div class="l">实际做题</div></div>
        </div>
        <div class="row" style="justify-content:center">
          <button class="btn btn-pink" id="againBtn">再来一轮</button>
          <button class="btn btn-ghost" id="backBtn">回到首页</button>
        </div>
      </div>`;
    $("#againBtn").addEventListener("click", () => { session = null; startSession(); });
    $("#backBtn").addEventListener("click", () => { session = null; setTab("words"); });
  }

  // ================================================================
  //  练习履历 · 只统计答题页显示到作答之间的可见时间
  // ================================================================
  function startOfWeek(date) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const mondayOffset = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - mondayOffset);
    return d;
  }
  function addCalendarDays(date, days) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    d.setDate(d.getDate() + days);
    return d;
  }
  function practiceForWeek(monday) {
    let seconds = 0;
    for (let i = 0; i < 7; i++) seconds += practiceSecondsForDate(localDateKey(addCalendarDays(monday, i)));
    return seconds;
  }
  function shortDate(date) { return `${date.getMonth() + 1}/${date.getDate()}`; }

  function renderPracticeHistory() {
    const now = new Date();
    const today = localDateKey(now);
    const todaySeconds = practiceSecondsForDate(today);
    const weekday = now.getDay() >= 1 && now.getDay() <= 5;
    const monthStart = new Date(practiceMonth.getFullYear(), practiceMonth.getMonth(), 1);
    const gridStart = startOfWeek(monthStart);
    const days = Array.from({ length: 42 }, (_, i) => addCalendarDays(gridStart, i));
    const thisWeek = startOfWeek(now);
    // Keep the weekly summary aligned with the six complete week rows shown
    // in the selected month's calendar, including the adjacent-month days.
    const calendarWeeks = Array.from({ length: 6 }, (_, i) => addCalendarDays(gridStart, i * 7));

    root.innerHTML = `
      <div class="practice-hero">
        <div>
          <div class="practice-kicker">本周学习目标</div>
          <div class="practice-big">${formatPracticeTime(practiceForWeek(thisWeek), true)} <span>/ 75 分钟</span></div>
          <div class="muted">周一到周五每天完成 15 分钟，周末可补做</div>
        </div>
        <div class="today-ring ${weekday && todaySeconds >= DAILY_PRACTICE_SECONDS ? "done" : ""}">
          <strong>${Math.round(todaySeconds / 60)}</strong><small>/15 分</small>
        </div>
      </div>

      <div class="card calendar-card">
        <div class="calendar-head">
          <button class="cal-nav" id="prevMonth" aria-label="上个月">‹</button>
          <div>
            <h2>${practiceMonth.getFullYear()}年 ${practiceMonth.getMonth() + 1}月</h2>
            <button class="cal-today" id="todayMonth">回到本月</button>
          </div>
          <button class="cal-nav" id="nextMonth" aria-label="下个月">›</button>
        </div>
        <div class="calendar-weekdays">${["一","二","三","四","五","六","日"].map(x => `<span>${x}</span>`).join("")}</div>
        <div class="calendar-grid">
          ${days.map(d => {
            const key = localDateKey(d);
            const seconds = practiceSecondsForDate(key);
            const isWeekday = d.getDay() >= 1 && d.getDay() <= 5;
            const met = isWeekday && seconds >= DAILY_PRACTICE_SECONDS;
            const outside = d.getMonth() !== practiceMonth.getMonth();
            const future = d > new Date(now.getFullYear(), now.getMonth(), now.getDate());
            return `<div class="cal-day ${outside ? "outside" : ""} ${future ? "future" : ""} ${!isWeekday ? "weekend" : ""} ${key === today ? "today" : ""}">
              <span class="cal-day-num ${met ? "met" : ""}">${d.getDate()}</span>
              <span class="cal-min">${seconds ? Math.round(seconds / 60) + "分" : ""}</span>
            </div>`;
          }).join("")}
        </div>
        <div class="calendar-legend"><span><i class="legend-dot"></i> 工作日满 15 分钟</span><span>周末时间计入 75 分钟目标</span></div>
      </div>

      <div class="card">
        <div class="card-head"><h2>${practiceMonth.getMonth() + 1}月日历周累计</h2><span class="sub">与上方日历对应，包含周末补做时间</span></div>
        <div class="weekly-list">
          ${calendarWeeks.map(monday => {
            const sunday = addCalendarDays(monday, 6);
            const seconds = practiceForWeek(monday);
            const met = seconds >= WEEKLY_PRACTICE_SECONDS;
            return `<div class="week-row ${met ? "met" : ""}">
              <div><strong>${shortDate(monday)}–${shortDate(sunday)}</strong><small>${monday.getTime() === thisWeek.getTime() ? "本周" : ""}</small></div>
              <div class="week-result"><b>${formatPracticeTime(seconds, true)}</b><span aria-label="${met ? "达标" : "未达标"}">${met ? "👍" : "😢"}</span></div>
            </div>`;
          }).join("")}
        </div>
      </div>

      <div class="card practice-note">
        <strong>计时规则</strong>
        <p>只统计题目显示后到完成作答之间、页面处于可见状态的时间；看答案后停留、打开网页不答题、切到后台都不计时。单题最多计 3 分钟。周六、周日的练习时间也会计入当周 75 分钟目标。</p>
      </div>`;

    $("#prevMonth").addEventListener("click", () => { practiceMonth = new Date(practiceMonth.getFullYear(), practiceMonth.getMonth() - 1, 1); renderPracticeHistory(); });
    $("#nextMonth").addEventListener("click", () => { practiceMonth = new Date(practiceMonth.getFullYear(), practiceMonth.getMonth() + 1, 1); renderPracticeHistory(); });
    $("#todayMonth").addEventListener("click", () => { practiceMonth = new Date(now.getFullYear(), now.getMonth(), 1); renderPracticeHistory(); });
  }

  // ================================================================
  //  TAB 3 · 复习库
  // ================================================================
  function renderLibrary() {
    const due = dueWords(99999);
    root.innerHTML = `
      <div class="card">
        <div class="card-head"><h2>复习库</h2><span class="sub">${due.length} 词待复习</span></div>
        <p class="muted">所有还在学习中的单词，按下次复习时间排序。</p>
        <div class="word-grid" id="libGrid"></div>
      </div>`;
    const grid = $("#libGrid");
    grid.innerHTML = due.map(w => `
      <div class="word-card" data-key="${esc(w.key)}">
        <span class="lv-badge">${w.level < 0 ? "新词" : "Lv." + (w.level + 1)}</span>
        <div class="term">${esc(w.term)}</div>
        <div class="cn">${esc(glossOf(w))}</div>
        <span class="due-tag soon">${fmtDue(w.due)}</span>
      </div>`).join("") || `<div class="empty" style="grid-column:1/-1"><span class="egg">🥚</span>复习库是空的，太棒了！</div>`;
    $$(".word-card", grid).forEach(c => c.addEventListener("click", () => openWordModal(state.words[c.dataset.key])));
  }

  // ================================================================
  //  TAB 4 · 已毕业
  // ================================================================
  function renderGraduated() {
    const list = graduatedList();
    root.innerHTML = `
      <div class="card">
        <div class="card-head"><h2>已毕业 🎓</h2><span class="sub">${list.length} 词</span></div>
        <p class="muted">这些词已走完艾宾浩斯曲线，进入长期记忆。</p>
        <div class="word-grid" id="gradGrid"></div>
      </div>`;
    const grid = $("#gradGrid");
    grid.innerHTML = list.map(w => `
      <div class="word-card" data-key="${esc(w.key)}">
        <span class="lv-badge grad">🎓</span>
        <div class="term">${esc(w.term)}</div>
        <div class="cn">${esc(glossOf(w))}</div>
        <span class="due-tag done">答对 ${w.correct} 次</span>
      </div>`).join("") || `<div class="empty" style="grid-column:1/-1"><span class="egg">🥚</span>还没有毕业的词，继续加油！</div>`;
    $$(".word-card", grid).forEach(c => c.addEventListener("click", () => openWordModal(state.words[c.dataset.key])));
  }

  // ================================================================
  //  单词详情弹窗
  // ================================================================
  function openWordModal(w) {
    const modal = $("#modal"), c = $("#modalContent");
    const s = SEED[w.key];
    const forms = Object.entries(w.forms || {});
    const remains = w.graduated ? 0 : Math.max(1, GRAD_LEVEL - w.level);
    const examples = (w.examples && w.examples.length) ? w.examples
      : (s ? s.examples.map(e => ({en:e.en, cn:e.cn})) : []);

    c.innerHTML = `
      <button class="modal-close" id="modalClose" aria-label="关闭">✕</button>
      <div class="handle" id="modalHandle"></div>
      <h3>${esc(w.term)}</h3>
      ${w.reading ? `<p class="muted" style="margin:-4px 0 4px">${esc(w.reading)}</p>` : ""}
      <div class="meta">
        <span class="tag">${esc(w.pos || "单词")}</span>
        ${w.graduated
          ? '<span class="tag mint">🎓 已毕业</span>'
          : `<span class="tag pink">还需通过 ${remains} 次</span>`}
        <span class="tag egg">艾宾浩斯 ${w.graduated ? "9/9" : (w.level < 0 ? "0/9" : (w.level+1) + "/9")}级</span>
        ${!w.graduated ? `<span class="tag">下次 ${fmtDue(w.due)}</span>` : ""}
      </div>
      <div class="row" style="margin-bottom:8px">
        <button class="btn btn-egg sm" id="spkBtn">🔊 朗读</button>
        <span class="muted">累计答对 <b>${w.correct}</b> 次 · 复习 ${w.totalReviews} 次${w.lapses ? " · 遗忘 " + w.lapses + " 次" : ""}</span>
      </div>
      ${w.en ? `<p style="font-weight:700;margin:4px 0 2px">${esc(w.en)}</p>` : ""}
      <p class="muted">${esc(w.cn || "（暂无中文释义）")}</p>

      ${forms.length ? `
        <div class="section-title"><span class="bar"></span>各种形式</div>
        <table class="form-table">
          <tr>${Object.keys(w.forms).map(k => `<th>${esc(k)}</th>`).join("")}</tr>
          <tr>${Object.values(w.forms).map(v => `<td><span class="w">${esc(v)}</span></td>`).join("")}</tr>
        </table>` : ""}

      <div class="section-title"><span class="bar"></span>例句</div>
      <div class="example-list">
        ${examples.length ? examples.map((e, i) => `
          <div class="example">
            <div class="idx">${i + 1}</div>
            <div class="body">
              <div class="en">${highlight(e.en, w.term)}</div>
              <div class="cn">${esc(e.cn || "")}</div>
            </div>
            <div class="spk" data-sentence="${esc(e.en)}">🔊</div>
          </div>`).join("") : '<p class="muted">暂无例句，可在设置里开启联网补全。</p>'}
      </div>

      <div class="row wrap" style="margin-top:18px">
        <button class="btn btn-lav sm" id="editBtn">✏️ 编辑释义</button>
        <button class="btn btn-ghost sm" id="resetBtn">↺ 重置进度</button>
        <button class="btn btn-rose sm" id="delBtn">🗑 删除</button>
      </div>
    `;
    modal.classList.add("on");

    // 关闭方式：右上角 ✕ / 顶部小横条 / 点弹窗外空白 / ESC 键
    $("#modalClose").addEventListener("click", closeModal);
    $("#modalHandle").addEventListener("click", closeModal);
    const escHandler = e => { if (e.key === "Escape") closeModal(); };
    document.addEventListener("keydown", escHandler, { once: true });
    modal.addEventListener("click", e => { if (e.target === modal) closeModal(); }, { once: true });

    $("#spkBtn").addEventListener("click", () => speak(w.term));
    $$(".example .spk", c).forEach(b => b.addEventListener("click", () => speak(b.dataset.sentence)));
    $("#editBtn").addEventListener("click", () => {
      const cn = prompt("输入中文释义：", w.cn || "");
      if (cn !== null) { w.cn = cn.trim(); w.contentUpdatedAt = Date.now(); w.updatedAt = Date.now(); persist(); openWordModal(w); }
    });
    $("#resetBtn").addEventListener("click", () => {
      if (!confirm(`把「${w.term}」的进度重置为未开始？`)) return;
      w.level = -1; w.graduated = false; w.due = Date.now(); w.correct = 0; w.lapses = 0; w.totalReviews = 0;
      w.reviewedAt = Date.now(); w.updatedAt = w.reviewedAt;
      persist(); closeModal(); toast("已重置进度");
    });
    $("#delBtn").addEventListener("click", () => {
      if (!confirm(`确定删除「${w.term}」？`)) return;
      delete state.words[w.key];
      state.order = state.order.filter(k => k !== w.key);
      persist(); closeModal(); toast("已删除", "rose"); render();
    });
  }

  function closeModal() { $("#modal").classList.remove("on"); $("#modalContent").innerHTML = ""; }

  function highlight(text, term) {
    const safe = esc(text);
    const re = new RegExp("(" + esc(term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "i");
    return safe.replace(re, "<b>$1</b>");
  }

  // ================================================================
  //  TAB 5 · 设置
  // ================================================================
  function renderTtsCheck() {
    const el = $("#ttsCheck"); if (!el) return;
    if (window.EGGY_AUDIO) {
      el.innerHTML = '<div class="h">✅ 内置 Nanami 日语配音</div><p class="muted">课本词汇和例句直接播放音频，可离线使用。自行添加的词使用本机日语语音。</p>';
      return;
    }
    if (!("speechSynthesis" in window)) {
      el.innerHTML = '<div class="h">❌ 此浏览器不支持语音合成</div><p class="muted">请换用 Chrome / Edge / Safari。</p>';
      return;
    }
    const voices = window.speechSynthesis.getVoices();
    const ja = voices.filter(v => /^ja/i.test(v.lang));
    if (ja.length) {
      el.innerHTML = `<div class="h">✅ 检测到日语语音，发音正常</div>
        <p class="muted">${ja.map(v => esc(v.name + " (" + v.lang + ")")).join("；")}</p>`;
    } else if (voices.length) {
      el.innerHTML = `<div class="h">⚠️ 本设备没有日语语音包，日语发音会不准</div>
        <p class="muted">当前只有：${voices.slice(0, 6).map(v => esc(v.name + " (" + v.lang + ")")).join("；")}。最简单的解决方法：用 <b>Edge 浏览器</b>打开本页（自带在线日语语音），或按下方说明安装日语语音包。</p>`;
    } else {
      el.innerHTML = '<div class="h">… 语音列表还没加载完</div><p class="muted">点一下任意「朗读」按钮，再回到本页查看结果。</p>';
    }
  }

  function renderSettings() {
    const offlineBanner = OFFLINE_MODE ? `
      <div class="card" style="border-color:var(--mint)">
        <div class="card-head"><h2>🔒 离线本地模式</h2><span class="sub">不联网</span></div>
        <p class="muted">本离线包不会连接房间码、GitHub、翻译或例句服务。学习进度仅保存在这台设备当前浏览器中；请定期导出 JSON 备份。</p>
      </div>` : "";
    root.innerHTML = `
      ${offlineBanner}
      <div class="card">
        <div class="card-head"><h2>发音自检</h2><span class="sub">日语 TTS</span></div>
        <div class="sync-box" id="ttsCheck"><div class="h">检测中…</div></div>
        <p class="muted" style="margin-top:8px">本 App 的发音走浏览器内置语音，各设备解决方法：<br/>
        · <b>Windows + Chrome</b>：设置 → 时间和语言 → 语言和区域 → 添加「日本語」→ 勾选"语音(text-to-speech)" → 重启浏览器<br/>
        · <b>Windows 最简方案</b>：改用 <b>Edge</b> 浏览器打开本页，Edge 自带在线日语自然语音，无需安装<br/>
        · <b>iPhone / iPad</b>：通常已内置（Kyoko）；若没有：设置 → 辅助功能 → 朗读内容 → 声音 → 日语 → 下载<br/>
        · <b>Android</b>：Google 文字转语音自带日语，一般开箱即用</p>
      </div>

      <div class="card">
        <div class="card-head"><h2>房间码云同步</h2><span class="sub">推荐 · 免登录</span></div>
        <div class="field">
          <label>房间码（多台设备填同一个即互通）</label>
          <input id="roomInp" placeholder="例如 eggy-x7k2p9" value="${esc(prefs.roomCode)}" autocomplete="off"/>
        </div>
        <div class="sync-box" id="roomStatus">${prefs.roomCode
          ? "✅ 已加入房间 <b>" + esc(prefs.roomCode) + "</b>" + (prefs.lastRoomSyncAt ? " · 最近同步 " + new Date(prefs.lastRoomSyncAt).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "")
          : "未加入房间"}</div>
        <div class="row wrap" style="margin-top:10px">
          <button class="btn btn-mint" id="roomCreateBtn">🏠 创建新房间</button>
          <button class="btn btn-egg" id="roomJoinBtn">🔗 保存房间码</button>
          <button class="btn btn-egg" id="roomPushBtn">⬆ 上传进度</button>
          <button class="btn btn-ghost" id="roomPullBtn">⬇ 拉取合并</button>
        </div>
        ${prefs.roomCode ? `
          <div class="room-code-box">
            <span class="rc-label">当前房间码</span>
            <span class="rc-code">${esc(prefs.roomCode)}</span>
            <button class="btn btn-ghost" id="roomCopyBtn">📋 复制</button>
          </div>` : ""}
        <div class="field" style="margin-top:12px">
          <label>本设备历史房间码（误建新房间后，点旧房间码即可找回云端进度）</label>
          ${(prefs.roomHistory || []).length ? `
            <div class="row wrap">
              ${(prefs.roomHistory || []).map(c =>
                `<button class="btn ${c === prefs.roomCode ? "btn-mint" : "btn-ghost"} room-hist" data-code="${esc(c)}">${esc(c)}${c === prefs.roomCode ? " · 当前" : ""}</button>`).join("")}
            </div>`
          : `<p class="muted" style="margin-top:6px">暂无历史记录 —— 本设备只用过当前这一个房间码，已显示在上方。<br/>⚠️ 历史记录<b>按浏览器分别保存</b>：换设备、换浏览器、清除浏览器数据后，这里都会是空的。</p>`}
        </div>
        <p class="muted" style="margin-top:8px"><b>用法：</b>① 这台设备点「创建新房间」→ ② 把房间码填到 iPad / 其他电脑点「保存房间码」→ ③ 每次复习完自动上传；<b>重新打开网页会自动从房间恢复进度</b>。合并规则：每个词取进度更先进的版本，两边进度都不会丢。</p>
        <p class="muted" style="margin-top:4px">⚠️ <b>请把房间码抄写或截图保存</b>——它是找回云端进度的唯一凭证（换浏览器/清除浏览器数据后需重新输入）。</p>
      </div>

      <div class="card">
        <div class="card-head"><h2>GitHub Gist 同步</h2><span class="sub">高级 · 备用</span></div>
        <div class="field">
          <label>GitHub Personal Token（需 <code>gist</code> 权限）</label>
          <input type="password" id="gistToken" placeholder="github_pat_... 或 ghp_..." value="${esc(prefs.gistToken)}" autocomplete="off"/>
        </div>
        <div class="field">
          <label>Gist ID（首次推送会自动生成并填入）</label>
          <input id="gistId" placeholder="留空 = 首次自动创建" value="${esc(prefs.gistId)}"/>
        </div>
        <div class="sync-box">
          <div class="h" id="syncStatus">${prefs.gistId ? "已配置 Gist" : "未配置"}</div>
          <p class="muted">多台设备填入 <b>相同的 Token 和 Gist ID</b> 即可互通。Token 只保存在本设备浏览器，不上传第三方。</p>
        </div>
        <div class="row wrap" style="margin-top:10px">
          <button class="btn btn-mint" id="syncPushBtn">☁ 推送到云端</button>
          <button class="btn btn-ghost" id="syncPullBtn">☁ 从云端恢复</button>
        </div>
        <p class="muted" style="margin-top:8px">如何拿 Token：<a href="https://github.com/settings/tokens?type=beta" target="_blank">GitHub 创建 Token</a> → 勾选 <b>Gists: Read and write</b> 权限。</p>
      </div>

      <div class="card">
        <div class="card-head"><h2>复习设置</h2></div>
        <div class="row">
          <div class="field" style="flex:1">
            <label>每轮复习量</label>
            <input type="number" id="roundInp" min="5" max="100" value="${prefs.reviewPerRound}"/>
          </div>
          <div class="field" style="flex:1">
            <label>每日目标 (保留题数)</label>
            <input type="number" id="goalInp" min="5" max="200" value="${prefs.dailyGoal}"/>
          </div>
        </div>
        <div class="field">
          <label>毕业档位</label>
          <select id="gradSel">
            <option value="curve" ${prefs.graduation === "curve" ? "selected" : ""}>走完检索曲线 (推荐，记得更牢)</option>
            <option value="5times" ${prefs.graduation === "5times" ? "selected" : ""}>累计答对 5 次即毕业</option>
          </select>
        </div>
        <div class="field">
          <label>拼写题（拼读音）占比</label>
          <select id="kanaRatioSel">
            <option value="0.3" ${prefs.kanaRatio === 0.3 ? "selected" : ""}>30%（轻量）</option>
            <option value="0.5" ${(prefs.kanaRatio === 0.5 || prefs.kanaRatio == null) ? "selected" : ""}>50%（推荐 · 一半时间练拼写）</option>
            <option value="0.7" ${prefs.kanaRatio === 0.7 ? "selected" : ""}>70%（强化拼写）</option>
          </select>
          <p class="muted" style="margin-top:4px">显示汉字或释义，点击五十音按键拼出正确读音。其余题目在翻卡 / 日→中 / 中→日 / 听力之间分配。</p>
        </div>
        <div class="field">
          <label>朗读语速 (0.6–1.4)</label>
          <input type="number" id="rateInp" step="0.05" min="0.6" max="1.4" value="${prefs.ttsRate}"/>
        </div>
        <label class="row" style="gap:8px;font-size:13px;color:var(--ink-soft)">
          <input type="checkbox" id="autoTTS" ${prefs.autoTTS ? "checked" : ""}/> 答题后自动朗读
        </label>
        <button class="btn btn-pink" id="savePrefsBtn" style="margin-top:12px">保存设置</button>
      </div>

      <div class="card">
        <div class="card-head"><h2>联网增强</h2><span class="sub">可选</span></div>
        <div class="field">
          <label>翻译接口 (留空 = 关闭；{w} 为占位符)</label>
          <input id="apiTrInp" value="${esc(prefs.apiTranslate)}" placeholder="https://api.mymemory.translated.net/get?q={w}&langpair=en|zh-CN"/>
        </div>
        <div class="field">
          <label>例句接口 (留空 = 用内置种子库)</label>
          <input id="apiExInp" value="${esc(prefs.apiExamples)}" placeholder="https://你的代理/{w}"/>
        </div>
        <div class="row wrap">
          <button class="btn btn-lav" id="testApiBtn">测试接口连通性</button>
          <button class="btn btn-egg" id="fillCnBtn">补全缺失的中文释义</button>
        </div>
        <p class="muted" style="margin-top:8px">内置种子库已含 ${Object.keys(SEED).length} 个常见词的真人例句，离线可用。</p>
      </div>

      <div class="card">
        <div class="card-head"><h2>数据管理</h2></div>
        <div class="row wrap">
          <button class="btn btn-egg" id="expJsonBtn">导出 JSON</button>
          <button class="btn btn-egg" id="expCsvBtn">导出 CSV</button>
          <button class="btn btn-ghost" id="impBtn">导入</button>
          <button class="btn btn-rose" id="wipeBtn">清空所有数据</button>
        </div>
        <input id="impInp" type="file" accept=".json,.csv" class="hidden"/>
        <p class="muted" style="margin-top:8px">JSON = 完整备份；CSV = 纯单词表（可在 Excel 里编辑）。</p>
      </div>

      <div class="card">
        <div class="card-head"><h2>关于</h2></div>
        <p class="muted">蛋仔单词本 · 基于 <b>艾宾浩斯遗忘曲线</b> 的单词记忆 App。纯前端、多平台网页可访问、可跨设备同步。数据默认保存在本设备浏览器，仅在你主动点「同步」时上传。</p>
      </div>
    `;

    // 发音自检（语音列表可能异步加载，监听变化后刷新）
    renderTtsCheck();
    if ("speechSynthesis" in window) {
      const handler = () => { renderTtsCheck(); window.speechSynthesis.onvoiceschanged = null; };
      window.speechSynthesis.onvoiceschanged = handler;
      setTimeout(renderTtsCheck, 400);
    }

    // 房间码同步
    $("#roomCreateBtn").addEventListener("click", roomCreate);
    $("#roomJoinBtn").addEventListener("click", async () => {
      const code = $("#roomInp").value.trim();
      if (!code) { toast("先输入房间码", "rose"); return; }
      prefs.roomCode = code; rememberRoom(code); persistPrefs();
      $("#roomStatus").textContent = "✅ 已加入房间 " + code + "，正在拉取云端进度…";
      toast("房间码已保存", "gold");
      await roomPull();
    });
    $("#roomPushBtn").addEventListener("click", () => roomPush(false));
    $("#roomPullBtn").addEventListener("click", roomPull);
    const copyBtn = $("#roomCopyBtn");
    if (copyBtn) copyBtn.addEventListener("click", () => {
      const code = (prefs.roomCode || "").trim();
      if (!code) { toast("还没有加入房间", "rose"); return; }
      navigator.clipboard?.writeText(code).then(() => toast("房间码已复制：" + code, "gold")).catch(() => toast("复制失败，房间码是：" + code));
    });
    $$(".room-hist", root).forEach(b => b.addEventListener("click", async () => {
      const code = b.dataset.code;
      if (code === prefs.roomCode) { toast("已经是当前房间了", "gold"); return; }
      if (!confirm(`切换到旧房间 ${code} 并拉取云端进度？\n（当前房间 ${prefs.roomCode} 也会保留在历史里）`)) return;
      prefs.roomCode = code; rememberRoom(code); persistPrefs();
      $("#roomInp").value = code;
      await roomPull();
    }));

    // 云同步
    $("#syncPushBtn").addEventListener("click", async () => {
      prefs.gistToken = $("#gistToken").value.trim();
      prefs.gistId = $("#gistId").value.trim();
      persistPrefs();
      await syncPush();
    });
    $("#syncPullBtn").addEventListener("click", async () => {
      prefs.gistToken = $("#gistToken").value.trim();
      prefs.gistId = $("#gistId").value.trim();
      persistPrefs();
      await syncPull();
    });

    // 复习设置
    $("#savePrefsBtn").addEventListener("click", () => {
      prefs.reviewPerRound = parseInt($("#roundInp").value, 10) || 10;
      prefs.dailyGoal = parseInt($("#goalInp").value, 10) || 20;
      prefs.graduation = $("#gradSel").value;
      prefs.kanaRatio = parseFloat($("#kanaRatioSel").value);
      prefs.ttsRate = parseFloat($("#rateInp").value) || 0.95;
      prefs.autoTTS = $("#autoTTS").checked;
      prefs.apiTranslate = $("#apiTrInp").value.trim();
      prefs.apiExamples = $("#apiExInp").value.trim();
      persistPrefs();
      toast("已保存设置", "gold");
      updateBadges();
    });

    // 联网增强
    $("#testApiBtn").addEventListener("click", async () => {
      prefs.apiTranslate = $("#apiTrInp").value.trim();
      prefs.apiExamples = $("#apiExInp").value.trim();
      persistPrefs();
      toast("测试中…");
      const r = await fetchTranslation("apple");
      toast(r ? "接口连通 ✓ → 苹果" : "接口不通 ✗", r ? "gold" : "rose");
    });
    $("#fillCnBtn").addEventListener("click", async () => {
      let n = 0;
      const empty = Object.values(state.words).filter(w => !w.cn);
      for (const w of empty) {
        const t = await fetchTranslation(w.term);
        if (t) { w.cn = t; n++; }
      }
      persist(); toast(`补全了 ${n} 个释义`, "gold"); render();
    });

    // 数据
    $("#expJsonBtn").addEventListener("click", exportJSON);
    $("#expCsvBtn").addEventListener("click", exportCSV);
    $("#impBtn").addEventListener("click", () => $("#impInp").click());
    $("#impInp").addEventListener("change", e => {
      const f = e.target.files?.[0]; if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = reader.result;
          if (f.name.toLowerCase().endsWith(".csv")) { importCSV(text); }
          else { importJSON(text); }
        } catch (err) { toast("导入失败：" + err.message, "rose"); }
      };
      reader.readAsText(f);
      e.target.value = "";
    });
    $("#wipeBtn").addEventListener("click", () => {
      if (!confirm("⚠ 将清空所有单词和进度。建议先导出 JSON 备份。确定？")) return;
      state = newState(); persist(); toast("已清空", "rose"); render();
    });
  }

  // ─────────── 远端进度合并（两台设备互不丢进度） ───────────
  function wordProgressScore(w) {
    if (!w) return -999;
    if (w.graduated) return 1000;
    return (w.level < 0 ? -1 : w.level) * 100 + (w.correct || 0);
  }
  function safeWordKey(k) { return k !== "__proto__" && k !== "constructor" && k !== "prototype"; }
  function wordTime(w, field) { return Number.isFinite(Number(w?.[field])) ? Number(w[field]) : 0; }
  function cloneWord(w) { return JSON.parse(JSON.stringify(w)); }
  function copyProgress(target, source) {
    ["level", "graduated", "due", "correct", "lapses", "totalReviews", "reviewedAt", "updatedAt"].forEach(k => {
      if (Object.prototype.hasOwnProperty.call(source, k)) target[k] = source[k];
    });
  }
  function copyContent(target, source) {
    ["term", "cn", "en", "pos", "reading", "forms", "examples", "contentUpdatedAt"].forEach(k => {
      if (Object.prototype.hasOwnProperty.call(source, k)) target[k] = cloneWord(source[k]);
    });
  }
  function mergeRemoteIntoState(remoteState) {
    const remoteWords = remoteState.words || {};
    let added = 0, updated = 0;
    Object.keys(remoteWords).forEach(k => {
      const rw = remoteWords[k];
      if (!safeWordKey(k) || !rw || typeof rw !== "object" || typeof rw.term !== "string") return;
      const lw = state.words[k];
      if (!lw) {
        state.words[k] = cloneWord(rw);
        if (!state.order.includes(k)) state.order.push(k);
        added++; return;
      }
      // 进度以最后一次实际作答为准，而不是盲目取等级更高的一端。
      // 这避免了一台设备刚答错后，被另一台旧设备的高等级结果覆盖。
      const remoteReviewed = wordTime(rw, "reviewedAt");
      const localReviewed = wordTime(lw, "reviewedAt");
      if (remoteReviewed > localReviewed ||
          (remoteReviewed === localReviewed && wordProgressScore(rw) > wordProgressScore(lw))) {
        copyProgress(lw, rw);
        updated++;
      }
      // 释义等内容独立按最后编辑时间合并，不会被一次普通复习误覆盖。
      if (wordTime(rw, "contentUpdatedAt") > wordTime(lw, "contentUpdatedAt")) copyContent(lw, rw);
    });
    // 学习历史按日期合并（取较大值）
    (remoteState.history || []).forEach(rh => {
      const lh = state.history.find(h => h.date === rh.date);
      if (!lh) state.history.push(rh);
      else {
        lh.reviewed = Math.max(lh.reviewed || 0, rh.reviewed || 0);
        lh.correct = Math.max(lh.correct || 0, rh.correct || 0);
      }
    });
    state.history = state.history.slice(-120);
    // 做题时间按“日期 + 设备”合并；同一设备取较大值，不会因重复同步而翻倍。
    Object.entries(remoteState.practice || {}).forEach(([day, remoteDevices]) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !remoteDevices || typeof remoteDevices !== "object" || Array.isArray(remoteDevices)) return;
      state.practice[day] ||= {};
      Object.entries(remoteDevices).forEach(([deviceId, remoteSeconds]) => {
        const seconds = Math.max(0, Math.round(Number(remoteSeconds) || 0));
        state.practice[day][deviceId] = Math.max(Number(state.practice[day][deviceId]) || 0, seconds);
      });
    });
    const practiceDays = Object.keys(state.practice).sort().slice(-400);
    const practiceKeep = new Set(practiceDays);
    Object.keys(state.practice).forEach(day => { if (!practiceKeep.has(day)) delete state.practice[day]; });
    if ((remoteState.streak?.current || 0) > (state.streak?.current || 0)) {
      state.streak.current = remoteState.streak.current;
    }
    return { added, updated };
  }
  function syncPayload() {
    return { type: "eggy-vocab", v: 2, at: Date.now(), state,
      prefs: { dailyGoal: prefs.dailyGoal, reviewPerRound: prefs.reviewPerRound, graduation: prefs.graduation } };
  }

  // ─────────── 房间码云同步 (textdb.dev，免登录、CORS 已实测可用) ───────────
  const ROOM_API = "https://textdb.dev/api/data/";
  function roomStatusEl() { return $("#roomStatus"); }

  // 记录本设备用过的房间码（最多 5 个），误建新房间后可从这里找回旧进度
  function rememberRoom(code) {
    if (!code) return;
    prefs.roomHistory = [code, ...(prefs.roomHistory || []).filter(c => c !== code)].slice(0, 5);
    persistPrefs();
  }

  async function fetchRoomData(code) {
    const resp = await fetch(ROOM_API + encodeURIComponent(code));
    if (!resp.ok) throw new Error("HTTP " + resp.status);
    const raw = await resp.text();
    if (!raw || !raw.startsWith("value=")) throw new Error("房间里还没有数据，先在其他设备上传一次");
    const obj = JSON.parse(new URLSearchParams(raw).get("value") || "null");
    if (!obj || obj.type !== "eggy-vocab" || !obj.state || typeof obj.state.words !== "object") throw new Error("远端数据格式错误");
    return obj;
  }

  async function roomPush(silent) {
    if (OFFLINE_MODE) { if (!silent) toast("离线版不会上传数据", "rose"); return false; }
    const code = (prefs.roomCode || "").trim();
    if (!code) { if (!silent) toast("请先创建或加入房间", "rose"); return false; }
    const el = roomStatusEl();
    if (el && !silent) el.textContent = "⬆ 上传中…";
    try {
      // 防覆盖保险丝：上传前先拉取云端并合并，保证云端进度只进不退
      // （防止新设备加入旧房间后，一次上传把云端进度清空）
      try {
        const remote = await fetchRoomData(code);
        const r = mergeRemoteIntoState(remote.state);
        if (r.added + r.updated > 0) persist();
      } catch (_) { /* 云端为空或网络抖动，直接上传本地 */ }
      const body = new URLSearchParams({ value: JSON.stringify(syncPayload()) }).toString();
      const resp = await fetch(ROOM_API + encodeURIComponent(code), {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body
      });
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      prefs.lastRoomSyncAt = Date.now();
      persistPrefs();
      if (el) el.textContent = `✅ 已上传 · ${Object.keys(state.words).length} 词 · ${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
      if (!silent) toast("进度已上传到房间", "gold");
      return true;
    } catch (e) {
      if (el) el.textContent = "❌ 上传失败：" + e.message;
      if (!silent) toast("上传失败：" + e.message, "rose");
      return false;
    }
  }

  async function roomPull() {
    if (OFFLINE_MODE) { toast("离线版不会连接房间码", "rose"); return; }
    const code = (prefs.roomCode || "").trim();
    if (!code) { toast("请先创建或加入房间", "rose"); return; }
    const el = roomStatusEl();
    if (el) el.textContent = "⬇ 拉取中…";
    try {
      const obj = await fetchRoomData(code);
      const { added, updated } = mergeRemoteIntoState(obj.state);
      persist();
      prefs.lastRoomSyncAt = Date.now();
      persistPrefs();
      rememberRoom(code);
      if (el) el.textContent = `✅ 已合并：新词 ${added} 个、进度更新 ${updated} 个 · 共 ${Object.keys(state.words).length} 词`;
      toast(added + updated ? "已从房间合并进度" : "本机进度已是最新", "gold");
      render();
    } catch (e) {
      if (el) el.textContent = "❌ 拉取失败：" + e.message;
      toast("拉取失败：" + e.message, "rose");
    }
  }

  // 打开页面时自动从房间恢复进度（有房间码就静默合并一次）
  async function autoRoomSync() {
    if (OFFLINE_MODE) return;
    const code = (prefs.roomCode || "").trim();
    if (!code) return;
    try {
      const obj = await fetchRoomData(code);
      const { added, updated } = mergeRemoteIntoState(obj.state);
      if (added + updated > 0) {
        persist();
        toast(`已从房间恢复进度：新词 ${added} 个、进度更新 ${updated} 个`, "gold");
        render();
      }
    } catch (_) { /* 静默：云暂不可用不阻塞本地使用 */ }
  }

  async function roomCreate() {
    if (OFFLINE_MODE) { toast("离线版不会创建云端房间", "rose"); return; }
    const old = (prefs.roomCode || "").trim();
    if (old) {
      const go = confirm(`当前已加入房间 ${old}。\n确定要创建新房间吗？\n（旧房间码会保留在下方"历史房间码"里，云端旧进度不会丢）`);
      if (!go) return;
    }
    // 生成 80-bit 房间码；它是分享凭证，不应使用短六码或 Math.random。
    const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
    const bytes = new Uint8Array(16);
    if (window.crypto?.getRandomValues) window.crypto.getRandomValues(bytes);
    else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    let suffix = "";
    for (let i = 0; i < 16; i++) suffix += alphabet[bytes[i] % alphabet.length];
    if (old) rememberRoom(old);
    prefs.roomCode = "eggy-" + suffix;
    rememberRoom(prefs.roomCode);
    persistPrefs();
    const inp = $("#roomInp"); if (inp) inp.value = prefs.roomCode;
    const el = roomStatusEl();
    if (el) el.textContent = "🏠 房间创建中…";
    const ok = await roomPush(true);
    if (ok) {
      toast("房间已创建，房间码：" + prefs.roomCode + "（请抄写保存，它是恢复进度的凭证）", "gold");
      if (el) el.textContent = "✅ 房间已创建，把房间码填到其他设备即可互通";
      try { navigator.clipboard?.writeText(prefs.roomCode); } catch (_) {}
    }
  }

  // ─────────── 云同步 (GitHub Gist，CORS 友好、可靠) ───────────
  function gistFilename() { return "eggy-vocab-backup.json"; }

  async function syncPush() {
    if (OFFLINE_MODE) { toast("离线版不会上传到 GitHub", "rose"); return null; }
    const token = prefs.gistToken;
    let gid = prefs.gistId;
    if (!token) { toast("请先在下方填入 GitHub Token", "rose"); return null; }
    const status = $("#syncStatus");
    if (status) status.textContent = "同步中…";
    try {
      const payload = syncPayload();
      const body = JSON.stringify({
        description: "蛋仔单词本进度备份",
        public: false,
        files: { [gistFilename()]: { content: JSON.stringify(payload) } }
      });
      let resp, url;
      if (gid) {
        resp = await fetch(`https://api.github.com/gists/${gid}`, {
          method: "PATCH",
          headers: { "Authorization": `Bearer ${token}`, "Accept": "application/vnd.github+json", "Content-Type": "application/json" },
          body
        });
        url = `https://api.github.com/gists/${gid}`;
      } else {
        resp = await fetch("https://api.github.com/gists", {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}`, "Accept": "application/vnd.github+json", "Content-Type": "application/json" },
          body
        });
      }
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.message || ("HTTP " + resp.status));
      gid = data.id;
      prefs.gistId = gid;
      prefs.lastSyncAt = Date.now();
      persistPrefs();
      const gidInp = $("#gistId");
      if (gidInp) gidInp.value = gid;
      if (status) status.textContent = "已同步 ✓ 最近同步 刚刚 · " + Object.keys(state.words).length + " 词";
      toast("已同步到云端", "gold");
      return gid;
    } catch (e) {
      if (status) status.textContent = "同步失败：" + e.message;
      toast("同步失败：" + e.message, "rose");
      return null;
    }
  }

  async function syncPull() {
    if (OFFLINE_MODE) { toast("离线版不会连接 GitHub", "rose"); return; }
    const token = prefs.gistToken;
    const gid = prefs.gistId;
    if (!token || !gid) { toast("需要 Token 和 Gist ID", "rose"); return; }
    const status = $("#syncStatus");
    try {
      const resp = await fetch(`https://api.github.com/gists/${gid}`, {
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/vnd.github+json" }
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.message || ("HTTP " + resp.status));
      const file = data.files?.[gistFilename()];
      if (!file) throw new Error("Gist 里没有备份文件");
      // GitHub 会截断较大的 Gist 内容；此时必须读取 raw_url 才不会导入半份数据。
      let content = file.content;
      if (file.truncated && file.raw_url) {
        const raw = await fetch(file.raw_url, { headers: { "Authorization": `Bearer ${token}`, "Accept": "application/vnd.github.raw+json" } });
        if (!raw.ok) throw new Error("无法下载完整 Gist 备份：HTTP " + raw.status);
        content = await raw.text();
      }
      const obj = JSON.parse(content);
      if (!obj.state || (obj.type && obj.type !== "eggy-vocab")) throw new Error("远端格式错误");
      if (!confirm(`从云端合并到本机？（新词加入，进度取两边更先进的）`)) return;
      mergeRemoteIntoState(obj.state);
      persist();
      prefs.lastSyncAt = Date.now();
      persistPrefs();
      if (status) status.textContent = "已从云端合并 ✓ " + Object.keys(state.words).length + " 词";
      toast("已从云端恢复", "gold");
      render();
    } catch (e) {
      if (status) status.textContent = "拉取失败：" + e.message;
      toast("拉取失败：" + e.message, "rose");
    }
  }

  // ─────────── 翻译 / 例句 (联网) ───────────
  async function fetchTranslation(term) {
    if (OFFLINE_MODE) return "";
    if (!prefs.apiTranslate) return "";
    try {
      const url = prefs.apiTranslate.replace("{w}", encodeURIComponent(term));
      const r = await fetch(url);
      const j = await r.json();
      // MyMemory 返回结构
      const data = j.responseData || j;
      const seg = data.translatedText;
      if (seg) return seg;
      // 备用：直接返回 object 的 translatedText 字段
      return (j.translatedText) || "";
    } catch (_) { return ""; }
  }

  async function fetchExamples(term) {
    const s = SEED[term.toLowerCase().trim()];
    if (s && s.examples) return s.examples.map(e => ({ en: e.en, cn: e.cn }));
    if (OFFLINE_MODE) return [];
    // 设置了自定义例句 API 时优先使用；支持 [{en,cn}]、{examples:[...]}、{results:[...]} 三种常见格式。
    try {
      const url = prefs.apiExamples
        ? prefs.apiExamples.replace("{w}", encodeURIComponent(term))
        : `https://tatoeba.org/en/api_v0/search?from=jpn&to=cmn&query=${encodeURIComponent(term)}&sort=relevance`;
      const r = await fetch(url);
      if (!r.ok) return [];
      const j = await r.json();
      const source = Array.isArray(j) ? j : (j.examples || j.results || j.data || []);
      const results = source.slice(0, 3).map(x => ({
        en: x.en || x.text || x.sentence || "",
        cn: x.cn || x.translation || x.translations?.[0]?.[0]?.text || ""
      })).filter(x => x.en);
      return results;
    } catch (_) { return []; }
  }

  // ─────────── 导入导出 ───────────
  function download(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 100);
  }

  function exportJSON() {
    // Token 属于登录凭证，备份文件可被转发，绝不能写进去。
    const { gistToken, ...safePrefs } = prefs;
    const payload = { type: "eggy-vocab", v: 2, exportedAt: new Date().toISOString(), state, prefs: safePrefs };
    download(`eggy-vocab-${new Date().toISOString().slice(0,10)}.json`, JSON.stringify(payload, null, 2), "application/json");
    toast("已导出 JSON（不含 GitHub Token）");
  }
  function assertImportableState(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw) || !raw.words || typeof raw.words !== "object" || Array.isArray(raw.words)) {
      throw new Error("格式错误：缺少有效的 state.words");
    }
    Object.entries(raw.words).forEach(([k, w]) => {
      if (!safeWordKey(k) || !w || typeof w !== "object" || typeof w.term !== "string") throw new Error("格式错误：发现无效单词数据");
    });
  }
  function importJSON(text) {
    const obj = JSON.parse(text);
    if (obj.type && obj.type !== "eggy-vocab") throw new Error("不是蛋仔单词本备份文件");
    assertImportableState(obj.state);
    if (!confirm("导入会覆盖当前数据，确定？")) return;
    // 显式挑选字段，避免把导入文件中的任意对象结构带入运行时状态。
    const previousDeviceId = state.deviceId;
    state = {
      schema: 2,
      words: cloneWord(obj.state.words),
      order: Array.isArray(obj.state.order) ? obj.state.order.filter(k => safeWordKey(k) && obj.state.words[k]) : Object.keys(obj.state.words),
      history: Array.isArray(obj.state.history) ? obj.state.history : [],
      practice: obj.state.practice && typeof obj.state.practice === "object" && !Array.isArray(obj.state.practice) ? cloneWord(obj.state.practice) : {},
      streak: obj.state.streak && typeof obj.state.streak === "object" ? obj.state.streak : { current: 0, best: 0, lastDay: null },
      createdAt: Number(obj.state.createdAt) || Date.now(),
      updatedAt: Date.now(),
      deviceId: previousDeviceId || makeId("device")
    };
    if (obj.prefs && typeof obj.prefs === "object") prefs = Object.assign(defaultPrefs(), obj.prefs, { gistToken: prefs.gistToken || "" });
    normalizeState();
    persist(); persistPrefs();
    toast("导入成功", "gold"); render();
  }
  function exportCSV() {
    let csv = "\uFEFFterm,en,cn,level,correct,graduated\n";
    Object.values(state.words).forEach(w => {
      csv += `"${(w.term||"").replace(/"/g,'""')}","${(w.en||"").replace(/"/g,'""')}","${(w.cn||"").replace(/"/g,'""')}",${w.level},${w.correct},${w.graduated?1:0}\n`;
    });
    download(`eggy-vocab-${new Date().toISOString().slice(0,10)}.csv`, csv, "text/csv;charset=utf-8");
    toast("已导出 CSV");
  }
  function parseCSV(text) {
    const rows = [[]]; let cell = "", quoted = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (quoted && ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = !quoted;
      else if (ch === "," && !quoted) { rows[rows.length - 1].push(cell); cell = ""; }
      else if ((ch === "\n" || ch === "\r") && !quoted) {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        rows[rows.length - 1].push(cell); cell = ""; rows.push([]);
      } else cell += ch;
    }
    if (cell || rows[rows.length - 1].length) rows[rows.length - 1].push(cell);
    return rows.filter(row => row.some(cell => cell.trim()));
  }
  function importCSV(text) {
    const rows = parseCSV(text.replace(/^\uFEFF/, ""));
    if (!rows.length) throw new Error("CSV 为空");
    const header = rows[0].map(h => h.trim().toLowerCase());
    const hasHeader = header.includes("term");
    const termIndex = hasHeader ? header.indexOf("term") : 0;
    const cnIndex = hasHeader ? header.indexOf("cn") : 1;
    const enIndex = hasHeader ? header.indexOf("en") : -1;
    let added = 0, skipped = 0;
    rows.slice(hasHeader ? 1 : 0).forEach(row => {
      const term = (row[termIndex] || "").trim();
      if (!term) { skipped++; return; }
      const w = addTerm(term, (row[cnIndex] || "").trim());
      if (!w) { skipped++; return; }
      if (enIndex >= 0 && row[enIndex]) { w.en = row[enIndex].trim(); w.contentUpdatedAt = Date.now(); }
      added++;
    });
    persist();
    toast(`导入完成：${added} 新增，${skipped} 跳过`, "gold"); render();
  }

  // ─────────── BOOT ───────────
  render();
  // 有房间码时，打开页面自动从云端恢复/合并进度
  if (prefs.roomCode) autoRoomSync();
})();
