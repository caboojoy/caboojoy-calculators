/* ═══════════════════════════════════════════════
   D-DAY 계산기  script.js
   - 양력 / 음력 입력 지원 (lunar-javascript)
   - 음력 입력 시 양력으로 변환하여 저장
   - 매년 반복 옵션 (음력 생일 등)
═══════════════════════════════════════════════ */

const STORAGE_KEY = 'dday_items_v3';

let items = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let sortMode = localStorage.getItem('dday_sort') || 'near';
let calType = 'solar'; // 'solar' | 'lunar'

// ── 달력 타입 토글 ──────────────────────────
function setCalType(type) {
  calType = type;
  document.getElementById('btnSolar').classList.toggle('active', type === 'solar');
  document.getElementById('btnLunar').classList.toggle('active', type === 'lunar');
  document.getElementById('lunarOptions').style.display = type === 'lunar' ? 'flex' : 'none';
  // 미리보기 초기화
  const pv = document.getElementById('lunarPreview');
  pv.style.display = 'none';
  pv.textContent = '';
  onDateInput();
}

// ── 날짜 입력 시 음력 미리보기 ──────────────
function onDateInput() {
  if (calType !== 'lunar') return;
  const dateVal = document.getElementById('inputDate').value;
  const isLeap = document.getElementById('chkLeap').checked;
  const pv = document.getElementById('lunarPreview');
  if (!dateVal) { pv.style.display = 'none'; return; }

  const solarStr = lunarToSolar(dateVal, isLeap);
  if (!solarStr) {
    pv.className = 'lunar-preview error';
    pv.textContent = '변환 실패: 유효하지 않은 음력 날짜입니다.';
    pv.style.display = 'block';
    return;
  }
  const dow = getDow(solarStr);
  pv.className = 'lunar-preview';
  pv.innerHTML = `음력 ${formatDisplay(dateVal)}${isLeap ? ' (윤달)' : ''}`
    + `<span class="lp-arrow">→</span>`
    + `<span class="lp-solar">양력 ${formatDisplay(solarStr)} (${dow})</span>`;
  pv.style.display = 'block';
}

// ── 음력 → 양력 변환 ───────────────────────
function lunarToSolar(lunarDateStr, isLeap = false) {
  try {
    const [y, m, d] = lunarDateStr.split('-').map(Number);
    const lunar = Lunar.fromYmd(y, m, d); // leap 처리는 fromYmdIsLeap
    const l = isLeap ? Lunar.fromYmdIsLeap(y, m, d) : Lunar.fromYmd(y, m, d);
    const solar = l.getSolar();
    return `${solar.getYear()}-${String(solar.getMonth()).padStart(2,'0')}-${String(solar.getDay()).padStart(2,'0')}`;
  } catch (e) {
    return null;
  }
}

// ── 음력 날짜를 "올해 또는 내년"의 양력으로 ─
function lunarToSolarNextOccurrence(lunarMonth, lunarDay, isLeap = false) {
  const now = new Date();
  const thisYear = now.getFullYear();
  for (let y = thisYear; y <= thisYear + 1; y++) {
    try {
      const l = isLeap ? Lunar.fromYmdIsLeap(y, lunarMonth, lunarDay) : Lunar.fromYmd(y, lunarMonth, lunarDay);
      const solar = l.getSolar();
      const solarStr = `${solar.getYear()}-${String(solar.getMonth()).padStart(2,'0')}-${String(solar.getDay()).padStart(2,'0')}`;
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (new Date(solarStr) >= today) return solarStr;
    } catch (e) { /* 윤달 없는 해 등 */ }
  }
  return null;
}

// ── 양력 → 음력 표시용 ─────────────────────
function solarToLunarDisplay(solarDateStr) {
  try {
    const [y, m, d] = solarDateStr.split('-').map(Number);
    const solar = Solar.fromYmd(y, m, d);
    const lunar = solar.getLunar();
    const leap = lunar.isLeap() ? '(윤)' : '';
    return `음력 ${lunar.getYear()}년 ${lunar.getMonth()}월 ${lunar.getDay()}일${leap}`;
  } catch (e) {
    return null;
  }
}

