/* =========================================================
   КАЛЕНДАРЬ ТРЕНИРОВОК — PWA
   Данные хранятся локально (localStorage). Ключ: wt_workouts_v1
   ========================================================= */
'use strict';

/* ---------- УТИЛИТЫ ---------- */
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const esc = (v) => String(v ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const pad = (n) => String(n).padStart(2, '0');
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayISO = () => isoDate(new Date());
const parseISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const MON_SHORT = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
const DOW = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const WA_TYPE = ['Силовая', 'Кардио', 'Растяжка'];
const uid = () => 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/* ---------- КАТАЛОГ МЫШЦ ---------- */
const MUSCLES = {
  chest:    { name: 'Грудные',        front: true },
  deltF:    { name: 'Передняя дельта', front: true },
  deltR:    { name: 'Задняя дельта',   front: false },
  biceps:   { name: 'Бицепс',          front: true },
  triceps:  { name: 'Трицепс',         front: false },
  forearm:  { name: 'Предплечья',      front: true },
  abs:      { name: 'Пресс',           front: true },
  oblique:  { name: 'Косые мышцы',     front: true },
  traps:    { name: 'Трапеции',        front: false },
  lats:     { name: 'Широчайшие',      front: false },
  lowback:  { name: 'Поясница',        front: false },
  glutes:   { name: 'Ягодицы',         front: false },
  quads:    { name: 'Квадрицепсы',     front: true },
  hams:     { name: 'Бицепс бедра',    front: false },
  calves:   { name: 'Икры',            front: true },
};

const MUSCLE_ORDER = ['chest','deltF','biceps','forearm','abs','oblique','quads','calves','traps','lats','deltR','triceps','lowback','glutes','hams'];

/* ---------- КАТАЛОГ УПРАЖНЕНИЙ ---------- */
const EXERCISES = [
  { name: 'Отжимания', cat: 'Грудь', unit: 'reps', muscles: { chest: 1, deltF: 0.6, triceps: 0.5, abs: 0.3 },
    tips: ['Ладони чуть шире плеч, тело — прямая линия', 'Плавно, без рывков', 'Вниз 2 сек — вверх 1 сек', 'Не прогибайте поясницу'] },
  { name: 'Жим штанги лёжа', cat: 'Грудь', unit: 'weight', muscles: { chest: 1, deltF: 0.5, triceps: 0.5 },
    tips: ['Лопатки сведены, стопы упираются в пол', 'Вдох при опускании', 'Вниз 2 сек, вверх мощно', 'Округлять спину не нужно'] },
  { name: 'Разводка гантелей', cat: 'Грудь', unit: 'weight', muscles: { chest: 1, deltF: 0.2 },
    tips: ['Лёгкий изгиб в локтях', 'Ощутите растяжение груди', 'Медленно, без рывков', 'Не сгибайте локти сильно'] },
  { name: 'Приседания со штангой', cat: 'Ноги', unit: 'weight', muscles: { quads: 1, glutes: 0.8, lowback: 0.4, abs: 0.3, calves: 0.2 },
    tips: ['Спина прямая, колени по носкам', 'Вдох вверху — присед', 'Вниз 2 сек, вверх 1 сек', 'Колени не заваливаются внутрь'] },
  { name: 'Приседания (свой вес)', cat: 'Ноги', unit: 'reps', muscles: { quads: 1, glutes: 0.7, abs: 0.2 },
    tips: ['Ноги на ширине плеч', 'Без спешки', 'Вниз 2 сек, вверх 1 сек', 'Пятки не отрываются'] },
  { name: 'Румынская тяга', cat: 'Ноги', unit: 'weight', muscles: { hams: 1, glutes: 0.8, lowback: 0.5 },
    tips: ['Ноги чуть согнуты, спина прямая', 'Вдох внизу', 'Медленно вниз, вверх 1 сек', 'Округлая спина — под запретом'] },
  { name: 'Выпады', cat: 'Ноги', unit: 'reps', muscles: { quads: 1, glutes: 0.8, hams: 0.3 },
    tips: ['Широкий шаг, корпус ровно', 'Плавно', '2–2 сек', 'Колено не выходит за носок'] },
  { name: 'Подъём на носки', cat: 'Ноги', unit: 'reps', muscles: { calves: 1 },
    tips: ['Полная амплитуда', 'Без рывков', '1–2 сек, пауза вверху 1 сек', 'Не срезайте амплитуду'] },
  { name: 'Подтягивания', cat: 'Спина', unit: 'reps', muscles: { lats: 1, biceps: 0.6, traps: 0.3, deltR: 0.2 },
    tips: ['Хват чуть шире плеч', 'Без раскачки', 'Вверх 1 сек, вниз 2–3 сек', 'Не тяните шею вверх'] },
  { name: 'Тяга штанги в наклоне', cat: 'Спина', unit: 'weight', muscles: { lats: 1, traps: 0.4, deltR: 0.4, biceps: 0.4, lowback: 0.3 },
    tips: ['Наклон корпуса ~45°, спина ровная', 'Выдох при тяге', '1–2 сек', 'Дёргать корпусом не нужно'] },
  { name: 'Тяга верхнего блока', cat: 'Спина', unit: 'weight', muscles: { lats: 1, biceps: 0.5, traps: 0.2 },
    tips: ['Грудь вперёд, лопатки вниз', 'Выдох на усилии', '1–2 сек', 'Не отклоняйтесь сильно назад'] },
  { name: 'Становая тяга', cat: 'Спина', unit: 'weight', muscles: { lowback: 1, glutes: 0.8, hams: 0.7, traps: 0.4, quads: 0.3, forearm: 0.4 },
    tips: ['Гриф у голени, спина нейтральна', 'Вдох внизу', '1–2 сек', 'Округлять спину нельзя'] },
  { name: 'Планка', cat: 'Пресс', unit: 'time', muscles: { abs: 1, lowback: 0.4, deltF: 0.2, quads: 0.2, glutes: 0.2 },
    tips: ['Локти под плечами, тело — прямая линия', 'Дышите ровно', 'Статично, по секундомеру', 'Не проваливайте поясницу и не задирайте таз'] },
  { name: 'Скручивания', cat: 'Пресс', unit: 'reps', muscles: { abs: 1 },
    tips: ['Отрывайте лопатки от пола', 'Выдох при подъёме', '1–2 сек', 'Не тяните шею руками'] },
  { name: 'Ноги в упоре (пресс)', cat: 'Пресс', unit: 'reps', muscles: { abs: 1, oblique: 0.2 },
    tips: ['Поясница прижата к полу', 'Выдох при подъёме ног', '1–2 сек', 'Не роняйте ноги резко'] },
  { name: 'Велосипед', cat: 'Пресс', unit: 'reps', muscles: { abs: 1, oblique: 0.8 },
    tips: ['Локоть тянется к колену', 'Выдох на скручивании', '1–2 сек без спешки', 'Не тяните шею'] },
  { name: 'Жим гантелей вверх', cat: 'Плечи', unit: 'weight', muscles: { deltF: 1, deltR: 0.3, triceps: 0.5, chest: 0.2 },
    tips: ['Гантели на уровне плеч', 'Выдох при жиме', '1–2 сек', 'Не прогибайте поясницу'] },
  { name: 'Махи в стороны', cat: 'Плечи', unit: 'weight', muscles: { deltF: 1, deltR: 0.2, traps: 0.2 },
    tips: ['Лёгкий сгиб в локтях', 'Выдох при подъёме', '1–2 сек, пауза вверху', 'Не поднимайте выше плеч'] },
  { name: 'Подъём штанги на бицепс', cat: 'Руки', unit: 'weight', muscles: { biceps: 1, forearm: 0.4 },
    tips: ['Локти прижаты к корпусу', 'Вверх выдох', '1–2 сек', 'Не раскачивайте корпус'] },
  { name: 'Французский жим', cat: 'Руки', unit: 'weight', muscles: { triceps: 1 },
    tips: ['Локти смотрят вверх, не в стороны', 'Вдох при опускании', '1–2 сек', 'Не разводите локти широко'] },
  { name: 'Отжимания на брусьях', cat: 'Руки', unit: 'reps', muscles: { triceps: 1, chest: 0.5, deltF: 0.3 },
    tips: ['Корпус слегка вперёд', 'Выдох при подъёме', '1–2 сек', 'Не опускайтесь слишком глубоко'] },
  { name: 'Бег / джоггинг', cat: 'Кардио', unit: 'time', muscles: { quads: 0.7, calves: 0.8, glutes: 0.3, hams: 0.4 },
    tips: ['Ровный темп, дышите носом+ртом', 'Ритмичное дыхание', 'Постоянный темп', 'Не приземляйтесь на пятку резко'] },
  { name: 'Прыжки (разминка)', cat: 'Кардио', unit: 'reps', muscles: { calves: 0.8, quads: 0.5, abs: 0.3 },
    tips: ['Приземляйтесь мягко', 'Дышите ровно', 'Быстрый ритм', 'Не приземляйтесь на прямые ноги'] },
  { name: 'Скакалка', cat: 'Кардио', unit: 'time', muscles: { calves: 1, quads: 0.4, forearm: 0.4 },
    tips: ['Вращайте запястьями, а не руками', 'Ровное дыхание', 'Стабильный ритм', 'Прыгайте невысоко, приземляйтесь мягко'] },
];

const fixLib = () => {
  for (const e of EXERCISES) {
    if (Array.isArray(e.tips[0])) { const flat = []; for (const piece of e.tips) flat.push(...piece); e.tips = flat; }
    while (e.tips.length < 4) e.tips.push('Держите технику в приоритете');
  }
};
fixLib();
const CUSTOM_KEY = 'wt_custom_ex_v1';
const loadCustom = () => { try { return JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]'); } catch { return []; } };
const allExercises = () => [...loadCustom(), ...EXERCISES];
const findExercise = (name) => allExercises().find((e) => e.name === name);

/* ---------- СОСТОЯНИЕ И ХРАНИЛИЩЕ ---------- */
const LS_KEY = 'wt_workouts_v1';
let workouts = [];
try { workouts = JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { workouts = []; }

const save = () => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(workouts)); }
  catch { alert('Не удалось сохранить данные (localStorage).'); }
};

