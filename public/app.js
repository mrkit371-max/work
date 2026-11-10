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
/* дата в человеческом виде: «10 ноя», «10 ноя 2025» (если прошлый год) */
const fmtDate = (iso) => {
  if (!iso) return '';
  const d = parseISO(iso);
  const now = new Date();
  return `${d.getDate()} ${MON_SHORT[d.getMonth()]}${d.getFullYear() !== now.getFullYear() ? ` ${d.getFullYear()}` : ''}`;
};
/* короткая дата для графиков: «10.11» */
const fmtDateShort = (iso) => { const [y, m, d] = iso.split('-'); return `${d}.${m}`; };

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
const LS_KEY = 'wt_workouts_v2';
let workouts = [];
try {
  // старая версия хранилища содержала демо-данные — удаляем её
  localStorage.removeItem('wt_workouts_v1');
  workouts = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
} catch { workouts = []; }

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

function modal(inner, { buildBody, actionLabel, onAction, onClose, confirmClose, wide } = {}) {
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
  const rawClose = () => { layer.remove(); if (!host.children.length) host.hidden = true; onClose && onClose(); };
  /* пользовательское закрытие (фон, ✕, Отмена): confirmClose может отменить и запросить подтверждение */
  const close = () => { if (confirmClose && confirmClose(rawClose)) return; rawClose(); };
  const bk = document.createElement('div');
  bk.className = 'modal-backdrop';
  layer.insertBefore(bk, sheet);
  bk.addEventListener('click', close);
  $$('[data-close]', layer).forEach((x) => x.addEventListener('click', close));
  if (onAction) $('#modalAction', layer).addEventListener('click', () => onAction(rawClose));
  if (buildBody) buildBody($('#modalBody', layer));
  setTimeout(() => { const f = $('input, select, textarea', sheet); if (f) f.focus(); }, 30);
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
      <button class="btn tiny done-btn">${w.done ? 'Снять отметку' : 'Выполнил'}</button>
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

  // краткая сводка недели (цель может быть не задана — тогда без «X/Y»)
  const wk = weekStats();
  const goal = state.profile.goal || 0;
  const bar = el('section', 'sec');
  bar.innerHTML = `<div class="sec-title">Неделя: выполнено ${wk.done}${goal ? `/${goal}` : ''}</div>
    ${goal ? `<div class="meter"><i style="width:${Math.min(100, Math.round((wk.done / goal) * 100))}%"></i></div>` : ''}`;
  if (goal && wk.done >= goal) {
    const note = document.createElement('p');
    note.className = 'hint';
    note.innerHTML = `🎉 Цель ${goal} ${goal === 1 ? 'тренировка' : (goal < 5 ? 'тренировки' : 'тренировок')} — выполнена! Можете добавить ещё одну.`;
    bar.appendChild(note);
    const b = jbtn('+ Добавить бонусную', () => addWorkout(state.dayISO));
    bar.appendChild(b);
  }
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
    <div class="stat-grid"><div class="stat"><b id="statSets">0</b><span>сетов выполнено на неделе</span></div><div class="stat" id="statGoal"></div></div>`;
  const chart = el('div', 'chart-holder');
  weeklyChart(chart);
  bar.appendChild(chart);
  dev.appendChild(sec);
  dev.appendChild(bar);
  const week = weekSets();
  const s = $('#statSets');
  if (s) s.textContent = week.doneSets;
  const g = $('#statGoal');
  if (g) { const gd = state.profile.goal || 0; g.innerHTML = `<b>${weekStats().done}${gd ? `/${gd}` : ''}</b><span>тренировок выполнено за неделю</span>`; }
}

/* ---------------- ГРАФИКИ ---------------- */
function weeklyChart(container) {
  const now = new Date();
  const mon = new Date(now);
  mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
  const labels = DOW;
  const vals = labels.map((_, i) => {
    const d = new Date(mon); d.setDate(d.getDate() + i);
    return forDay(isoDate(d)).some((w) => w.done) ? 1 : 0;
  });
  const todayIdx = (now.getDay() + 6) % 7;
  const W = 240, H = 100, bw = 24, gap = (W - 7 * bw) / 6;
  const baseY = 76; // низ столбцов; подписи начинаются ниже и не налезают на «капли»
  let svg = `<svg viewBox="0 0 ${W} ${H}" class="wchart" role="img" aria-label="Тренировки по дням недели">`;
  vals.forEach((v, i) => {
    const d = new Date(mon); d.setDate(d.getDate() + i);
    const x = i * (bw + gap);
    const h = v ? baseY - 10 : 10; // выполненный день — высокий столб, обычный — низкая «капля»
    const y = baseY - h;
    svg += `<rect x="${x}" y="${y}" width="${bw}" height="${h}" rx="5"
      fill="${v ? 'var(--ok)' : 'var(--border)'}" opacity="${v ? 1 : 0.7}">
      <title>${d.getDate()} ${MON_SHORT[d.getMonth()]} (${labels[i]}): ${v ? 'тренировка выполнена' : 'нет выполненных'}</title></rect>
      <text x="${x + bw / 2}" y="${H - 6}" text-anchor="middle" class="wchart-t"
        font-size="${i === todayIdx ? 10 : 9}" fill="${i === todayIdx ? 'var(--text)' : 'var(--muted)'}">${labels[i]}</text>`;
  });
  svg += '</svg>';
  container.innerHTML = svg;
}

/* ---------------- Готовые наборы и автоназвание ---------------- */
const TRICEPS_EX = ['Французский жим', 'Отжимания на брусьях'];
const BICEPS_EX = ['Подъём штанги на бицепс'];
const TEMPLATES = {
  'Грудь + Трицепс': ['Отжимания', 'Жим штанги лёжа', 'Французский жим', 'Отжимания на брусьях'],
  'Спина + Бицепс': ['Подтягивания', 'Тяга верхнего блока', 'Тяга штанги в наклоне', 'Подъём штанги на бицепс'],
  'Ноги': ['Приседания со штангой', 'Румынская тяга', 'Выпады', 'Подъём на носки'],
  'Плечи': ['Жим гантелей вверх', 'Махи в стороны'],
  'Пресс': ['Планка', 'Скручивания', 'Велосипед'],
  'Кардио': ['Бег / джоггинг', 'Скакалка'],
  'Всё тело': ['Отжимания', 'Подтягивания', 'Приседания (свой вес)', 'Планка'],
};
const defaultSets = (name) => {
  const lib = findExercise(name);
  return Array.from({ length: 3 }, () => ({ w: 0, r: lib?.unit === 'time' ? 60 : 12, done: 0, doneDate: null }));
};
const autoTitle = (draft) => {
  const cats = new Set(draft.exercises.map((e) => findExercise(e.name)?.cat).filter(Boolean));
  if (!cats.size) return '';
  const labels = new Set();
  for (const c of cats) {
    if (c === 'Руки') {
      const names = draft.exercises.map((e) => e.name);
      const tri = names.some((n) => TRICEPS_EX.includes(n));
      const bi = names.some((n) => BICEPS_EX.includes(n));
      labels.add(tri && bi ? 'Руки' : tri ? 'Трицепс' : bi ? 'Бицепс' : 'Руки');
    } else labels.add(c);
  }
  const arr = [...labels];
  if (arr.length === 1) return arr[0];
  if (arr.length === 2) return arr.join(' + ');
  if (arr.every((l) => ['Грудь', 'Спина', 'Плечи', 'Бицепс', 'Трицепс', 'Руки'].includes(l))) return 'Верх тела';
  if (arr.includes('Ноги') && arr.some((l) => l !== 'Ноги')) return 'Всё тело';
  return arr.join(' + ');
};
const applyAutoMeta = (draft) => {
  const cats = new Set(draft.exercises.map((e) => findExercise(e.name)?.cat).filter(Boolean));
  if (!cats.size) return;
  const allCardio = [...cats].every((c) => c === 'Кардио');
  draft.type = allCardio ? 'Кардио' : 'Силовая';
  if (!draft.titleManual) {
    const t = autoTitle(draft);
    if (t) {
      draft.title = t;
      const inp = $('#wfTitle');
      if (inp) inp.value = t;
    }
  }
  const sel = $('#wfType');
  if (sel) sel.value = draft.type;
};

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
  applyAutoMeta(draft); // нормализуем до снимка: окно, где ничего не меняли, не должно требовать подтверждения
  const snapshot = JSON.stringify(draft); // база для проверки «были ли изменения»
  state.editing = draft;
  const isEdit = !!src.id;
  const close = modal(isEdit ? 'Редактировать тренировку' : 'Новая тренировка', {
    actionLabel: 'Сохранить',
    onClose: () => { state.editing = null; render(); },
    /* фон / ✕ / «Отмена» при наличии несохранённых правок — предупреждаем */
    confirmClose: (rawClose) => {
      if (!state.editing) return false;
      if (JSON.stringify(draft) === snapshot) { state.editing = null; return false; }
      confirmDialog('Закрыть без сохранения?', 'Изменения в тренировке не сохранятся.', () => { state.editing = null; rawClose(); }, 'Не сохранять');
      return true;
    },
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
        <p class="hint">Выбранный день: <b class="inline-date">${esc(fmtDate(draft.date))}</b> (<button class="linky" id="leftMove">‹ день назад</button> / <button class="linky" id="rightMove">день вперёд ›</button>)</p>
        <label class="lb"><textarea id="wfNotes" class="inp" rows="2" placeholder="Заметки (необязательно)">${esc(draft.notes)}</textarea></label>
        <div class="sec-title" style="margin-top:14px">Упражнения</div>
        <div class="chips" id="tplChips">${Object.keys(TEMPLATES).map((k) => `<button class="chip" type="button">${k}</button>`).join('')}</div>
        <div id="exList"></div>
        <button class="btn subtle wide" id="addEx">+ Добавить упражнение</button>
      `;
      $('#leftMove', body).addEventListener('click', () => { const x = parseISO(draft.date); x.setDate(x.getDate() - 1); draft.date = isoDate(x); $('.inline-date', body).textContent = fmtDate(draft.date); });
      $('#rightMove', body).addEventListener('click', () => { const x = parseISO(draft.date); x.setDate(x.getDate() + 1); draft.date = isoDate(x); $('.inline-date', body).textContent = fmtDate(draft.date); });
      $$('#tplChips .chip', body).forEach((chip) => chip.addEventListener('click', () => {
        draft.exercises = (TEMPLATES[chip.textContent] || []).map((name) => ({ name, sets: defaultSets(name) }));
        draft.titleManual = false;
        drawExList(body, draft);
      }));
      $('#wfTitle', body).addEventListener('input', () => {
        draft.titleManual = $('#wfTitle', body).value.trim().length > 0;
      });
      applyAutoMeta(draft);
      drawExList(body, draft);
      $('#addEx', body).addEventListener('click', () => addExPick(body, draft));
    },
  }, true);
  return close;
}