function getDow(dateStr) {
  const d = new Date(dateStr);
  return ['일','월','화','수','목','금','토'][d.getDay()];
}

// ── 정렬 ────────────────────────────────────
function setSort(mode) {
  sortMode = mode;
  localStorage.setItem('dday_sort', mode);
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.sort === mode);
  });
  render();
}

function getSorted() {
  const arr = [...items];
  switch (sortMode) {
    case 'near':
      return arr.sort((a, b) => {
        const da = Math.abs(calcDday(getEffectiveDate(a)));
        const db = Math.abs(calcDday(getEffectiveDate(b)));
        if (da === 0) return -1;
        if (db === 0) return 1;
        return da - db;
      });
    case 'added': return arr;
    case 'asc':   return arr.sort((a, b) => getEffectiveDate(a).localeCompare(getEffectiveDate(b)));
    case 'desc':  return arr.sort((a, b) => getEffectiveDate(b).localeCompare(getEffectiveDate(a)));
    case 'name':  return arr.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko'));
    default:      return arr;
  }
}

// 매년 반복 항목은 올해/내년 양력 날짜를 동적으로 계산
function getEffectiveDate(item) {
  if (item.isLunar && item.repeat) {
    const [, lm, ld] = item.lunarDate.split('-').map(Number);
    const next = lunarToSolarNextOccurrence(lm, ld, item.lunarLeap);
    return next || item.date;
  }
  return item.date;
}

// ── 추천 디데이 ─────────────────────────────
const RECOMMENDATIONS = [
  { icon: '🎄', name: '크리스마스', date: getNextAnnual(12, 25) },
  { icon: '🌸', name: '어버이날', date: getNextAnnual(5, 8) },
  { icon: '🎓', name: '수능', date: getNextSuneung() },
  { icon: '🌙', name: '추석', date: getChuseok() },
  { icon: '🎆', name: '새해 첫날', date: getNewYear() },
  { icon: '💘', name: '발렌타인데이', date: getNextAnnual(2, 14) },
  { icon: '🌹', name: '화이트데이', date: getNextAnnual(3, 14) },
  { icon: '👩‍💼', name: '근로자의 날', date: getNextAnnual(5, 1) },
  { icon: '🏖️', name: '여름 휴가', date: getNextAnnual(8, 1) },
];

function getNextAnnual(month, day) {
  const now = new Date();
  const y = now.getFullYear();
  let d = new Date(y, month - 1, day);
  if (d < now) d = new Date(y + 1, month - 1, day);
  return toDateStr(d);
}

function getNewYear() {
  return `${new Date().getFullYear() + 1}-01-01`;
}

function getNextSuneung() {
  const now = new Date();
  const y = now.getFullYear();
  let d = getNthWeekday(y, 11, 4, 3);
  if (d < now) d = getNthWeekday(y + 1, 11, 4, 3);
  return toDateStr(d);
}

function getChuseok() {
  const now = new Date();
  const y = now.getFullYear();
  const dates = { 2024: '2024-09-17', 2025: '2025-10-06', 2026: '2026-09-25', 2027: '2027-10-14' };
  let d = new Date(dates[y] || `${y}-09-20`);
  if (d < now) { const ny = y + 1; d = new Date(dates[ny] || `${ny}-09-20`); }
  return toDateStr(d);
}

function getNthWeekday(year, month, weekday, n) {
  let d = new Date(year, month - 1, 1), count = 0;
  while (true) {
    if (d.getDay() === weekday) count++;
    if (count === n) return d;
    d.setDate(d.getDate() + 1);
  }
}

// ── 유틸 ────────────────────────────────────
function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