const state = {
  view: 'calendar',
  // календарь
  year: new Date().getFullYear(),
  month: new Date().getMonth(),
  // день
  dayISO: todayISO(),
  // редактор
  editing: null,
  error: '',
  // каталог
  libCat: 'Все',
  libSearch: '',
  libFocus: null,
  // прогресс
  prSet: 'Отжимания',
  // профиль
  profile: (() => { try { return JSON.parse(localStorage.getItem('wt_profile_v1') || '{}'); } catch { return {}; } })(),
  dark: localStorage.getItem('wt_dark') === '1',
};

const saveProfile = () => localStorage.setItem('wt_profile_v1', JSON.stringify(state.profile));

function applyDark(on) {
  state.dark = on;
  document.documentElement.classList.toggle('dark', on);
  localStorage.setItem('wt_dark', on ? '1' : '0');
  const meta = $('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', on ? '#0f172a' : '#f97316');
}
applyDark(state.dark);

/* ---------- ПОИСК РАБОТ ---------- */
const findWorkout = (id) => workouts.find((w) => w.id === id) || null;
const forDay = (iso) => workouts.filter((w) => w.date === iso);

/* ---------------- КОМПОНЕНТЫ ---------------- */
const jbtn = (label, onClick, cls = 'btn') => {
  const b = document.createElement('button');
  b.className = cls;
  b.textContent = label;
  b.addEventListener('click', onClick);
  return b;
};

function modal(inner, { buildBody, actionLabel, onAction, onClose, wide } = {}) {
  if (!inner) return null;
  const host = $('#modalHost');
  host.hidden = false;
  let layer = document.createElement('div');
  layer.className = 'modal-layer';
  const sheet = document.createElement('div');
  sheet.className = 'sheet' + (wide ? ' sheet-wide' : '');
  sheet.innerHTML = `
    <div class="sheet-head"><div class="sheet-title">${inner}</div><button class="uni-x" data-close aria-label="Закрыть">✕</button></div>
    <div class="sheet-body" id="modalBody"></div>
    ${actionLabel ? `<div class="sheet-foot"><button class="btn primary" id="modalAction">${esc(actionLabel)}</button><button class="btn subtle" data-close>Отмена</button></div>` : ''}
  `;
  host.appendChild(layer);
  layer.appendChild(sheet);
  const close = () => { layer.remove(); if (!host.children.length) host.hidden = true; onClose && onClose(); };
  const bk = document.createElement('div');
  bk.className = 'modal-backdrop';
  layer.insertBefore(bk, sheet);
  bk.addEventListener('click', close);
  $$('[data-close]', layer).forEach((x) => x.addEventListener('click', close));
  if (onAction) $('#modalAction', layer).addEventListener('click', () => onAction(close));
  if (buildBody) buildBody($('#modalBody', layer));
  return close;
}

/* ---------------- КАРТОЧКА ТРЕНИРОВКИ ---------------- */
function wc(w, small) {
  const card = document.createElement('div');
  card.className = 'wc' + (w.done ? ' wc-done' : '');
  const ex = w.exercises.length ? `${w.exercises.length} упр. · ${w.type}` : 'Пустая тренировка';
  card.innerHTML = `
    <div class="wc-top">
      <span class="wc-title">${esc(w.title || 'Тренировка')}</span>
      <span class="pill ${w.done ? 'pill-green' : 'pill-orange'}">${w.done ? 'Выполнено' : 'Запланировано'}</span>
    </div>
    <div class="wc-meta">${ex}</div>
    <div class="wc-actions">
      <button class="btn tiny done-btn">${w.done ? 'Снять отметку' : 'Отметить выполнение'}</button>
      <button class="btn tiny">Редактировать</button>
      <button class="btn tiny subtle">Удалить</button>
    </div>`;
  const [bDone, bEdit, bDel] = $$('.wc-actions .btn', card);
  bDone.addEventListener('click', () => {
    w.done = !w.done;
    if (w.done) for (const e of w.exercises) for (const s of e.sets) { s.done = 1; s.doneDate = w.date; }
    else for (const e of w.exercises) for (const s of e.sets) { s.done = 0; s.doneDate = null; }
    save(); render();
  });
  bEdit.addEventListener('click', () => editWorkout(w.id));
  bDel.addEventListener('click', () => confirmDialog('Удалить тренировку?', `«${w.title || 'Тренировка'}» будет удалена безвозвратно.`, () => { workouts = workouts.filter((x) => x.id !== w.id); save(); render(); }));
  return card;
}