function drawExList(body, draft) {
  applyAutoMeta(draft);
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
        <b class="ex-open" title="Показать технику выполнения">${esc(ex.name)}</b>
        <button class="uni-x ex-del" data-i="${i}" aria-label="Удалить упражнение">✕</button>
      </div>
      ${lib ? `<p class="hint">${lib.tips[0]}</p>` : ''}
      <div class="sets" data-xi="${i}"></div>
      <button class="btn tiny subtle addSet" data-i="${i}">+ подход</button>
    `;
    exList.appendChild(card);
    if (lib) $('.ex-open', card).addEventListener('click', () => openExDetail(lib, { hideAdd: true }));
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
  // прячем редактор, пока открыт подборщик — чтобы не мелькал на фоне
  const editorLayer = body.closest('.modal-layer');
  const showEditor = () => { if (editorLayer) editorLayer.style.display = ''; drawExList(body, draft); };
  if (editorLayer) editorLayer.style.display = 'none';

  const closePick = modal('Выберите упражнение', {
    onClose: showEditor,
    buildBody: (b2) => {
      b2.innerHTML = `
        <input class="inp" id="pickSearch" placeholder="Поиск упражнения…" value="${esc(state.libSearch)}">
        <div class="chips" id="pickCats">${['Все', 'Грудь', 'Спина', 'Ноги', 'Плечи', 'Руки', 'Пресс', 'Кардио'].map((c) => `<button class="chip ${c === state.libCat ? 'chip-on' : ''}">${c}</button>`).join('')}</div>
        <div id="pickList"></div>
        <button class="btn subtle wide" id="addCustom">+ Создать своё упражнение</button>`;
      b2.classList.add('pick-body'); // фиксированная высота: окно не «съезжает» при смене категории
      const draw = () => {
        const q = $('#pickSearch', b2).value.toLowerCase();
        const list = $('#pickList', b2);
        list.innerHTML = '';
        const items = allExercises().filter((e) =>
          (state.libCat === 'Все' || e.cat === state.libCat) &&
          (e.name.toLowerCase().includes(q) || (e.tips && e.tips.join(' ').toLowerCase().includes(q))));
        if (!items.length) list.innerHTML = '<p class="hint">Ничего не найдено.</p>';
        list.appendChild(muscleFigure({})); // изначально серый; подсвечивается при наведении на упражнение
        for (const it of items) {
          const row = document.createElement('button');
          row.className = 'ex-item';
          row.innerHTML = `<span class="ex-name">${esc(it.name)}</span><span class="pill pill-gray">${esc(it.cat)}</span>`;
          row.addEventListener('click', () => {
            draft.exercises.push({ name: it.name, sets: [{ w: 0, r: 0, done: 0, doneDate: null }] });
            closePick(); // onClose подборщика → показать редактор с обновлённым списком
          });
          row.addEventListener('mouseenter', () => renderPickPreview(list, it.muscles));
          row.addEventListener('mouseleave', () => renderPickPreview(list, {}));
          list.appendChild(row);
        }
      };
      // вне draw(): кнопка живёт вне перерисовываемого списка — иначе слушатели копятся
      $('#addCustom', b2).addEventListener('click', () => {
        closePick();
        // после сохранения новое упражнение сразу попадает в тренировку, затем возвращаемся к редактору
        customEditor(null, (name) => {
          if (name) draft.exercises.push({ name, sets: [{ w: 0, r: 0, done: 0, doneDate: null }] });
          showEditor();
        });
      });
      $('#pickSearch', b2).addEventListener('input', () => { state.libSearch = $('#pickSearch', b2).value; draw(); });
      $$('#pickCats .chip', b2).forEach((c) => c.addEventListener('click', () => {
        state.libCat = c.textContent;
        $$('#pickCats .chip', b2).forEach((x) => x.classList.toggle('chip-on', x === c));
        draw();
      }));
      draw();
    },
  }, true);
  // поднимаем подборщик повыше и помечаем слой для CSS
  const pickerLayer = [...document.querySelectorAll('.modal-layer')].pop();
  if (pickerLayer) pickerLayer.classList.add('picker-layer');
}

function renderPickPreview(list, map) {
  const old = $('.mfig', list);
  const d = muscleFigure(map);
  if (old) old.replaceWith(d); else list.prepend(d);
}

/* Редактор своего упражнения: название, категория, тип подходов, описание (4 параметра техники), выбор мышц на манекене */
function customEditor(existingName, after) {
  const orig = existingName ? loadCustom().find((x) => x.name === existingName) : null;
  const draft = orig
    ? JSON.parse(JSON.stringify(orig))
    : { name: '', cat: 'Грудь', unit: 'weight', muscles: {}, tips: ['', '', '', ''] };
  const DEFAULT_TIPS = ['Техника важнее веса', 'Дышите ровно', 'Умеренный темп', 'Без резких движений'];
  let dirty = false; // что-то вводили/меняли мышцами? → подтверждаем закрытие
  modal(orig ? 'Изменить упражнение' : 'Своё упражнение', {
    actionLabel: 'Сохранить',
    onClose: () => { dirty = false; },
    confirmClose: (raw) => {
      if (!dirty) return false;
      confirmDialog('Закрыть без сохранения?', 'Упражнение не будет сохранено.', () => { dirty = false; raw(); }, 'Не сохранять');
      return true;
    },
    onAction: (raw) => {
      const setErr = (m) => { const p = $('#modalErr'); if (p) { p.hidden = false; p.textContent = m; } };
      const name = $('#cuName')?.value.trim();
      const cat = $('#cuCat')?.value || 'Грудь';
      const unit = $('#cuUnit')?.value || 'weight';
      if (!name) { setErr('Введите название.'); return; }
      if (name.toLowerCase() !== (existingName || '').toLowerCase() &&
          allExercises().some((e) => e.name.toLowerCase() === name.toLowerCase())) {
        setErr('Такое упражнение уже есть.'); return;
      }
      const tips = [0, 1, 2, 3].map((i) => $('#cuT' + i)?.value.trim() || DEFAULT_TIPS[i]);
      const entry = { name, cat, unit, muscles: { ...draft.muscles }, tips, custom: true };
      const cus = loadCustom();
      if (orig) {
        const idx = cus.findIndex((x) => x.name === existingName);
        cus[idx] = entry;
        // переименовываем в уже существующих тренировках
        if (existingName !== name) {
          for (const w of workouts) for (const e of w.exercises) if (e.name === existingName) e.name = name;
          save();
        }
      } else cus.push(entry);
      try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(cus)); } catch { /* ignore */ }
      state.libCat = cat;
      dirty = false;
      raw();
      after && after(name);
    },
    buildBody: (b) => {
      b.innerHTML = `
        <p class="form-error" id="modalErr" hidden></p>
        <label class="lb">Название<input class="inp" id="cuName" maxlength="50" placeholder="Например: Гиперэкстензия" value="${esc(draft.name)}"></label>
        <div class="row2">
          <label class="lb">Категория
            <select class="inp" id="cuCat">${['Грудь','Спина','Ноги','Плечи','Руки','Пресс','Кардио'].map((c) => `<option ${draft.cat === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
          </label>
          <label class="lb">Формат записи
            <select class="inp" id="cuUnit">
              <option value="weight" ${draft.unit === 'weight' ? 'selected' : ''}>Вес × повторы</option>
              <option value="reps" ${draft.unit === 'reps' ? 'selected' : ''}>Повторы</option>
              <option value="time" ${draft.unit === 'time' ? 'selected' : ''}>Время (сек)</option>
            </select>
          </label>
        </div>
        <div class="sec-title" style="margin:10px 0 4px">Описание выполнения</div>
        <label class="lb">Старт<input class="inp" id="cuT0" maxlength="80" placeholder="Исходное положение" value="${esc(draft.tips[0] || '')}"></label>
        <label class="lb">Дыхание<input class="inp" id="cuT1" maxlength="80" placeholder="Когда вдыхать / выдыхать" value="${esc(draft.tips[1] || '')}"></label>
        <label class="lb">Темп<input class="inp" id="cuT2" maxlength="80" placeholder="Скорость движения" value="${esc(draft.tips[2] || '')}"></label>
        <label class="lb">Типичная ошибка<input class="inp" id="cuT3" maxlength="80" placeholder="Чего избегать" value="${esc(draft.tips[3] || '')}"></label>
        <div class="sec-title" style="margin:10px 0 4px">Задействованные мышцы</div>
        <div id="cuPicker"></div>`;
      b.addEventListener('input', () => { dirty = true; });
      b.addEventListener('change', () => { dirty = true; });
      mountMusclePicker($('#cuPicker', b), draft.muscles);
      $('#cuPicker', b).addEventListener('click', () => { dirty = true; });
    },
  }, true);
}

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
      <div class="chips" id="libCats">${['Все','Грудь','Спина','Ноги','Плечи','Руки','Пресс','Кардио'].map((c) => `<button class="chip ${c === state.libCat ? 'chip-on':''}">${c}</button>`).join('')}</div>
    </div>
    <div class="figfix" id="figFix"></div>
    <div id="libList" class="daylist"></div>`;
  $('#addCust').addEventListener('click', () => customEditor(null, () => render()));
  const draw = () => {
    const q = state.libSearch.toLowerCase();
    if (state.libCat === 'Другое') state.libCat = 'Все';
    const list = $('#libList');
    list.innerHTML = '';
    const items = allExercises().filter((e) => (state.libCat === 'Все' || e.cat === state.libCat) && (e.name.toLowerCase().includes(q) || e.tips.join(' ').toLowerCase().includes(q)));
    if (!items.length) list.appendChild(el('div', 'empty', '<p>Ничего не найдено</p>'));
    $('#figFix').classList.add('on');
    $('#figFix').innerHTML = '';
    $('#figFix').appendChild(muscleFigure({})); // изначально серый; подсветка — при наведении на упражнение
    for (const it of items) {
      const row = el('button', 'ex-item');
      row.innerHTML = `<span class="ex-name">${esc(it.name)}</span><span class="ex-extra"></span><span class="pill pill-gray">${esc(it.cat)}</span>`;
      const extra = $('.ex-extra', row);
      if (it.custom) {
        const editB = el('button', 'uni-x ex-mini');
        editB.textContent = '✎';
        editB.title = 'Изменить упражнение';
        editB.addEventListener('click', (ev) => { ev.stopPropagation(); customEditor(it.name, () => render()); });
        const delB = el('button', 'uni-x ex-mini');
        delB.textContent = '🗑';
        delB.title = 'Удалить упражнение';
        delB.addEventListener('click', (ev) => {
          ev.stopPropagation();
          confirmDialog('Удалить упражнение?', `«${it.name}» будет удалено из справочника (в сохранённых тренировках останется).`, () => {
            const cus = loadCustom().filter((x) => x.name !== it.name);
            localStorage.setItem(CUSTOM_KEY, JSON.stringify(cus));
            render();
          });
        });
        extra.appendChild(editB);
        extra.appendChild(delB);
      }
      row.addEventListener('mouseenter', () => { $('#figFix').innerHTML = ''; $('#figFix').appendChild(muscleFigure(it.muscles)); });
      row.addEventListener('mouseleave', () => { $('#figFix').innerHTML = ''; $('#figFix').appendChild(muscleFigure({})); });
      row.addEventListener('click', () => openExDetail(it));
      list.appendChild(row);
    }
  };
  $('#libSearch').addEventListener('input', (e) => { state.libSearch = e.target.value; draw(); });
  $$('#libCats .chip').forEach((c) => c.addEventListener('click', () => { state.libCat = c.textContent; draw(); $$('#libCats .chip').forEach((x) => x.classList.toggle('chip-on', x.textContent === state.libCat)); }));
  draw();
}

function openExDetail(ex, { hideAdd } = {}) {
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
        ${hideAdd ? '' : `<button class="btn primary wide" id="addToday">Добавить в тренировку на ${esc(fmtDate(state.dayISO))}</button>`}
        ${ex.custom ? '<div class="row2" style="margin-top:8px"><button class="btn subtle wide" id="exEdit">✎ Изменить</button><button class="btn danger wide" id="exDelBtn">🗑 Удалить</button></div>' : ''}`;
      $('#exMap', b).appendChild(muscleFigure(ex.muscles));
      const ml = $('#exMuscles', b);
      ml.innerHTML = '';
      const entries = Object.entries(ex.muscles).sort((a, bb2) => bb2[1] - a[1]);
      for (const [id, v] of entries) {
        const row = el('div', 'mrow');
        row.innerHTML = `<span class="mname">${esc(MUSCLES[id]?.name || id)}</span><span class="mbadge ${v >= 0.8 ? 'hi' : ''}">${v >= 0.8 ? 'целевая' : 'вспомогательная'}</span>`;
        ml.appendChild(row);
      }
      if (!hideAdd) $('#addToday', b).addEventListener('click', () => {
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
      if (ex.custom) {
        $('#exEdit', b).addEventListener('click', () => { close(); customEditor(ex.name, () => render()); });
        $('#exDelBtn', b).addEventListener('click', () => {
          confirmDialog('Удалить упражнение?', `«${ex.name}» будет удалено из справочника (в сохранённых тренировках останется).`, () => {
            localStorage.setItem(CUSTOM_KEY, JSON.stringify(loadCustom().filter((x) => x.name !== ex.name)));
            close();
            render();
          });
        });
      }
    },
  });
}