function formatDisplay(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${y}년 ${parseInt(m)}월 ${parseInt(d)}일`;
}

function calcDday(dateStr) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(dateStr);
  return Math.round((target - today) / 86400000);
}

function getDdayLabel(diff) {
  if (diff === 0) return { text: 'D-DAY', cls: 'today' };
  if (diff > 0)   return { text: `D-${diff}`, cls: 'future' };
  return { text: `D+${Math.abs(diff)}`, cls: 'past' };
}

function getBreakdown(diff) {
  const abs = Math.abs(diff);
  const parts = [];
  const years = Math.floor(abs / 365.25);
  const months = Math.floor(abs / 30.44);
  const weeks = Math.floor(abs / 7);
  if (years > 0) parts.push(`${years}년`);
  else if (months > 0) parts.push(`약 ${months}개월`);
  if (weeks > 0) parts.push(`${weeks}주`);
  return parts.join(' · ');
}

function getCardAccent(diff) {
  if (diff === 0) return 'var(--accent3)';
  if (diff > 0)   return 'var(--accent)';
  return 'var(--accent2)';
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// ── 렌더 ────────────────────────────────────
function render() {
  const list = document.getElementById('ddayList');
  if (items.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📅</div>
        <div class="empty-text">아직 추가된 디데이가 없어요.<br>날짜를 입력하거나 추천 디데이를 눌러보세요!</div>
      </div>`;
    return;
  }

  const sorted = getSorted();

  list.innerHTML = sorted.map(item => {
    const effectiveDate = getEffectiveDate(item);
    const diff = calcDday(effectiveDate);
    const { text, cls } = getDdayLabel(diff);
    const breakdown = diff !== 0 ? getBreakdown(diff) : '';
    const isToday = diff === 0;
    const accent = getCardAccent(diff);

    // 음력 뱃지
    let lunarBadge = '';
    if (item.isLunar) {
      const repeatClass = item.repeat ? ' repeat' : '';
      const repeatMark = item.repeat ? ' 🔁' : '';
      lunarBadge = `<span class="lunar-badge${repeatClass}">음력${repeatMark}</span>`;
    }

    // 날짜 부가 정보 (음력일 경우 양력 날짜 병기)
    let dateLine = formatDisplay(effectiveDate);
    let dateSubLine = '';
    if (item.isLunar && item.lunarDate) {
      const leapStr = item.lunarLeap ? ' (윤달)' : '';
      dateSubLine = `<div class="card-date-sub">음력 ${formatDisplay(item.lunarDate)}${leapStr}</div>`;
    }

    return `
      <div class="dday-card ${isToday ? 'is-today' : ''}" style="--card-accent: ${accent}">
        <div class="card-left">
          <div class="card-name">
            ${item.name || '이름 없음'}
            ${lunarBadge}
            ${isToday ? '<span class="today-tag">오늘!</span>' : ''}
          </div>
          <div class="card-date">${dateLine}</div>
          ${dateSubLine}
        </div>
        <div class="card-right">
          <div class="number-group">
            <div class="dday-number ${cls}">${text}</div>
            ${breakdown ? `<div class="breakdown"><span class="breakdown-item">${breakdown}</span></div>` : ''}
            <div class="dday-label ${cls}">${diff > 0 ? '남음' : diff < 0 ? '지남' : '디데이'}</div>
          </div>
          <button class="del-btn" onclick="deleteItem('${item.id}')" title="삭제">✕</button>
        </div>
      </div>`;
  }).join('');
}