/* ---------------- КАЛЕНДАРЬ ---------------- */
function viewCalendar() {
  const app = $('#app');
  app.innerHTML = `
    <header class="topbar">
      <div class="topbar-l">
        <div class="topbar-title">Календарь тренировок</div>
        <div class="topbar-sub">Планируйте, выполняйте, отслеживайте прогресс</div>
      </div>
    </header>
    <div class="month-bar">
      <button class="btn subtle icon" id="prevM" aria-label="Предыдущий месяц">‹</button>
      <div class="month-label" id="monthLabel"></div>
      <button class="btn subtle icon" id="nextM" aria-label="Следующий месяц">›</button>
    </div>
    <div class="weekrow">${DOW.map((d) => `<div class="weekr-d">${d}</div>`).join('')}</div>
    <div class="calgrid" id="calGrid"></div>
    <div class="legend"><span><i class="dot dot-green"></i> Выполнено</span><span><i class="dot dot-orange"></i> Запланировано</span></div>
    <section class="daylist" id="dayList"></section>
  `;

  $('#monthLabel').textContent = `${MONTHS[state.month]} ${state.year}`;
  $('#prevM').addEventListener('click', () => { if (--state.month < 0) { state.month = 11; state.year--; } render(); });
  $('#nextM').addEventListener('click', () => { if (++state.month > 11) { state.month = 0; state.year++; } render(); });

  const grid = $('#calGrid');
  const first = new Date(state.year, state.month, 1);
  const firstDow = (first.getDay() + 6) % 7; // Пн=0
  for (let i = 0; i < firstDow; i++) grid.appendChild(el('div', 'calcell off'));
  const dim = new Date(state.year, state.month + 1, 0).getDate();
  const tISO = todayISO();
  for (let d = 1; d <= dim; d++) {
    const iso = `${state.year}-${pad(state.month + 1)}-${pad(d)}`;
    const list = forDay(iso);
    const full = list.some((w) => w.done);
    const part = !full && list.length > 0;
    const cell = el('button', 'calcell' + (full ? ' has' : '') + (part ? ' planned' : ''));
    cell.innerHTML = `<span class="calnum">${d}</span>${list.length ? `<span class="caldots"></span>` : ''}`;
    if (iso === tISO) cell.classList.add('today');
    cell.addEventListener('click', () => { state.dayISO = iso; gotoView('day'); });
    grid.appendChild(cell);
  }
  while (grid.children.length % 7 !== 0) grid.appendChild(el('div', 'calcell off'));

  const dl = $('#dayList');
  const sec = el('section', 'sec');
  const label = document.createElement('div');
  label.className = 'sec-title';
  label.textContent = `Тренировки на ${state.dayISO === tISO ? 'сегодня' : state.dayISO}`;
  sec.appendChild(label);
  if (state.error) { const p = el('p', 'form-error'); p.textContent = state.error; sec.appendChild(p); }
  const planned = forDay(state.dayISO);
  if (!planned.length) {
    const empty = el('div', 'empty');
    empty.innerHTML = `<div class="empty-ico">🏋️</div><p>На этот день пока нет тренировок</p><button class="btn primary">Добавить тренировку</button>`;
    $('button', empty).addEventListener('click', () => addWorkout(state.dayISO));
    sec.appendChild(empty);
  } else {
    for (const w of planned) sec.appendChild(wc(w));
    const addBtn = jbtn('+ Добавить ещё', () => addWorkout(state.dayISO));
    sec.appendChild(addBtn);
  }
  dl.appendChild(sec);

  // краткая сводка недели
  const wk = weekStats();
  const bar = el('section', 'sec');
  bar.innerHTML = `<div class="sec-title">Неделя: выполнено ${wk.done}/5</div>
    <div class="meter"><i style="width:${Math.min(100, Math.round((wk.done / 5) * 100))}%"></i></div>`;
  if (wk.done >= 5) {
    const note = document.createElement('p');
    note.className = 'hint';
    note.innerHTML = '🎉 Цель 5 тренировок — выполнена! Можете добавить ещё одну.';
    bar.appendChild(note);
    const b = jbtn('+ Добавить бонусную', () => addWorkout(state.dayISO));
    bar.appendChild(b);
  }
  const chart = el('div', 'chart-holder');
  weeklyChart(chart);
  bar.appendChild(chart);
  dl.appendChild(bar);
}

function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}

/* ---------------- ДЕНЬ ---------------- */
const gotoView = (v) => { state.view = v; render(); };

function viewDay() {
  const app = $('#app');
  const d = parseISO(state.dayISO);
  const tISO = todayISO();
  app.innerHTML = `
    <header class="topbar">
      <button class="btn subtle icon" id="backBtn" aria-label="Назад">‹</button>
      <div>
        <div class="topbar-title">${d.getDate()} ${MON_SHORT[d.getMonth()]} ${d.getFullYear()}</div>
        <div class="topbar-sub">${state.dayISO === tISO ? 'Сегодня' : ''}</div>
      </div>
      <div class="topbar-r"><button class="btn tiny" id="todayBtn">Сегодня</button></div>
    </header>
    <div class="day-navbar">
      <button class="btn subtle icon" id="prevD" aria-label="Предыдущий день">‹</button>
      <button class="btn subtle icon" id="nextD" aria-label="Следующий день">›</button>
    </div>
    <section class="daylist" id="dayArea"></section>
  `;
  $('#backBtn').addEventListener('click', () => gotoView('calendar'));
  $('#todayBtn').addEventListener('click', () => { state.dayISO = tISO; renderDayInto(); });
  $('#prevD').addEventListener('click', () => { const x = parseISO(state.dayISO); x.setDate(x.getDate() - 1); state.dayISO = isoDate(x); renderDayInto(); });
  $('#nextD').addEventListener('click', () => { const x = parseISO(state.dayISO); x.setDate(x.getDate() + 1); state.dayISO = isoDate(x); renderDayInto(); });
  renderDayInto();
}

function renderDayInto() {
  const dev = $('#dayArea');
  dev.innerHTML = '';
  document.querySelector('.topbar .topbar-sub').textContent = state.dayISO === todayISO() ? 'Сегодня' : '';
  const d = parseISO(state.dayISO);
  document.querySelector('.topbar .topbar-title').textContent = `${d.getDate()} ${MON_SHORT[d.getMonth()]} ${d.getFullYear()}`;
  const sec = el('section', 'sec');
  if (state.error) { const p = el('p', 'form-error'); p.textContent = state.error; sec.appendChild(p); }
  const planned = forDay(state.dayISO);
  if (!planned.length) {
    const empty = el('div', 'empty');
    empty.innerHTML = `<div class="empty-ico">🏋️‍♀️</div><p>На этот день пока нет тренировок</p>`;
    sec.appendChild(empty);
  } else {
    for (const w of planned) sec.appendChild(wc(w));
  }
  sec.appendChild(jbtn('+ Добавить тренировку', () => addWorkout(state.dayISO), 'btn primary'));
  const bar = el('section', 'sec');
  bar.innerHTML = `
    <div class="sec-title">Объём недели</div>
    <div class="stat-grid"><div class="stat"><b id="statSets">0</b><span>сетов на неделе</span></div><div class="stat"><b id="statUpd">0</b><span>снято отметок</span></div></div>`;
  const chart = el('div', 'chart-holder');
  weeklyChart(chart);
  bar.appendChild(chart);
  dev.appendChild(sec);
  dev.appendChild(bar);
  const week = weekSets();
  const s = $('#statSets'), u = $('#statUpd');
  if (s) s.textContent = week.doneSets;
  if (u) u.textContent = week.unDone;
}

/* ---------------- ГРАФИКИ ---------------- */
function weeklyChart(container) {
  const now = new Date();
  const mon = new Date(now);
  mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
  const labels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const vals = labels.map((_, i) => {
    const d = new Date(mon); d.setDate(d.getDate() + i);
    return forDay(isoDate(d)).some((w) => w.done) ? 1 : 0;
  });
  const W = 240, H = 90, bw = 22, gap = (W - 7 * bw) / 6;
  let svg = `<svg viewBox="0 0 ${W} ${H}" class="wchart" role="img" aria-label="Тренировки по дням недели">`;
  vals.forEach((v, i) => {
    const x = i * (bw + gap), y = v ? 8 : H - 18;
    svg += `<rect x="${x}" y="${v ? y : H - 18}" width="${bw}" height="${v ? H - 18 - y : 10}" rx="4"
      fill="${v ? 'var(--ok)' : 'var(--border)'}" opacity="${v ? 1 : 0.7}"></rect>
      <text x="${x + bw / 2}" y="${H - 4}" text-anchor="middle" class="wchart-t">${labels[i]}</text>`;
  });
  svg += '</svg>';
  container.innerHTML = svg;
}

