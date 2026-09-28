/*
 * 侧边栏「时光」卡片逻辑
 *   左栏：距离下一个法定节假日的天数（数据来自 timor.tech，localStorage 缓存 7 天，失败退回内置兜底表）
 *   右栏：今日 / 本周 / 本月 / 本年 的时间进度百分比
 *
 * 脚本经 inject.bottom 引入，位于页面外壳、不参与 pjax 替换，
 * 因此只在首次加载时执行一次，之后靠 pjax:complete 重新初始化。
 */
(function () {
  "use strict";

  var DAY = 86400000;
  var API = "https://timor.tech/api/holiday/year/";
  var CACHE_KEY = "anzhiyu-countdown-holidays";
  var CACHE_TTL = 7 * DAY;
  var FETCH_TIMEOUT = 8000;
  var REFRESH_INTERVAL = 60000; // 进度条每分钟刷新一次（纯本地计算，不发请求）
  var IN_THRESHOLD = 46; // 填充宽度 ≥ 46% 时，百分比文字压在色块内

  var UNITS = [
    { key: "day", label: "今日" },
    { key: "week", label: "本周" },
    { key: "month", label: "本月" },
    { key: "year", label: "本年" }
  ];

  // 兜底节日表：仅在接口不可用、或该年份接口暂无数据（如 2027）时使用。
  // 农历节日按「节日当天」记，与接口的「假期首日」口径可能差一两天，属可接受的降级。
  var FALLBACK = {
    2026: [["01-01", "元旦"], ["02-17", "春节"], ["04-05", "清明节"], ["05-01", "劳动节"], ["06-19", "端午节"], ["09-25", "中秋节"], ["10-01", "国庆节"]],
    2027: [["01-01", "元旦"], ["02-06", "春节"], ["04-05", "清明节"], ["05-01", "劳动节"], ["06-09", "端午节"], ["09-15", "中秋节"], ["10-01", "国庆节"]]
  };

  var memCache = {}; // year -> list，脚本常驻内存，pjax 切换时无需重新请求
  var timer = null;

  /* ── 日期工具 ─────────────────────────────────────── */

  function ymd(d) {
    var m = d.getMonth() + 1;
    var day = d.getDate();
    return d.getFullYear() + "-" + (m < 10 ? "0" + m : m) + "-" + (day < 10 ? "0" + day : day);
  }

  function startOfToday(now) {
    var d = new Date(now.getTime());
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  function calcProgress(now) {
    var t = now.getTime();
    var today = startOfToday(now);
    var y = new Date(t).getFullYear();

    // 周一为一周之始（getDay() 里周日是 0，先换算成周一=0）
    var weekStart = today - ((new Date(t).getDay() + 6) % 7) * DAY;

    var monthStart = new Date(y, new Date(t).getMonth(), 1).getTime();
    var monthEnd = new Date(y, new Date(t).getMonth() + 1, 1).getTime();

    var yearStart = new Date(y, 0, 1).getTime();
    var yearEnd = new Date(y + 1, 0, 1).getTime();

    return {
      day: (t - today) / DAY,
      week: (t - weekStart) / (7 * DAY),
      month: (t - monthStart) / (monthEnd - monthStart),
      year: (t - yearStart) / (yearEnd - yearStart)
    };
  }

  /* ── 节假日数据 ───────────────────────────────────── */

  // 接口把春节拆成「除夕 / 初一 / 初二…」，统一归并成「春节」
  function normalizeName(name) {
    if (!name) return "节日";
    if (/^(除夕|初[一二三四五六七八九十])$/.test(name)) return "春节";
    return name;
  }

  function parseList(json) {
    var h = json && json.holiday;
    if (!h) return null;
    var out = [];
    for (var k in h) {
      if (!Object.prototype.hasOwnProperty.call(h, k)) continue;
      var v = h[k];
      if (v && v.holiday && v.date) out.push({ date: v.date, name: normalizeName(v.name) });
    }
    if (!out.length) return null;
    out.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    return out;
  }

  function fallbackList(year) {
    var arr = FALLBACK[year];
    if (!arr) return null;
    return arr
      .map(function (x) { return { date: year + "-" + x[0], name: x[1] }; })
      .sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
  }

  function readCache(year) {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (!o || o.year !== year || !o.list || !o.list.length) return null;
      if (Date.now() - o.ts > CACHE_TTL) return null;
      return o.list;
    } catch (e) {
      return null;
    }
  }

  function writeCache(year, list) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ year: year, ts: Date.now(), list: list }));
    } catch (e) {
      /* 隐私模式等场景下写入失败，忽略即可 */
    }
  }

  function getList(year, cb) {
    if (memCache[year]) return cb(memCache[year]);

    var cached = readCache(year);
    if (cached) {
      memCache[year] = cached;
      return cb(cached);
    }

    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var to = ctrl ? setTimeout(function () { ctrl.abort(); }, FETCH_TIMEOUT) : null;

    fetch(API + year + "/", ctrl ? { signal: ctrl.signal } : undefined)
      .then(function (r) { return r.json(); })
      .then(function (j) { return parseList(j) || fallbackList(year); })
      .catch(function () { return fallbackList(year); })
      .then(function (list) {
        if (to) clearTimeout(to);
        if (list && list.length) {
          memCache[year] = list;
          writeCache(year, list);
        }
        cb(list);
      });
  }

  // 找出今天之后最近的一个节日；同名的连续假期回溯到首日
  function pickNext(list, todayStr) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].date >= todayStr) {
        var name = list[i].name;
        var start = list[i].date;
        for (var j = i; j > 0 && list[j - 1].name === name; j--) start = list[j - 1].date;
        return { name: name, date: start };
      }
    }
    return null;
  }

  function daysUntil(dateStr, now) {
    var diff = Math.round((new Date(dateStr + "T00:00:00").getTime() - startOfToday(now)) / DAY);
    return diff < 0 ? 0 : diff;
  }

  function loadHoliday(now, cb) {
    var year = now.getFullYear();
    var todayStr = ymd(now);

    getList(year, function (list) {
      var next = list ? pickNext(list, todayStr) : null;
      if (next) return cb(next);

      // 本年度已无假期，取下一年的
      getList(year + 1, function (list2) {
        cb(list2 ? pickNext(list2, todayStr) : null);
      });
    });
  }

  /* ── 渲染 ─────────────────────────────────────────── */

  function renderHoliday(info, now) {
    var nameEl = document.getElementById("cd-name");
    var daysEl = document.getElementById("cd-days");
    var dateEl = document.getElementById("cd-date");
    if (!nameEl || !daysEl || !dateEl) return;

    if (!info) {
      nameEl.textContent = "--";
      daysEl.textContent = "--";
      dateEl.textContent = "--";
      return;
    }

    nameEl.textContent = info.name;
    daysEl.textContent = daysUntil(info.date, now);
    dateEl.textContent = info.date.replace(/-/g, "/");
  }

  function buildRows(right) {
    if (right.childElementCount === UNITS.length) return;
    right.innerHTML = "";

    UNITS.forEach(function (u) {
      var item = document.createElement("div");
      item.className = "cd-item";

      var label = document.createElement("span");
      label.className = "cd-item-name";
      label.textContent = u.label;

      var track = document.createElement("div");
      track.className = "cd-track";

      var fill = document.createElement("div");
      fill.className = "cd-fill";

      var pct = document.createElement("span");
      pct.className = "cd-pct is-out";

      track.appendChild(fill);
      track.appendChild(pct);
      item.appendChild(label);
      item.appendChild(track);
      right.appendChild(item);
    });
  }

  function renderProgress(right, p) {
    var rows = right.children;
    for (var i = 0; i < UNITS.length; i++) {
      var row = rows[i];
      if (!row) continue;

      var v = p[UNITS[i].key];
      v = Math.max(0, Math.min(1, isFinite(v) ? v : 0));

      var num = v * 100;
      var txt = num.toFixed(2) + "%";
      var fill = row.querySelector(".cd-fill");
      var pct = row.querySelector(".cd-pct");

      fill.style.width = txt;
      pct.style.left = txt;
      pct.textContent = txt;
      pct.className = "cd-pct " + (num >= IN_THRESHOLD ? "is-in" : "is-out");
    }
  }

  /* ── 生命周期 ─────────────────────────────────────── */

  function stopTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function init() {
    var right = document.getElementById("cd-right");
    if (!right) return; // 当前页面没有侧边栏卡片

    var now = new Date();
    buildRows(right);
    renderProgress(right, calcProgress(now));
    renderHoliday(null, now);

    loadHoliday(now, function (info) {
      renderHoliday(info, new Date());
    });

    stopTimer();
    timer = setInterval(function () {
      var el = document.getElementById("cd-right");
      if (!el) return;
      renderProgress(el, calcProgress(new Date()));
    }, REFRESH_INTERVAL);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // pjax 切换页面时，侧边栏会被整体替换，需要重新初始化
  document.addEventListener("pjax:complete", init);
  document.addEventListener("pjax:error", init);
  document.addEventListener("pjax:send", stopTimer);
})();