// ── 추가 ────────────────────────────────────
function addDday(name, date, options = {}) {
  // 직접 호출 (추천 칩 등) vs UI 입력
  const nameVal = name !== undefined ? name : document.getElementById('inputName').value.trim();
  const dateVal = date !== undefined ? date : document.getElementById('inputDate').value;
  if (!dateVal) { alert('날짜를 입력해주세요!'); return; }

  let solarDate = dateVal;
  let isLunar = false;
  let lunarDate = null;
  let lunarLeap = false;
  let repeat = false;

  // UI 입력인 경우만 calType 적용
  if (name === undefined) {
    isLunar = calType === 'lunar';
    lunarLeap = document.getElementById('chkLeap').checked;
    repeat = document.getElementById('chkRepeat').checked;

    if (isLunar) {
      const converted = lunarToSolar(dateVal, lunarLeap);
      if (!converted) { alert('유효하지 않은 음력 날짜입니다.\n날짜를 확인해주세요.'); return; }
      lunarDate = dateVal;
      solarDate = converted;
    }
  } else {
    // options 에서 오는 경우 (addResult 등)
    isLunar = options.isLunar || false;
    lunarDate = options.lunarDate || null;
    lunarLeap = options.lunarLeap || false;
    repeat = options.repeat || false;
  }

  items.push({
    id: Date.now().toString(),
    name: nameVal,
    date: solarDate,      // 항상 양력
    isLunar,
    lunarDate,            // 원래 입력한 음력 날짜
    lunarLeap,
    repeat,
  });

  save();
  render();

  // UI 초기화
  if (name === undefined) {
    document.getElementById('inputName').value = '';
    document.getElementById('inputDate').value = '';
    document.getElementById('chkLeap').checked = false;
    document.getElementById('chkRepeat').checked = false;
    document.getElementById('lunarPreview').style.display = 'none';
    setCalType('solar');
  }
}

function deleteItem(id) {
  items = items.filter(i => i.id !== id);
  save();
  render();
}

// ── 추천 칩 ─────────────────────────────────
function renderRec() {
  const chips = document.getElementById('recChips');
  chips.innerHTML = RECOMMENDATIONS.map(r => {
    const date = typeof r.date === 'function' ? r.date() : r.date;
    if (!date) return '';
    const diff = calcDday(date);
    const { text } = getDdayLabel(diff);
    return `<div class="chip" onclick="addDday('${r.name}', '${date}')">
      <span class="chip-icon">${r.icon}</span>
      ${r.name}
      <span style="color:var(--muted);font-size:11px">${text}</span>
    </div>`;
  }).join('');
}

function updateToday() {
  const now = new Date();
  const days = ['일','월','화','수','목','금','토'];
  document.getElementById('todayDisplay').textContent =
    `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')} (${days[now.getDay()]})`;
}

// Enter key
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && (document.activeElement.id === 'inputName' || document.activeElement.id === 'inputDate')) {
    addDday();
  }
});