/* ---------------- SVG ГРУППЫ МЫШЦ ---------------- */
const FRONT_PATHS = [
  ['deltF', 'M62,78 Q50,86 54,104 Q66,110 76,102 L76,78 Z'],
  ['deltF', 'M138,78 Q150,86 146,104 Q134,110 124,102 L124,78 Z'],
  ['chest', 'M76,76 Q86,70 100,70 Q114,70 124,76 L120,104 Q100,114 80,104 Z'],
  ['abs', 'M86,110 Q100,106 114,110 L112,158 Q100,166 88,158 Z'],
  ['oblique', 'M80,106 Q84,134 82,158 L74,152 Q74,122 76,100 Z'],
  ['oblique', 'M120,106 Q116,134 118,158 L126,152 Q126,122 124,100 Z'],
  ['biceps', 'M52,108 Q44,130 48,150 Q56,156 62,152 L58,112 Z'],
  ['biceps', 'M148,108 Q156,130 152,150 Q144,156 138,152 L142,112 Z'],
  ['forearm', 'M46,152 Q40,176 44,196 Q50,202 56,198 L54,152 Z'],
  ['forearm', 'M154,152 Q160,176 156,196 Q150,202 144,198 L146,152 Z'],
  ['quads', 'M72,168 Q58,220 66,268 Q80,276 92,266 L92,172 Q82,168 72,168 Z'],
  ['quads', 'M128,168 Q142,220 134,268 Q120,276 108,266 L108,172 Q118,168 128,168 Z'],
  ['calves', 'M72,272 Q64,300 70,326 Q80,332 88,324 L88,272 Z'],
  ['calves', 'M128,272 Q136,300 130,326 Q120,332 112,324 L112,272 Z'],
];
const BACK_PATHS = [
  ['traps', 'M70,64 Q100,80 130,64 L124,84 Q100,96 76,84 Z'],
  ['deltR', 'M58,80 Q46,90 52,106 Q64,112 74,102 L72,80 Z'],
  ['deltR', 'M142,80 Q154,90 148,106 Q136,112 126,102 L128,80 Z'],
  ['lats', 'M76,88 Q100,100 124,88 L120,140 Q100,130 80,140 Z'],
  ['lowback', 'M88,140 Q100,146 112,140 L110,168 Q100,174 90,168 Z'],
  ['triceps', 'M50,110 Q42,132 46,152 Q54,158 60,154 L56,112 Z'],
  ['triceps', 'M150,110 Q158,132 154,152 Q146,158 140,154 L144,112 Z'],
  ['forearm', 'M44,154 Q38,178 42,198 Q48,204 54,200 L52,154 Z'],
  ['forearm', 'M156,154 Q162,178 158,198 Q152,204 146,200 L148,154 Z'],
  ['glutes', 'M78,172 Q58,186 62,206 Q74,216 92,208 L92,178 Q84,174 78,172 Z'],
  ['glutes', 'M122,172 Q142,186 138,206 Q126,216 108,208 L108,178 Q116,174 122,172 Z'],
  ['hams', 'M72,212 Q62,248 70,278 Q80,284 90,276 L90,214 Q80,212 72,212 Z'],
  ['hams', 'M128,212 Q138,248 130,278 Q120,284 110,276 L110,214 Q120,212 128,212 Z'],
  ['calves', 'M72,282 Q64,308 70,330 Q80,336 88,328 L88,282 Z'],
  ['calves', 'M128,282 Q136,308 130,330 Q120,336 112,328 L112,282 Z'],
];
const HEAD_SVG = '<circle cx="100" cy="34" r="22" fill="var(--m0)" stroke="var(--mstroke)" stroke-width="2"/>';