/* ---------------- РЕДАКТОР ТРЕНИРОВКИ ---------------- */
const addWorkout = (day) => openEditor({ id: null, date: day, title: '', type: 'Силовая', notes: '', done: false, exercises: [] });

function editWorkout(id) {
  const w = findWorkout(id);
  if (!w) return;
  openEditor(w);
}

function openEditor(src) {
  const draft = JSON.parse(JSON.stringify(src));
  if (!draft.id) draft.id = uid();
  state.editing = draft;
  const isEdit = !!src.id;
  const close = modal(isEdit ? 'Редактировать тренировку' : 'Новая тренировка', {
    actionLabel: 'Сохранить',
    onClose: () => { state.editing = null; render(); },
    onAction: (doClose) => {
      const setErr = (msg) => { const box = $('#modalErr'); if (box) { box.hidden = false; box.textContent = msg; } };
      const title = $('#wfTitle')?.value.trim() || '';
      if (!title.trim()) { setErr('Введите название тренировки.'); return; }
      if (!draft.exercises.length) { setErr('Добавьте хотя бы одно упражнение.'); return; }
      if (draft.exercises.some((e) => e.sets.length === 0)) { setErr('У каждого упражнения должен быть хотя бы один подход.'); return; }
      if (!state.editing) return;
      draft.title = title;
      draft.type = $('#wfType')?.value || draft.type;
      draft.notes = $('#wfNotes')?.value?.trim() || '';
      const idx = workouts.findIndex((w) => w.id === draft.id);
      if (idx >= 0) workouts[idx] = draft; else workouts.push(draft);
      save();
      state.editing = null;
      state.error = '';
      goToDay(draft.date);
      doClose();
    },
    buildBody: (body) => {
      body.innerHTML = `
        <p class="form-error" id="modalErr" hidden></p>
        <label class="lb"><input id="wfTitle" class="inp" placeholder="Название" maxlength="60" value="${esc(draft.title)}"></label>
        <div class="row">
          <select class="inp" id="wfType">${WA_TYPE.map((t) => `<option ${draft.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
        </div>
        <p class="hint">Выбранный день: <b class="inline-date">${esc(draft.date)}</b> (<button class="linky" id="leftMove">‹ сдвинуть</button> / <button class="linky" id="rightMove">сдвинуть ›</button>)</p>
        <label class="lb"><textarea id="wfNotes" class="inp" rows="2" placeholder="Заметки (необязательно)">${esc(draft.notes)}</textarea></label>
        <div class="sec-title" style="margin-top:14px">Упражнения</div>
        <div id="exList"></div>
        <button class="btn subtle wide" id="addEx">+ Добавить упражнение</button>
      `;
      $('#leftMove', body).addEventListener('click', () => { const x = parseISO(draft.date); x.setDate(x.getDate() - 1); draft.date = isoDate(x); $('.inline-date', body).textContent = draft.date; });
      $('#rightMove', body).addEventListener('click', () => { const x = parseISO(draft.date); x.setDate(x.getDate() + 1); draft.date = isoDate(x); $('.inline-date', body).textContent = draft.date; });
      drawExList(body, draft);
      $('#addEx', body).addEventListener('click', () => addExPick(body, draft));
    },
  }, true);
  return close;
}

function drawExList(body, draft) {
  const exList = $('#exList', body);
  exList.innerHTML = '';
  if (!draft.exercises.length) {
    exList.innerHTML = `<p class="hint">Пока нет упражнений — нажмите «Добавить упражнение».</p>`;
    return;
  }
  const definite = allExercises();
  draft.exercises.forEach((ex, i) => {
    const lib = definite.find((x) => x.name === ex.name);
    const card = el('div', 'ex-block');
    card.innerHTML = `
      <div class="ex-head">
        <b>${esc(ex.name)}</b>
        <button class="uni-x ex-del" data-i="${i}" aria-label="Удалить упражнение">✕</button>
      </div>
      ${lib ? `<p class="hint">${lib.tips[0]}</p>` : ''}
      <div class="sets" data-xi="${i}"></div>
      <button class="btn tiny subtle addSet" data-i="${i}">+ подход</button>
    `;
    exList.appendChild(card);
    const wrap = $('.sets', card);
    ex.sets.forEach((s, si) => {
      const row = el('div', 'set-row');
      row.innerHTML = `
        <label class="set-f"><span>подход</span><b>${si + 1}</b></label>
        <label class="set-f"><span>${lib?.unit === 'time' ? 'сек/мин' : 'вес'}</span><input type="number" min="0" step="0.5" value="${esc(s.w || 0)}" data-si="${si}" data-f="w"></label>
        <label class="set-f"><span>${lib?.unit === 'time' ? 'время' : 'повторы'}</span><input type="number" min="0" step="1" value="${esc(s.r || 0)}" data-si="${si}" data-f="r"></label>
        <button class="set-ok ${s.done ? 'on' : ''}" title="${s.done ? 'Выполнено' : 'Отметить выполненным'}">${s.done ? '✔' : '○'}</button>
        <button class="set-del" title="Удалить подход">🗑</button>
      `;
      wrap.appendChild(row);
      const [fW, fR] = $$('input', row);
      fW.addEventListener('input', () => { s.w = Number(fW.value) || 0; });
      fR.addEventListener('input', () => { s.r = Number(fR.value) || 0; });
      $('.set-ok', row).addEventListener('click', () => {
        s.done = s.done ? 0 : 1;
        if (s.done) { s.doneDate = draft.date; for (const o of draft.exercises) for (const os of o.sets) if (os !== s && os.done && os.doneDate === draft.date) os.doneDate = draft.date; }
        else s.doneDate = null;
        row.querySelector('.set-ok').classList.toggle('on', !!s.done);
        row.querySelector('.set-ok').textContent = s.done ? '✔' : '○';
      });
      $('.set-del', row).addEventListener('click', () => { ex.sets.splice(si, 1); drawExList(body, draft); });
    });
    $('.addSet', card).addEventListener('click', () => { ex.sets.push({ w: 0, r: 0, done: 0, doneDate: null }); drawExList(body, draft); });
    $('.ex-del', card).addEventListener('click', () => { draft.exercises.splice(i, 1); drawExList(body, draft); });
  });
}

function addExPick(body, draft) {
  const closePick = modal('Выберите упражнение', {
    buildBody: (b2) => {
      b2.innerHTML = `
        <input class="inp" id="pickSearch" placeholder="Поиск упражнения…" value="${esc(state.libSearch)}">
        <div class="chips" id="pickCats">${['Все', 'Грудь', 'Спина', 'Ноги', 'Плечи', 'Руки', 'Пресс', 'Кардио', 'Другое'].map((c) => `<button class="chip ${c === state.libCat ? 'chip-on' : ''}">${c}</button>`).join('')}</div>
        <div id="pickList"></div>
        <button class="btn subtle wide" id="addCustom">+ Создать своё упражнение</button>`;
      const draw = () => {
        const q = $('#pickSearch', b2).value.toLowerCase();
        const list = $('#pickList', b2);
        list.innerHTML = '';
        const items = allExercises().filter((e) =>
          (state.libCat === 'Все' || e.cat === state.libCat) &&
          (e.name.toLowerCase().includes(q) || (e.tips && e.tips.join(' ').toLowerCase().includes(q))));
        if (!items.length) list.innerHTML = '<p class="hint">Ничего не найдено.</p>';
        const hl = {};
        for (const it of items) for (const m in it.muscles) hl[m] = Math.max(hl[m] || 0, it.muscles[m]);
        list.appendChild(muscleFigure(hl));
        for (const it of items) {
          const row = document.createElement('button');
          row.className = 'ex-item';
          row.innerHTML = `<span class="ex-name">${esc(it.name)}</span><span class="pill pill-gray">${esc(it.cat)}</span>`;
          row.addEventListener('click', () => {
            draft.exercises.push({ name: it.name, sets: [{ w: 0, r: 0, done: 0, doneDate: null }] });
            closePick(); drawExList(body, draft);
          });
          row.addEventListener('mouseenter', () => renderPickPreview(list, it.muscles));
          row.addEventListener('mouseleave', () => renderPickPreview(list, hl));
          list.appendChild(row);
        }
        $('#addCustom', b2).addEventListener('click', () => { closePick(); pickCustom(() => { addExPick(body, draft); }); });
      };
      $('#pickSearch', b2).addEventListener('input', () => { state.libSearch = $('#pickSearch', b2).value; draw(); });
      $$('#pickCats .chip', b2).forEach((c) => c.addEventListener('click', () => { state.libCat = c.textContent; draw(); }));
      draw();
    },
  }, true);
}

function renderPickPreview(list, map) {
  const old = $('.mfig', list);
  old?.remove();
  const d = muscleFigure(map);
  if (old) list.insertBefore(d, old); else list.prepend(d);
}

function pickCustom(after) {
  modal('Своё упражнение', {
    actionLabel: 'Добавить',
    onAction: (doClose) => {
      const cat = $('#exCat2')?.value || 'Другое';
      const name = $('#exName2')?.value.trim();
      const target = $('#exTargetBox')?.value;
      if (!name) { const p = $('#modalErr'); p.hidden = false; p.textContent = 'Введите название.'; return; }
      const custom = { name, cat, unit: cat === 'Кардио' ? 'time' : 'reps', muscles: cat === 'Другое' ? {} : target === '1' ? TARGET_SOFT[cat] || TARGET[cat] : TARGET[cat], tips: ['Техника важнее веса'] };
      const cus = loadCustom();
      if (cus.some((x) => x.name.toLowerCase() === name.toLowerCase())) { const p = $('#modalErr'); p.hidden = false; p.textContent = 'Такое упражнение уже есть.'; return; }
      cus.push(custom);
      try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(cus)); } catch { /* ignore */ }
      state.libCat = cat;
      doClose();
      after && after();
    },
    buildBody: (b) => {
      b.innerHTML = `
        <p class="form-error" id="modalErr" hidden></p>
        <label class="lb">Название<input class="inp" id="exName2" maxlength="50" placeholder="Например: Гиперэкстензия"></label>
        <label class="lb">Категория
          <select class="inp" id="exCat2">${['Грудь','Спина','Ноги','Плечи','Руки','Пресс','Кардио','Другое'].map((c) => `<option>${c}</option>`).join('')}</select>
        </label>
        <div id="exTargetWrap">
          <label class="lb">Роль мышц
            <select class="inp" id="exTargetBox"><option value="0">Основные</option><option value="1">Второстепенные</option></select>
          </label>
          <p class="hint">Для категории «Другое» карта мышц будет пустой — такое упражнение считается общим.</p>
        </div>`;
      const syncTarget = () => {
        $('#exTargetWrap', b).hidden = $('#exCat2', b).value === 'Другое';
      };
      $('#exCat2', b).addEventListener('change', syncTarget);
      syncTarget();
    },
  });
}

const TARGET = {
  'Грудь': { chest: 1 }, 'Спина': { lats: 1 }, 'Ноги': { quads: 1 }, 'Плечи': { deltF: 1 }, 'Руки': { biceps: 1 }, 'Пресс': { abs: 1 }, 'Кардио': { calves: 0.5 }, 'Другое': {},
};
const TARGET_SOFT = {
  'Грудь': { chest: 0.6 }, 'Спина': { lats: 0.6 }, 'Ноги': { quads: 0.6 }, 'Плечи': { deltF: 0.6 }, 'Руки': { biceps: 0.6 }, 'Пресс': { abs: 0.6 }, 'Кардио': { calves: 0.4 }, 'Другое': {},
};

/* ---------------- КАТАЛОГ УПРАЖНЕНИЙ ---------------- */
function viewLibrary() {
  const app = $('#app');
  app.innerHTML = `
    <header class="topbar"><div class="topbar-l">
      <div class="topbar-title">Упражнения</div>
      <div class="topbar-sub">Справочник с техникой и мышцами</div>
    </div><div class="topbar-r"><button class="btn tiny" id="addCust">+ Своё</button></div></header>
    <div class="lib-controls">
      <input class="inp" id="libSearch" placeholder="Поиск…" value="${esc(state.libSearch)}">
      <div class="chips" id="libCats">${['Все','Грудь','Спина','Ноги','Плечи','Руки','Пресс','Кардио','Другое'].map((c) => `<button class="chip ${c === state.libCat ? 'chip-on':''}">${c}</button>`).join('')}</div>
    </div>
    <div class="figfix" id="figFix"></div>
    <div id="libList" class="daylist"></div>`;
  $('#addCust').addEventListener('click', () => pickCustom(() => render()));
  const draw = () => {
    const q = state.libSearch.toLowerCase();
    const list = $('#libList');
    list.innerHTML = '';
    const items = allExercises().filter((e) => (state.libCat === 'Все' || e.cat === state.libCat) && (e.name.toLowerCase().includes(q) || e.tips.join(' ').toLowerCase().includes(q)));
    if (!items.length) list.appendChild(el('div', 'empty', '<p>Ничего не найдено</p>'));
    const hl = {};
    for (const it of items) for (const m in it.muscles) hl[m] = Math.max(hl[m] || 0, it.muscles[m]);
    $('#figFix').classList.add('on');
    $('#figFix').innerHTML = '';
    $('#figFix').appendChild(muscleFigure(hl));
    for (const it of items) {
      const row = document.createElement('button');
      row.className = 'ex-item';
      row.innerHTML = `<span class="ex-name">${esc(it.name)}</span><span class="pill pill-gray">${esc(it.cat)}</span>`;
      row.addEventListener('mouseenter', () => { $('#figFix').innerHTML = ''; $('#figFix').appendChild(muscleFigure(it.muscles)); });
      row.addEventListener('mouseleave', () => { $('#figFix').innerHTML = ''; $('#figFix').appendChild(muscleFigure(hl)); });
      row.addEventListener('click', () => openExDetail(it));
      list.appendChild(row);
    }
  };
  $('#libSearch').addEventListener('input', (e) => { state.libSearch = e.target.value; draw(); });
  $$('#libCats .chip').forEach((c) => c.addEventListener('click', () => { state.libCat = c.textContent; draw(); $$('#libCats .chip').forEach((x) => x.classList.toggle('chip-on', x.textContent === state.libCat)); }));
  draw();
}

function openExDetail(ex) {
  modal(ex.name, {
    buildBody: (b) => {
      b.innerHTML = `
        <div class="mfig-fix"><div class="mfig-inline" id="exMap"></div>
        <div class="mlist" id="exMuscles"></div></div>
        <div class="tech">
          <div class="tech-row"><b>Старт:</b><span>${esc(ex.tips[0])}</span></div>
          <div class="tech-row"><b>Дыхание:</b><span>${esc(ex.tips[1])}</span></div>
          <div class="tech-row"><b>Темп:</b><span>${esc(ex.tips[2])}</span></div>
          <div class="tech-row"><b>Ошибка:</b><span>${esc(ex.tips[3])}</span></div>
        </div>
        <button class="btn primary wide" id="addToday">Добавить в тренировку на ${esc(state.dayISO)}</button>`;
      $('#exMap', b).appendChild(muscleFigure(ex.muscles));
      const ml = $('#exMuscles', b);
      ml.innerHTML = '';
      const entries = Object.entries(ex.muscles).sort((a, bb2) => bb2[1] - a[1]);
      for (const [id, v] of entries) {
        const row = el('div', 'mrow');
        row.innerHTML = `<span class="mname">${esc(MUSCLES[id]?.name || id)}</span><span class="mbadge ${v >= 0.8 ? 'hi' : ''}">${v >= 0.8 ? 'целевая' : 'вспомогательная'}</span>`;
        ml.appendChild(row);
      }
      $('#addToday', b).addEventListener('click', () => {
        let w = forDay(state.dayISO)[0];
        if (!w) {
          w = { id: uid(), date: state.dayISO, title: `${ex.cat}: ${ex.name}`, type: ex.cat === 'Кардио' ? 'Кардио' : 'Силовая', notes: '', done: false, exercises: [] };
          workouts.push(w);
        }
        w.exercises.push({ name: ex.name, sets: [{ w: 0, r: 0, done: 0, doneDate: null }] });
        save();
        close();
        editWorkout(w.id);
      });
    },
  });
}

/* ---------------- SVG ГРУППЫ МЫШЦ ---------------- */
function muscleFigure(map = {}) {
  const maxV = Math.max(0.0001, ...Object.values(map));
  const col = (v) => {
    const t = Math.min(1, Math.max(0, (v / maxV) * 0.85 + 0.15));
    return `color-mix(in srgb, var(--hl) ${Math.round(t * 100)}%, var(--m0))`;
  };
  const pFront = (id, path) => `<path d="${path}" fill="${map[id] ? col(map[id]) : 'var(--m0)'}" stroke="var(--mstroke)" stroke-width="2"/>`;
  const frontBody = `
    <circle cx="100" cy="34" r="22" fill="var(--m0)" stroke="var(--mstroke)" stroke-width="2"/>
    ${pFront('deltF', 'M62,78 Q50,86 54,104 Q66,110 76,102 L76,78 Z')}
    ${pFront('deltF', 'M138,78 Q150,86 146,104 Q134,110 124,102 L124,78 Z')}
    ${pFront('chest', 'M76,76 Q86,70 100,70 Q114,70 124,76 L120,104 Q100,114 80,104 Z')}
    ${pFront('abs', 'M86,110 Q100,106 114,110 L112,158 Q100,166 88,158 Z')}
    ${pFront('oblique', 'M80,106 Q84,134 82,158 L74,152 Q74,122 76,100 Z')}
    ${pFront('oblique', 'M120,106 Q116,134 118,158 L126,152 Q126,122 124,100 Z')}
    ${pFront('biceps', 'M52,108 Q44,130 48,150 Q56,156 62,152 L58,112 Z')}
    ${pFront('biceps', 'M148,108 Q156,130 152,150 Q144,156 138,152 L142,112 Z')}
    ${pFront('forearm', 'M46,152 Q40,176 44,196 Q50,202 56,198 L54,152 Z')}
    ${pFront('forearm', 'M154,152 Q160,176 156,196 Q150,202 144,198 L146,152 Z')}
    ${pFront('quads', 'M72,168 Q58,220 66,268 Q80,276 92,266 L92,172 Q82,168 72,168 Z')}
    ${pFront('quads', 'M128,168 Q142,220 134,268 Q120,276 108,266 L108,172 Q118,168 128,168 Z')}
    ${pFront('calves', 'M72,272 Q64,300 70,326 Q80,332 88,324 L88,272 Z')}
    ${pFront('calves', 'M128,272 Q136,300 130,326 Q120,332 112,324 L112,272 Z')}
  `;
  const backBody = `
    <circle cx="100" cy="34" r="22" fill="var(--m0)" stroke="var(--mstroke)" stroke-width="2"/>
    ${pFront('traps', 'M70,64 Q100,80 130,64 L124,84 Q100,96 76,84 Z')}
    ${pFront('deltR', 'M58,80 Q46,90 52,106 Q64,112 74,102 L72,80 Z')}
    ${pFront('deltR', 'M142,80 Q154,90 148,106 Q136,112 126,102 L128,80 Z')}
    ${pFront('lats', 'M76,88 Q100,100 124,88 L120,140 Q100,130 80,140 Z')}
    ${pFront('lowback', 'M88,140 Q100,146 112,140 L110,168 Q100,174 90,168 Z')}
    ${pFront('triceps', 'M50,110 Q42,132 46,152 Q54,158 60,154 L56,112 Z')}
    ${pFront('triceps', 'M150,110 Q158,132 154,152 Q146,158 140,154 L144,112 Z')}
    ${pFront('forearm', 'M44,154 Q38,178 42,198 Q48,204 54,200 L52,154 Z')}
    ${pFront('forearm', 'M156,154 Q162,178 158,198 Q152,204 146,200 L148,154 Z')}
    ${pFront('glutes', 'M78,172 Q58,186 62,206 Q74,216 92,208 L92,178 Q84,174 78,172 Z')}
    ${pFront('glutes', 'M122,172 Q142,186 138,206 Q126,216 108,208 L108,178 Q116,174 122,172 Z')}
    ${pFront('hams', 'M72,212 Q62,248 70,278 Q80,284 90,276 L90,214 Q80,212 72,212 Z')}
    ${pFront('hams', 'M128,212 Q138,248 130,278 Q120,284 110,276 L110,214 Q120,212 128,212 Z')}
    ${pFront('calves', 'M72,282 Q64,308 70,330 Q80,336 88,328 L88,282 Z')}
    ${pFront('calves', 'M128,282 Q136,308 130,330 Q120,336 112,328 L112,282 Z')}
  `;
  const fig = (side, body, label) => `
    <div class="mfig-col">
      <svg viewBox="0 0 200 360" class="mfig-svg" role="img" aria-label="Схема мышц: ${label}">${body}</svg>
      <div class="mfig-cap">${label}</div>
    </div>`;
  const wrap = el('div', 'mfig');
  wrap.innerHTML = fig('front', frontBody, 'Вид спереди') + fig('back', backBody, 'Вид сзади');
  return wrap;
}

/* ---------------- ПРОГРЕСС ---------------- */
function weekKey(d) { const m = new Date(d); m.setDate(m.getDate() - ((m.getDay() + 6) % 7)); return `${m.getFullYear()}-${pad(m.getMonth() + 1)}-${pad(m.getDate())}`; }

function viewProgress() {
  const app = $('#app');
  const now = new Date();
  const weeks = [];
  for (let w = 11; w >= 0; w--) {
    const d = new Date(now);
    d.setDate(d.getDate() - w * 7);
    const key = weekKey(d);
    weeks.push({ key, label: `${pad(d.getDate())}.${pad(d.getMonth() + 1)}`, done: 0, sets: 0, volume: 0 });
  }
  const wkIndex = new Map(weeks.map((w) => [w.key, w]));
  for (const w of workouts) if (w.done) {
    const k = weekKey(parseISO(w.date));
    const rec = wkIndex.get(k);
    if (rec) {
      rec.done++;
      for (const ex of w.exercises) for (const s of ex.sets) { rec.sets++; rec.volume += (s.w || 0) * (s.r || 0); }
    }
  }
  const monthDone = workouts.filter((w) => w.done && parseISO(w.date).getMonth() === now.getMonth() && parseISO(w.date).getFullYear() === now.getFullYear()).length;
  const totals = weekTotals();
  const maxDone = Math.max(1, ...weeks.map((w) => w.done));
  const bxs = [];
  for (let i = 0; i < weeks.length; i++) {
    const x = 12 + i * ((PANEL_W - 24) / 12);
    const h = Math.round((weeks[i].done / maxDone) * 60) + (weeks[i].done ? 3 : 0);
    bxs.push(`<rect x="${x}" y="${70 - h}" width="16" height="${h}" rx="3" fill="${weeks[i].done ? 'var(--ok)' : 'var(--border)'}"></rect>`);
    bxs.push(`<text x="${x + 8}" y="84" text-anchor="middle" class="ct">${weeks[i].label.slice(0, 2)}${weeks[i].label.slice(-2)}</text><text x="${x + 8}" y="${66 - h}" text-anchor="middle" class="ct ct-v">${weeks[i].done || ''}</text>`);
  }
  app.innerHTML = `
    <header class="topbar"><div class="topbar-l">
      <div class="topbar-title">Прогресс</div><div class="topbar-sub">Статистика за 12 недель</div></div></header>
    <div class="stat-grid">
      <div class="stat"><b>${monthDone}</b><span>за месяц: тренировок выполнено</span></div>
      <div class="stat"><b>${weeks.reduce((a, w) => a + w.done, 0)}</b><span>за 12 недель: тренировок</span></div>
      <div class="stat"><b>${totals.doneSets}</b><span>сетов на текущей неделе</span></div>
      <div class="stat"><b>${totals.unDone}</b><span>снято отметок на неделе</span></div>
    </div>
    <div class="sec">
      <div class="sec-title">Выполнено тренировок по неделям</div>
      <div class="chart-holder"><svg viewBox="0 0 ${PANEL_W} 96" class="ppchart" role="img" aria-label="Тренировки по неделям">${bxs.join('')}</svg></div>
    </div>
    <div class="sec">
      <div class="sec-title">Тренированные зоны за месяц</div>
      <div id="heatWrap"></div>
    </div>
    <div class="sec">
      <div class="sec-title">Рекорды веса</div>
      <select class="inp" id="prSel">${allExercises().filter((x) => Object.keys(x.muscles).length).map((x) => `<option ${x.name === state.prSet ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>
      <div id="prChart" class="chart-holder"></div>
      <div id="prInfo" class="hint"></div>
    </div>`;
  const hw = $('#heatWrap');
  hw.appendChild(heatFigure());
  $('#prSel').addEventListener('change', (e) => { state.prSet = e.target.value; drawPR(); });
  drawPR();
}

const PANEL_W = 200;

function heatFigure() {
  const map = {};
  const now = new Date();
  const cutoff = new Date(now); cutoff.setMonth(cutoff.getMonth() - 1);
  for (const w of workouts) {
    if (!w.done) continue;
    const d = parseISO(w.date);
    if (d < cutoff) continue;
    for (const ex of w.exercises) for (const s of ex.sets) {
      const lib = findExercise(ex.name);
      if (!lib) continue;
      for (const m in lib.muscles) map[m] = (map[m] || 0) + lib.muscles[m];
    }
  }
  const fig = muscleFigure(map);
  fig.classList.add('mfig-heat');
  const uniq = el('p', 'hint', 'Карта показывает, какие мышцы активнее всего работали в выполненных тренировках за последние ~4 недели.');
  const holder = el('div');
  holder.appendChild(fig);
  holder.appendChild(uniq);
  return holder;
}

function drawPR() {
  const chartEl = $('#prChart');
  const info = $('#prInfo');
  chartEl.innerHTML = '';
  info.textContent = '';
  const points = [];
  for (const w of workouts) {
    if (!w.done) continue;
    const ex = w.exercises.find((x) => x.name === state.prSet);
    if (!ex) continue;
    for (const s of ex.sets) if ((s.w || 0) > 0) points.push({ date: w.date, v: s.w });
  }
  if (points.length < 1) {
    chartEl.appendChild(el('p', 'hint', 'Пока нет зафиксированных весов — отметьте тренировку и укажите вес.'));
    return;
  }
  points.sort((a, b) => a.date.localeCompare(b.date));
  const best = [];
  let cur = 0;
  for (const p of points) { cur = Math.max(cur, p.v); best.push({ ...p, best: cur }); }
  const last = best[best.length - 1];
  info.textContent = `Рекорд: ${fmtKg(last.best)}. Последняя попытка ${fmtKg(points[points.length - 1].v)} (${points[points.length - 1].date}).`;
  const W = 260, H = 110, pad2 = 22;
  const minV = Math.min(...points.map((p) => p.v), last.best) || 0;
  const maxV = last.best || 1;
  const xAt = (i) => pad2 + (i * (W - pad2 * 2)) / Math.max(1, best.length - 1);
  const yAt = (v) => H - pad2 - ((v - minV) / Math.max(0.0001, maxV - minV)) * (H - pad2 * 1.6);
  let svg = `<svg viewBox="0 0 ${W} ${H}" class="prchart" role="img" aria-label="Динамика веса">`;
  let line1 = '', line2 = '';
  best.forEach((p, i) => {
    line1 += (i ? 'L' : 'M') + xAt(i).toFixed(1) + ',' + yAt(p.v).toFixed(1) + ' ';
    line2 += (i ? 'L' : 'M') + xAt(i).toFixed(1) + ',' + yAt(p.best).toFixed(1) + ' ';
  });
  svg += `<path d="${line2}" fill="none" stroke="var(--hl)" stroke-dasharray="3 3" stroke-width="1.5" opacity="0.7"/>`;
  svg += `<path d="${line1}" fill="none" stroke="var(--hl)" stroke-width="2"/>`;
  best.forEach((p, i) => { svg += `<circle cx="${xAt(i).toFixed(1)}" cy="${yAt(p.v).toFixed(1)}" r="2.5" fill="var(--hl)"/><title>${p.date}: ${fmtKg(p.v)}</title>`; });
  svg += `<text x="${pad2}" y="${H - 6}" class="ct">${points[0].date.slice(5)}</text><text x="${W - pad2}" y="${H - 6}" text-anchor="end" class="ct">${last.date.slice(5)}</text>`;
  svg += '</svg>';
  chartEl.innerHTML = svg;
}

const fmtKg = (v) => `${v} кг`;

/* ---------------- ПОВЕСТКА МЕСЯЦА: УТИЛИТЫ ---------------- */
function weekSets() {
  const now = new Date();
  const mon = new Date(now); mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
  let doneSets = 0, unDone = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(mon); d.setDate(d.getDate() + i);
    for (const w of forDay(isoDate(d))) {
      for (const ex of w.exercises) for (const s of ex.sets) { if (w.done || s.done) doneSets++; else unDone++; }
    }
  }
  return { doneSets, unDone };
}
function weekTotals() { return weekSets(); }
function weekStats() {
  const now = new Date();
  const mon = new Date(now); mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
  let done = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(mon); d.setDate(d.getDate() + i);
    if (forDay(isoDate(d)).some((w) => w.done)) done++;
  }
  return { done };
}
function goToDay(iso) {
  state.dayISO = iso;
  const d = parseISO(iso);
  state.year = d.getFullYear();
  state.month = d.getMonth();
  if (state.editing) return;
  gotoView('day');
}

/* ---------------- ПРОФИЛЬ / НАСТРОЙКИ ---------------- */
function viewSettings() {
  const app = $('#app');
  const pr = state.profile;
  app.innerHTML = `
    <header class="topbar"><div class="topbar-l"><div class="topbar-title">Профиль</div><div class="topbar-sub">Цели, уведомления, данные</div></div></header>
    <div class="sec">
      <label class="lb">Имя<input class="inp" id="pfName" placeholder="Ваше имя" value="${esc(pr.name || '')}"></label>
      <div class="row2">
        <label class="lb">Рост (см)<input class="inp num" id="pfH" type="number" value="${esc(pr.h || '')}"></label>
        <label class="lb">Вес (кг)<input class="inp num" id="pfW" type="number" step="0.5" value="${esc(pr.w || '')}"></label>
      </div>
      <label class="lb">Цель тренировок (в неделю)<input class="inp num" id="pfGoal" type="number" min="1" max="7" value="${esc(pr.goal ?? 5)}"></label>
      <button class="btn primary wide" id="pfSave">Сохранить</button>
    </div>
    <div class="sec">
      <div class="sec-title">Оформление</div>
      <button class="btn wide subtle" id="darkBtn"></button>
    </div>
    <div class="sec">
      <div class="sec-title">Уведомления</div>
      <p class="hint" id="permState"></p>
      <button class="btn wide subtle" id="notifyBtn">Включить напоминания</button>
    </div>
    <div class="sec">
      <div class="sec-title">Данные</div>
      <div class="row2">
        <button class="btn subtle wide" id="btnExport">Экспорт (JSON)</button>
        <button class="btn subtle wide" id="btnImport">Импорт (JSON)</button>
      </div>
      <input type="file" id="importFile" accept=".json,application/json" hidden>
      <button class="btn wide danger" id="btnClear">Очистить все данные</button>
    </div>
    <div class="sec">
      <div class="sec-title">О приложении</div>
      <p class="hint">Календарь тренировок — локальное PWA: все данные хранятся только на вашем устройстве. Установите его через меню браузера «Добавить на главный экран» для полноценной работы офлайн.</p>
    </div>`;
  $('#pfSave').addEventListener('click', () => {
    state.profile = {
      name: $('#pfName').value.trim(),
      h: Number($('#pfH').value) || '',
      w: Number($('#pfW').value) || '',
      goal: Math.min(7, Math.max(1, Number($('#pfGoal').value) || 5)),
    };
    saveProfile();
    render({});
  });
  const ps = $('#permState');
  const updPerm = () => {
    if (!('Notification' in window)) { ps.textContent = 'Уведомления не поддерживаются этим браузером.'; $('#notifyBtn').disabled = true; return; }
    ps.textContent = Notification.permission === 'granted' ? '✅ Разрешение выдано.' : Notification.permission === 'denied' ? '⛔ Разрешение заблокировано в настройках браузера.' : 'Разрешение не выдано.';
  };
  updPerm();
  const updDark = () => {
    const b = $('#darkBtn');
    if (b) b.textContent = state.dark ? '☀️ Светлая тема' : '🌙 Тёмная тема';
  };
  updDark();
  $('#darkBtn').addEventListener('click', () => { applyDark(!state.dark); updDark(); });
  $('#notifyBtn').addEventListener('click', async () => {
    if (!('Notification' in window)) return;
    const r = await Notification.requestPermission();
    updPerm();
    if (r === 'granted') {
      try { new Notification('Календарь тренировок', { body: 'Напоминания включены! 💪' }); } catch { /* noop */ }
    }
  });
  $('#btnExport').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ workouts, custom: loadCustom(), profile: state.profile }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `trainings-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });
  $('#btnImport').addEventListener('click', () => $('#importFile').click());
  $('#importFile').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (!Array.isArray(data.workouts)) throw new Error('bad');
      workouts = data.workouts;
      if (Array.isArray(data.custom)) localStorage.setItem(CUSTOM_KEY, JSON.stringify(data.custom));
      if (data.profile) { state.profile = data.profile; saveProfile(); }
      save();
      alert('Импорт успешен.');
      render();
    } catch { alert('Некорректный файл.'); }
  });
  $('#btnClear').addEventListener('click', () =>
    confirmDialog('Очистить все данные?', 'Все тренировки, упражнения и прогресс будут удалены безвозвратно.', () => {
      localStorage.removeItem(LS_KEY);
      localStorage.removeItem(CUSTOM_KEY);
      localStorage.removeItem('wt_profile_v1');
      workouts = [];
      state.profile = {};
      alert('Данные удалены.');
      render();
    }));
}

/* ---------------- ПОДТВЕРЖДЕНИЕ ---------------- */
let confirmOk = null;
function confirmDialog(title, text, onYes) {
  const host = $('#confirmHost');
  $('#confirmTitle').textContent = title;
  $('#confirmText').textContent = text;
  host.hidden = false;
  confirmOk = onYes;
  const close = () => { host.hidden = true; confirmOk = null; };
  $('#confirmYes').onclick = () => { const f = confirmOk; close(); f && f(); };
  $('#confirmNo').onclick = close;
  $('#confirmBackdrop').onclick = close;
}

/* ---------------- РОУТЕР ---------------- */
function render(opts = {}) {
  const app = $('#app');
  if (state.editing) return;
  document.body.setAttribute('data-view', state.view);
  $$('#uniNav .uni-btn').forEach((b) => b.classList.toggle('uni-on', b.dataset.view === state.view));
  if (state.view === 'calendar') viewCalendar();
  else if (state.view === 'day') viewDay();
  else if (state.view === 'library') viewLibrary();
  else if (state.view === 'progress') viewProgress();
  else if (state.view === 'settings') viewSettings();
  window.scrollTo(0, 0);
}

$('#uniNav').addEventListener('click', (e) => {
  const b = e.target.closest('.uni-btn');
  if (b && b.dataset.view !== state.view) { state.error = ''; gotoView(b.dataset.view); }
});

/* ---------------- УСТАНОВКА PWA ---------------- */
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (sessionStorage.getItem('a2hs_closed') !== '1') $('#a2hs').hidden = false;
});
$('#a2hsInstall').addEventListener('click', async () => {
  $('#a2hs').hidden = true;
  if (deferredPrompt) { deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; return; }
  if (navigator.share) try { await navigator.share({ title: 'Календарь тренировок', url: location.href }); } catch { /* user cancelled */ }
  else alert('Меню браузера → «Установить приложение» / «Добавить на главный экран».');
});
$('#a2hsClose').addEventListener('click', () => { $('#a2hs').hidden = true; sessionStorage.setItem('a2hs_closed', '1'); });

/* ---------------- СТАРТ ---------------- */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => { /* dev server w/o sw */ });
}
if (!workouts.length) seedWorkouts();
render();
window.addEventListener('resize', () => { if (state.view === 'progress') render(); });

/* Демо-данные при первом запуске */
function seedWorkouts() {
  const t = todayISO();
  const d1 = new Date(parseISO(t)); d1.setDate(d1.getDate() + 2);
  const d2 = new Date(parseISO(t)); d2.setDate(d2.getDate() - 3);
  workouts.push({
    id: uid(), date: isoDate(d1), title: 'Верх тела', type: 'Силовая', done: false, notes: '', dayHits: 0,
    exercises: [
      { name: 'Подтягивания', sets: [{ w: 0, r: 8, done: 0, doneDate: null }, { w: 0, r: 8, done: 0, doneDate: null }, { w: 0, r: 6, done: 0, doneDate: null }] },
      { name: 'Отжимания', sets: [{ w: 0, r: 15, done: 0, doneDate: null }, { w: 0, r: 12, done: 0, doneDate: null }] },
    ],
  });
  workouts.push({
    id: uid(), date: isoDate(d2), title: 'Ноги и пресс', type: 'Силовая', done: true, notes: 'Отличная сессия', dayHits: 0,
    exercises: [
      { name: 'Приседания (свой вес)', sets: [{ w: 0, r: 20, done: 1, doneDate: isoDate(d2) }, { w: 0, r: 15, done: 1, doneDate: isoDate(d2) }] },
      { name: 'Планка', sets: [{ w: 0, r: 60, done: 1, doneDate: isoDate(d2) }] },
    ],
  });
  save();
}