// ── 도구 탭 ─────────────────────────────────
function switchTab(name) {
  const ids = ['ndays','dminus','between','military'];
  document.querySelectorAll('.tool-tab').forEach((btn, i) => btn.classList.toggle('active', ids[i] === name));
  document.querySelectorAll('.tool-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
}

function addResult(date, label) {
  addDday(label || formatDisplay(date), date);
}

// ── N일째 날 ─────────────────────────────────
function calcNdays() {
  const base = document.getElementById('nd-base').value;
  const n = parseInt(document.getElementById('nd-n').value);
  const el = document.getElementById('nd-result');
  if (!base || isNaN(n) || n < 1) { el.innerHTML = '<span class="empty-result">기준일과 일수를 입력하세요</span>'; return; }
  const d = new Date(base);
  d.setDate(d.getDate() + (n - 1));
  const resultStr = toDateStr(d);
  const dow = getDow(resultStr);
  const { text: dtext } = getDdayLabel(calcDday(resultStr));
  el.innerHTML = `
    <div>
      <div class="result-main">${formatDisplay(resultStr)} (${dow})</div>
      <div class="result-sub">${n}일째 되는 날 &nbsp;·&nbsp; ${dtext}</div>
    </div>
    <button class="result-add-btn" onclick="addResult('${resultStr}','${n}일째')">+ D-DAY 추가</button>`;
}

// ── D-N일 ─────────────────────────────────────
function calcDminus() {
  const base = document.getElementById('dm-base').value;
  const n = parseInt(document.getElementById('dm-n').value);
  const dir = document.getElementById('dm-dir').value;
  const el = document.getElementById('dm-result');
  if (!base || isNaN(n)) { el.innerHTML = '<span class="empty-result">기준일과 일수를 입력하세요</span>'; return; }
  const d = new Date(base);
  d.setDate(d.getDate() + (dir === 'after' ? n : -n));
  const resultStr = toDateStr(d);
  const dow = getDow(resultStr);
  const { text: dtext } = getDdayLabel(calcDday(resultStr));
  const label = dir === 'after' ? `${n}일 후` : `${n}일 전`;
  el.innerHTML = `
    <div>
      <div class="result-main">${formatDisplay(resultStr)} (${dow})</div>
      <div class="result-sub">${formatDisplay(base)} 기준 ${label} &nbsp;·&nbsp; ${dtext}</div>
    </div>
    <button class="result-add-btn" onclick="addResult('${resultStr}','${label}')">+ D-DAY 추가</button>`;
}

// ── 며칠째? ───────────────────────────────────
function calcBetween() {
  const start = document.getElementById('bw-start').value;
  const end = document.getElementById('bw-end').value;
  const el = document.getElementById('bw-result');
  if (!start || !end) { el.innerHTML = '<span class="empty-result">시작일과 목표일을 입력하세요</span>'; return; }
  const diffDays = Math.round((new Date(end) - new Date(start)) / 86400000);
  const nthDay = diffDays + 1;
  const abs = Math.abs(diffDays);
  const months = Math.floor(abs / 30.44);
  const weeks = Math.floor(abs / 7);
  let breakdown = '';
  if (months > 0) breakdown += `약 ${months}개월 `;
  if (weeks > 0) breakdown += `(${weeks}주) `;
  const sign = diffDays >= 0 ? '+' : '';
  el.innerHTML = `
    <div>
      <div class="result-main">${diffDays >= 0 ? nthDay + '일째' : Math.abs(diffDays) + '일 전'}</div>
      <div class="result-sub">${formatDisplay(start)} → ${formatDisplay(end)} &nbsp;·&nbsp; ${sign}${diffDays}일 ${breakdown}</div>
    </div>`;
}

// ── 전역일 계산 ───────────────────────────────
function calcMilitary() {
  const enlist = document.getElementById('mil-enlist').value;
  const type = document.getElementById('mil-type').value;
  const el = document.getElementById('mil-result');
  if (!enlist) { el.innerHTML = ''; return; }
  const months = parseInt(type) || 21;
  const enlistDate = new Date(enlist);
  const discharge = new Date(enlistDate);
  discharge.setMonth(discharge.getMonth() + months);
  discharge.setDate(discharge.getDate() - 1);
  const dischargeStr = toDateStr(discharge);
  const dow = getDow(dischargeStr);
  const { text: dtext } = getDdayLabel(calcDday(dischargeStr));
  const milestones = [100, 200, 300];
  const msHTML = milestones.map(n => {
    const d = new Date(enlistDate);
    d.setDate(d.getDate() + n - 1);
    const ds = toDateStr(d);
    const { text: mstext } = getDdayLabel(calcDday(ds));
    return `<div class="mil-result-item">
      <div class="mil-result-label">${n}일째</div>
      <div class="mil-result-value">${formatDisplay(ds)}</div>
      <div class="mil-result-sub">${getDow(ds)}요일 · ${mstext}</div>
    </div>`;
  }).join('');
  el.innerHTML = `
    <div class="mil-result-grid">
      <div class="mil-result-item highlight" style="grid-column:1/-1">
        <div class="mil-result-label">🎖️ 전역일</div>
        <div class="mil-result-value">${formatDisplay(dischargeStr)} (${dow})</div>
        <div class="mil-result-sub">${dtext} · 복무기간 ${months}개월</div>
      </div>
      ${msHTML}
    </div>
    <div style="margin-top:12px;text-align:right">
      <button class="result-add-btn" onclick="addResult('${dischargeStr}','전역일')">+ 전역일 D-DAY 추가</button>
    </div>`;
}

// ── 초기화 ───────────────────────────────────
updateToday();
renderRec();
document.querySelectorAll('.sort-btn').forEach(btn => {
  btn.classList.toggle('active', btn.dataset.sort === sortMode);
});
render();