function buildMuscleSvg(map = {}, { interactive } = {}) {
  const fillFor = (v) => {
    if (!v) return 'var(--m0)';
    if (interactive) return `color-mix(in srgb, var(--hl) ${v >= 1 ? 100 : 55}%, var(--m0))`;
    const maxV = Math.max(0.0001, ...Object.values(map));
    const t = Math.min(1, Math.max(0, (v / maxV) * 0.85 + 0.15));
    return `color-mix(in srgb, var(--hl) ${Math.round(t * 100)}%, var(--m0))`;
  };
  const paths = (arr) => arr.map(([id, d]) =>
    `<path d="${d}"${interactive ? ` data-m="${id}"` : ''} fill="${fillFor(map[id])}" stroke="var(--mstroke)" stroke-width="2"/>`).join('');
  const fig = (body, label) => `
    <div class="mfig-col">
      <svg viewBox="0 0 200 360" class="mfig-svg${interactive ? '' : ''}" role="img" aria-label="Схема мышц: ${label}">${HEAD_SVG}${paths(body)}</svg>
      <div class="mfig-cap">${label}</div>
    </div>`;
  return el('div', 'mfig', fig(FRONT_PATHS, 'Вид спереди') + fig(BACK_PATHS, 'Вид сзади'));
}

function muscleFigure(map = {}) {
  return buildMuscleSvg(map, { interactive: false });
}

