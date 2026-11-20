/* ============================================================
   FSRS-5 调度器（Free Spaced Repetition Scheduler）
   - DSR 模型：Difficulty / Stability / Retrievability
   - 默认参数来自 FSRS-5 公开权重
   - 目标保留率默认 0.85，可用 prefs.retention 调整
   说明：这是纯前端简化实现，用于替换固定 9 级间隔表。
   ============================================================ */
(function () {
  "use strict";

  var W = [
    0.4072, 1.1829, 3.1262, 15.4722, 7.2102, 0.5316, 1.0651, 0.0234,
    1.616, 0.1544, 1.0824, 1.9813, 0.0953, 0.2975, 2.2042, 0.2407,
    2.9466, 0.5034, 0.6567
  ];
  var DECAY = -0.5;
  var FACTOR = 19 / 81;
  var DAY = 86400000;

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  // 当前可提取概率
  function retrievability(elapsedDays, s) {
    if (!s || s <= 0) return 1;
    return Math.pow(1 + FACTOR * Math.max(0, elapsedDays) / s, DECAY);
  }

  // 给定稳定性与目标保留率，算出间隔天数
  function interval(s, retention) {
    var r = clamp(Number(retention) || 0.85, 0.7, 0.97);
    var i = s / FACTOR * (Math.pow(r, 1 / DECAY) - 1);
    return clamp(Math.round(i), 1, 3650);
  }

  function initDifficulty(g) {
    return clamp(W[4] - Math.exp(W[5] * (g - 1)) + 1, 1, 10);
  }

  // 更新一个词的记忆状态；g = 1 Again / 2 Hard / 3 Good / 4 Easy
  function update(w, g, now, retention) {
    now = now || Date.now();
    g = clamp(Math.round(g || 3), 1, 4);
    var reps = w.fsrsReps || 0;
    var s = w.fsrsS || 0;
    var d = w.fsrsD || 0;
    var last = w.fsrsLast || now;
    var elapsed = Math.max(0, (now - last) / DAY);
    var r = reps > 0 ? retrievability(elapsed, s) : 1;

    if (reps === 0) {
      s = W[g - 1];
      d = initDifficulty(g);
    } else {
      if (elapsed < 1) {
        // 同一天内的再次复习：短时稳定性
        s = s * Math.exp(W[17] * (g - 3 + W[18]));
      } else if (g === 1) {
        // 遗忘
        s = W[11] * Math.pow(d, -W[12]) * (Math.pow(s + 1, W[13]) - 1) * Math.exp(W[14] * (1 - r));
      } else {
        // 成功提取
        var hard = g === 2 ? W[15] : 1;
        var easy = g === 4 ? W[16] : 1;
        s = s * (1 + Math.exp(W[8]) * (11 - d) * Math.pow(s, -W[9]) *
                 (Math.exp(W[10] * (1 - r)) - 1) * hard * easy);
      }
      d = d - W[6] * (g - 3);
      d = W[7] * initDifficulty(4) + (1 - W[7]) * d;
    }

    s = clamp(s, 0.1, 36500);
    d = clamp(d, 1, 10);
    reps++;

    w.fsrsS = s;
    w.fsrsD = d;
    w.fsrsLast = now;
    w.fsrsReps = reps;

    // 第一次学完：10 分钟后巩固一次；之后按天调度
    var days;
    if (reps === 1) {
      days = 0;
    } else {
      days = interval(s, retention);
    }
    w.due = reps === 1 ? now + 10 * 60 * 1000 : now + days * DAY;
    w.graduated = s >= 180 || days >= 180;

    // level 仅用于界面显示（映射稳定性）
    w.level = clamp(Math.floor(Math.log(Math.max(1, s)) / Math.log(2)), 0, 8);

    return { s: s, d: d, days: days, r: r };
  }

  // 由「答对与否 + 反应时」自动映射 1-4 级
  function autoGrade(correct, rtMs, usedHint) {
    if (!correct) return 1;
    if (usedHint) return 2;
    var rt = Number(rtMs) || 0;
    if (rt <= 0) return 3;
    if (rt < 2000) return 4;
    if (rt < 6000) return 3;
    return 2;
  }

  window.FSRS = {
    update: update,
    interval: interval,
    retrievability: retrievability,
    autoGrade: autoGrade,
    W: W
  };
})();