/* Интерактивный выбор мышц: клик по мышце меняет уровень 0 → 0.5 (вспом.) → 1 (целевая) → 0 */
function mountMusclePicker(container, map) {
  const render = () => {
    container.innerHTML = '';
    const fig = buildMuscleSvg(map, { interactive: true });
    fig.classList.add('mfig-pick');
    container.appendChild(fig);
    // подсказка
    container.appendChild(el('p', 'hint mfig-hint', 'Нажимайте на мышцы: серые → без нагрузки, светло-оранжевые → вспомогательные, насыщенные → целевые'));
    // список выбранных мышц
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
    if (entries.length) {
      const ml = el('div', 'mlist');
      for (const [id, v] of entries) {
        const row = el('div', 'mrow');
        row.innerHTML = `<span class="mname">${esc(MUSCLES[id]?.name || id)}</span><span class="mbadge ${v >= 1 ? 'hi' : ''}">${v >= 1 ? 'целевая' : 'вспомогательная'}</span>`;
        ml.appendChild(row);
      }
      container.appendChild(ml);
    }
    fig.addEventListener('click', (e) => {
      const p = e.target.closest('path[data-m]');
      if (!p) return;
      const id = p.dataset.m;
      const cur = Number(map[id] || 0);
      const next = cur === 0 ? 0.5 : cur === 0.5 ? 1 : 0;
      if (next === 0) delete map[id]; else map[id] = next;
      render();
    });
  };
  render();
}

/* ---------------- ПРОГРЕСС ---------------- */
const allDoneCount = () => workouts.filter((w) => w.done).length;
const thisWeekDoneCount = () => weekStats().done;

function viewProgress() {
  const app = $('#app');
  const now = new Date();
  const monthDone = workouts.filter((w) => w.done && parseISO(w.date).getMonth() === now.getMonth() && parseISO(w.date).getFullYear() === now.getFullYear()).length;
  const weekDone = thisWeekDoneCount();
  app.innerHTML = `
    <header class="topbar"><div class="topbar-l">
      <div class="topbar-title">Прогресс</div><div class="topbar-sub">Статистика тренировок</div></div></header>
    <div class="stat-row">
      <div class="stat"><b>${weekDone}</b><span>за неделю</span></div>
      <div class="stat"><b>${monthDone}</b><span>за месяц</span></div>
      <div class="stat"><b>${allDoneCount()}</b><span>всего</span></div>
    </div>
    <div class="sec">
      <div class="sec-title">На этой неделе</div>
      <div id="weekChartBox" class="chart-holder"></div>
    </div>
    <div class="sec">
      <div class="sec-title">Тренированные зоны за месяц</div>
      <div id="heatWrap"></div>
    </div>
    <div class="sec" id="prSec">
      <div class="sec-title">Рекорды веса</div>`;
  // если выбранное упражнение удалено — берём первое доступное
  const prOptions = allExercises().filter((x) => Object.keys(x.muscles).length);
  if (!prOptions.some((x) => x.name === state.prSet)) state.prSet = prOptions[0]?.name || '';
  app.innerHTML += `
      ${prOptions.length ? `<select class="inp" id="prSel">${prOptions.map((x) => `<option ${x.name === state.prSet ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select><div id="prChart" class="chart-holder"></div><div id="prInfo" class="hint"></div>` : '<p class="hint">Добавьте упражнения, чтобы видеть рекорды.</p>'}
    </div>`;
  const hw = $('#heatWrap');
  hw.appendChild(heatFigure());
  weeklyChart($('#weekChartBox'));
  $('#prSel')?.addEventListener('change', (e) => { state.prSet = e.target.value; drawPR(); });
  drawPR();
}

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
  info.textContent = `Рекорд: ${fmtKg(last.best)}. Последняя попытка ${fmtKg(points[points.length - 1].v)} (${fmtDateShort(points[points.length - 1].date)}).`;
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
  svg += `<text x="${pad2}" y="${H - 6}" class="ct">${fmtDateShort(points[0].date)}</text><text x="${W - pad2}" y="${H - 6}" text-anchor="end" class="ct">${fmtDateShort(last.date)}</text>`;
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
        <label class="lb">Возраст<input class="inp num" id="pfAge" type="number" min="18" max="120" value="${esc(pr.age || '')}"></label>
        <label class="lb">Пол<select class="inp" id="pfSex">
          <option value="" ${!pr.sex ? 'selected' : ''}>Не указан</option>
          <option value="m" ${pr.sex === 'm' ? 'selected' : ''}>Мужской</option>
          <option value="f" ${pr.sex === 'f' ? 'selected' : ''}>Женский</option>
        </select></label>
      </div>
      <label class="lb">Цель тренировок (в неделю)<input class="inp num" id="pfGoal" type="number" min="1" max="7" value="${esc(pr.goal ?? '')}"></label>
      <div class="bmi-box" id="bmiBox" hidden></div>
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
    </div>`;
  $('#pfSave').addEventListener('click', () => {
    state.profile = {
      name: $('#pfName').value.trim(),
      h: Number($('#pfH').value) || '',
      w: Number($('#pfW').value) || '',
      age: Number($('#pfAge').value) || '',
      sex: $('#pfSex').value || '',
      goal: Number($('#pfGoal').value) ? Math.min(7, Math.max(1, Number($('#pfGoal').value))) : '',
    };
    saveProfile();
    // отклик на сохранение (кнопка меняется и через мгновение возвращается)
    const btn = $('#pfSave');
    btn.textContent = 'Сохранено ✓';
    btn.disabled = true;
    setTimeout(() => { btn.textContent = 'Сохранить'; btn.disabled = false; }, 1500);
  });

  const bmiHost = $('#bmiBox');
  /* Категории ИМТ — по классификации ВОЗ для взрослых (от 20 лет):
     дефицит < 18.5, норма 18.5–25, избыточная масса 25–30,
     ожирение 30 / 35 / 40 (ru.wikipedia.org · WHO Technical Report Series 894).
     ВОЗ не вводит поправок по полу и возрасту. Единственная верифицированная
     возрастная поправка — с 65 лет: гериатрические рекомендации (ESPEN;
     Winter et al., Am J Clin Nutr 2014) считают нормой 22–27, так как
     «лишний» вес в пожилом возрасте смертность не повышает.
     Пол в ИМТ учесть корректнее через процент жира: формула Дёренберга
     (Deurenberg et al., 1991): BF% = 1.2·ИМТ + 0.23·возраст − 10.8·пол − 5.4,
     ориентиры нормы жира — банды ACE (8–19 / 11–21 / 13–24% м; 21–32 / 23–33 / 24–35% ж). */
  const CATS = [
    'Выраженный дефицит',
    'Недостаточный вес',
    'Норма',
    'Избыточный вес',
    'Ожирение I ст.',
    'Ожирение II ст.',
    'Ожирение III ст.',
  ];
  const CAT_CLASS = ['bmi-bad', 'bmi-low', 'bmi-ok', 'bmi-warn', 'bmi-bad', 'bmi-bad', 'bmi-deep'];
  const ZONE_COLOR = ['#9f1239', '#f59e0b', '#16a34a', '#fbbf24', '#dc2626', '#b91c1c', '#7f1d1d'];
  const renderBmi = (bmi, zoneIdx, notes, pos, th) => {
    const widths = th.slice(1).map((t, i) => Math.max(0.1, t - th[i]));
    const totalW = widths.reduce((a, b2) => a + b2, 0);
    bmiHost.hidden = false;
    bmiHost.className = 'bmi-box ' + CAT_CLASS[zoneIdx];
    bmiHost.innerHTML = `
      <div class="bmi-row"><span class="bmi-cat">${esc(CATS[zoneIdx])}</span><span class="bmi-num">${bmi.toFixed(1)}</span></div>
      ${notes.map((n) => `<div class="bmi-note">${esc(n)}</div>`).join('')}
      <div class="bmi-gauge">${widths.map((wd, i) => `<div style="width:${((wd / totalW) * 100).toFixed(2)}%;background:${ZONE_COLOR[i]}"></div>`).join('')}<i class="bmi-marker" style="left:${pos.toFixed(2)}%"></i></div>`;
  };
  const updateBmi = () => {
    const h = Number($('#pfH').value), w = Number($('#pfW').value);
    const age = Number($('#pfAge').value) || 0;
    const sex = $('#pfSex')?.value || '';
    if (!(h >= 100 && h <= 250) || !(w >= 25 && w <= 400)) { bmiHost.hidden = true; return; }
    const bmi = w / Math.pow(h / 100, 2);
    // границы зон на общей шкале 15–45; с 65 лет норма сдвигается к 22–27
    const th = [15, 16, age >= 65 ? 22 : 18.5, age >= 65 ? 27 : 25, 30, 35, 40, 45];
    let zone = th.findIndex((t, i) => i > 0 && bmi < t) - 1; // 0..6 — сегмент шкалы
    const pos = Math.min(100, Math.max(2, ((bmi - 15) / 30) * 100));
    if (zone < 0) zone = 6; // ≥45 → «Ожирение III ст.»
    // пояснение: норма ИМТ (ВОЗ / гериатрическая) + оценка % жира (Дёренберг, банды ACE);
    // жир считаем только если пол указан — формула и ориентиры завязаны на пол
    const notes = [age >= 65 ? 'Гериатрическая норма (65+): 22–27' : 'Норма ВОЗ для взрослых: 18.5–25'];
    if (sex) {
      const bf = 1.2 * bmi + 0.23 * age - (sex === 'm' ? 16.2 : 5.4);
      const bfBr = age >= 60 ? 2 : age >= 40 ? 1 : 0;
      const bfNorm = [{ m: '8–19%', f: '21–32%' }, { m: '11–21%', f: '23–33%' }, { m: '13–24%', f: '24–35%' }][bfBr][sex];
      notes.push(`Жир ≈ ${Math.round(bf)}% · ориентир для ${sex === 'f' ? 'женщин' : 'мужчин'}: ${bfNorm} (формула Дёренберга)`);
    }
    renderBmi(bmi, zone, notes, pos, th);
  };
  ['#pfH', '#pfW', '#pfAge'].forEach((sel) => $(sel).addEventListener('input', updateBmi));
  $('#pfSex').addEventListener('change', updateBmi);
  updateBmi();
  const ps = $('#permState');
  const updPerm = () => {
    if (!('Notification' in window)) { ps.textContent = 'Уведомления не поддерживаются этим браузером.'; $('#notifyBtn').disabled = true; return; }
    ps.textContent = Notification.permission === 'granted'
      ? '✅ Напоминание о тренировке приходит в день занятия — пока приложение открыто.'
      : Notification.permission === 'denied'
        ? '⛔ Разрешение заблокировано в настройках браузера.'
        : 'Разрешение не выдано.';
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
      dailyRemind(); // если тренировка на сегодня ещё не сделана — напомним сразу
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
function confirmDialog(title, text, onYes, yesLabel) {
  const host = $('#confirmHost');
  $('#confirmTitle').textContent = title;
  $('#confirmText').textContent = text;
  $('#confirmYes').textContent = yesLabel || 'Удалить';
  host.hidden = false;
  confirmOk = onYes;
  const close = () => { host.hidden = true; confirmOk = null; };
  $('#confirmYes').onclick = () => { const f = confirmOk; close(); f && f(); };
  $('#confirmNo').onclick = close;
  $('#confirmNo').textContent = 'Отмена';
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
/* Честные напоминания: web-уведомления из открытого таба (веб-страница не может
   будить закрытый браузер — это доступно только установленному PWA/мобильному).
   Раз в минуту проверяем: есть ли на сегодня запланированная, но не выполненная
   тренировка, и не показывали ли уже напоминание сегодня (флаг в localStorage). */
function dailyRemind() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const today = todayISO();
  try {
    if (localStorage.getItem('wt_notify_date') === today) return; // сегодня уже напоминали
    const planned = forDay(today).filter((w) => !w.done);
    if (!planned.length) return;
    const names = [...new Set(planned.map((w) => w.title || 'Тренировка'))].join(', ');
    const n = new Notification('Календарь тренировок', { body: `Сегодня тренировка: ${names}. Не забудьте! 💪` });
    n.onclick = () => { state.dayISO = today; state.view = 'day'; render(); try { window.focus(); } catch { /* noop */ } n.close(); };
    localStorage.setItem('wt_notify_date', today);
  } catch { /* localStorage может быть недоступен */ }
}
setInterval(dailyRemind, 60000);
dailyRemind();
if ('serviceWorker' in navigator) {
  const hadController = !!navigator.serviceWorker.controller;
  // при смене контролирующего воркера (обновление) — перезагружаем страницу, чтобы взять свежие файлы
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) return;
    if (sessionStorage.getItem('sw_reloaded') === '1') return;
    sessionStorage.setItem('sw_reloaded', '1');
    location.reload();
  });
  navigator.serviceWorker.register('./sw.js').then(async () => {
    // сразу проверяем обновления воркера, не дожидаясь следующего визита
    const reg = await navigator.serviceWorker.getRegistration();
    reg?.update?.();
  }).catch(() => { /* dev server w/o sw */ });
}
render();
window.addEventListener('resize', () => { if (state.view === 'progress') render(); });
