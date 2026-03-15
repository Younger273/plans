// ── STATE ──────────────────────────────────────────────────────────────────
const DEFAULT = {
  name: '', title: '', photo: '', about: '',
  contacts: [],
  edu: [],
  certs: [],
  projects: [],
  categories: [],
  customSections: []
};

let state = JSON.parse(localStorage.getItem('resume') || 'null') || structuredClone(DEFAULT);
// migrate old saves
if (!state.edu)            state.edu            = [];
if (!state.certs)          state.certs          = [];
if (!state.about)          state.about          = '';
if (!state.customSections) state.customSections = [];

function save() { localStorage.setItem('resume', JSON.stringify(state)); }

// ── SECTIONS COLLAPSE ──────────────────────────────────────────────────────
const SECTION_IDS = ['aboutSection','eduSection','certsSection','projectsSection'];

function initSections() {
  const saved = JSON.parse(localStorage.getItem('sections') || '{}');
  SECTION_IDS.forEach(id => {
    const sec = document.getElementById(id);
    if (!sec) return;
    // default: collapsed if no saved state
    const isOpen = saved[id] !== undefined ? saved[id] : false;
    setSectionOpen(sec, isOpen, false);
  });
}

function toggleSection(id) {
  const sec = document.getElementById(id);
  if (!sec) return;
  const isOpen = !sec.classList.contains('section-collapsed');
  setSectionOpen(sec, !isOpen, true);
}

function setSectionOpen(sec, open, persist) {
  sec.classList.toggle('section-collapsed', !open);
  const arrow = sec.querySelector('.section-toggle');
  if (arrow) arrow.textContent = open ? '▼' : '▶';
  if (persist) {
    const saved = JSON.parse(localStorage.getItem('sections') || '{}');
    saved[sec.id] = open;
    localStorage.setItem('sections', JSON.stringify(saved));
  }
}

// ── THEME ──────────────────────────────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem('theme') || 'dark';
  applyTheme(saved);
}

function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t === 'light' ? 'light' : '');
  const btn = document.getElementById('themeBtn');
  if (btn) btn.textContent = t === 'light' ? '🌙 Тёмная' : '☀️ Светлая';
  const sbBtn = document.getElementById('themeSbBtn');
  if (sbBtn) sbBtn.firstChild.textContent = t === 'light' ? '🌙' : '☀️';
  localStorage.setItem('theme', t);
}

function toggleTheme() {
  const current = localStorage.getItem('theme') || 'dark';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

// ── INIT ───────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSections();
  renderProfile();
  renderContacts();
  renderAbout();
  renderEdu();
  renderCerts();
  renderProjects();
  renderCustomSections();
  renderCategories();
  updateTotalProgress();
  bindProfileEdits();
});

// ── PROFILE ────────────────────────────────────────────────────────────────
function renderProfile() {
  const nameEl = document.getElementById('name');
  const titleEl = document.getElementById('title');
  nameEl.textContent = state.name;
  titleEl.textContent = state.title;
  setPhoto(state.photo);
}

function bindProfileEdits() {
  const nameEl = document.getElementById('name');
  const titleEl = document.getElementById('title');
  nameEl.addEventListener('input', () => { state.name = nameEl.textContent.trim(); save(); });
  titleEl.addEventListener('input', () => { state.title = titleEl.textContent.trim(); save(); });

  document.getElementById('photoFile').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('⚠ Выбранный файл не является изображением');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => { state.photo = ev.target.result; save(); setPhoto(state.photo); };
    reader.readAsDataURL(file);
  });
}

// ── ABOUT ──────────────────────────────────────────────────────────────────
function renderAbout() {
  const el = document.getElementById('about');
  if (!el) return;
  el.textContent = state.about || '';
  el.addEventListener('input', () => { state.about = el.textContent.trim(); save(); });
}

// ── EDUCATION ──────────────────────────────────────────────────────────────
function renderEdu() {
  const list = document.getElementById('eduList');
  list.innerHTML = '';
  (state.edu || []).forEach((e, i) => {
    const div = document.createElement('div');
    div.className = 'edu-card';
    div.innerHTML = `
      <div class="edu-row">
        <input class="edu-name" value="${esc(e.name)}" placeholder="Название курса / учебного заведения">
        <input class="edu-org"  value="${esc(e.org)}"  placeholder="Организация (TryHackMe, ВУЗ...)">
        <input class="edu-year" value="${esc(e.year)}" placeholder="Год" style="width:70px">
        <button class="btn-icon no-print" onclick="removeEdu(${i})">🗑</button>
      </div>`;
    div.querySelector('.edu-name').addEventListener('input', ev => { state.edu[i].name = ev.target.value; save(); });
    div.querySelector('.edu-org').addEventListener('input',  ev => { state.edu[i].org  = ev.target.value; save(); });
    div.querySelector('.edu-year').addEventListener('input', ev => { state.edu[i].year = ev.target.value; save(); });
    list.appendChild(div);
  });
}

function addEdu() {
  state.edu.push({ name: '', org: '', year: new Date().getFullYear().toString() });
  save(); renderEdu();
}
function removeEdu(i) { state.edu.splice(i, 1); save(); renderEdu(); }

// ── CERTS ──────────────────────────────────────────────────────────────────
function renderCerts() {
  const list = document.getElementById('certsList');
  list.innerHTML = '';
  (state.certs || []).forEach((c, i) => {
    const div = document.createElement('div');
    div.className = 'edu-card';
    div.innerHTML = `
      <div class="edu-row">
        <input class="edu-name" value="${esc(c.name)}" placeholder="Название сертификата">
        <input class="edu-url" type="text" value="${esc(c.url)}" placeholder="https://...">
        <input class="edu-year" value="${esc(c.year)}" placeholder="Год" style="width:70px">
        <button class="btn-icon no-print" onclick="removeCert(${i})">🗑</button>
      </div>
      <div class="input-hint cert-url-hint" style="display:none">⚠ Ссылка должна начинаться с https://</div>`;

    const urlInput = div.querySelector('.edu-url');
    const hint = div.querySelector('.cert-url-hint');

    // validate on blur only — no re-render while typing
    function validateUrl() {
      const val = urlInput.value.trim();
      const bad = val && !val.startsWith('http://') && !val.startsWith('https://');
      urlInput.classList.toggle('input-error', bad);
      hint.style.display = bad ? 'block' : 'none';
    }

    urlInput.addEventListener('input', ev => { state.certs[i].url = ev.target.value; save(); });
    urlInput.addEventListener('blur', validateUrl);
    // run once on render if already invalid
    validateUrl();

    div.querySelector('.edu-name').addEventListener('input', ev => { state.certs[i].name = ev.target.value; save(); });
    div.querySelector('.edu-year').addEventListener('input', ev => { state.certs[i].year = ev.target.value; save(); });
    list.appendChild(div);
  });
}

function addCert() {
  state.certs.push({ name: '', url: '', year: new Date().getFullYear().toString() });
  save(); renderCerts();
}
function removeCert(i) { state.certs.splice(i, 1); save(); renderCerts(); }

function setPhoto(src) {
  const img     = document.getElementById('photo');
  const ph      = document.getElementById('photoPlaceholder');
  const overlay = document.getElementById('avatarOverlay');
  if (src) {
    img.src = src; img.style.display = 'block';
    ph.style.display = 'none';
    if (overlay) { overlay.textContent = '✕'; overlay.classList.add('has-photo'); }
  } else {
    img.style.display = 'none';
    ph.style.display = 'flex';
    if (overlay) { overlay.textContent = '📷'; overlay.classList.remove('has-photo'); }
  }
}

function handleAvatarClick() {
  if (state.photo) {
    resetPhoto();
  } else {
    document.getElementById('photoFile').click();
  }
}

function resetPhoto() {
  state.photo = ''; save();
  document.getElementById('photoFile').value = '';
  setPhoto('');
}

// ── CONTACTS ───────────────────────────────────────────────────────────────
function renderContacts() {
  const row = document.getElementById('contactsRow');
  row.innerHTML = '';
  state.contacts.forEach((c, i) => {
    const chip = document.createElement('div');
    chip.className = 'contact-chip';
    chip.innerHTML = `<span contenteditable="true" spellcheck="false">${c}</span>
      <span class="del no-print" onclick="removeContact(${i})">✕</span>`;
    chip.querySelector('span[contenteditable]').addEventListener('input', ev => {
      state.contacts[i] = ev.target.textContent.trim(); save();
    });
    row.appendChild(chip);
  });
}

function addContact() {
  state.contacts.push('');
  save(); renderContacts();
  // focus the new chip
  setTimeout(() => {
    const chips = document.querySelectorAll('.contact-chip span[contenteditable]');
    if (chips.length) chips[chips.length - 1].focus();
  }, 50);
}

function removeContact(i) {
  state.contacts.splice(i, 1); save(); renderContacts();
}

// ── PROJECTS ───────────────────────────────────────────────────────────────
function renderProjects() {
  const list = document.getElementById('projectsList');
  list.innerHTML = '';
  state.projects.forEach((p, i) => {
    const div = document.createElement('div');
    div.className = 'project-card';
    div.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <input class="proj-title" value="${esc(p.title)}" placeholder="Название проекта">
        <button class="btn-icon no-print" onclick="removeProject(${i})">🗑</button>
      </div>
      <textarea class="proj-desc" placeholder="Краткое описание, стек, результат...">${esc(p.desc)}</textarea>
      <div class="proj-date">${p.date || ''}</div>`;
    div.querySelector('.proj-title').addEventListener('input', ev => { state.projects[i].title = ev.target.value; save(); });
    const descEl = div.querySelector('.proj-desc');
    descEl.addEventListener('input', ev => {
      state.projects[i].desc = ev.target.value; save();
      ev.target.style.height = 'auto';
      ev.target.style.height = ev.target.scrollHeight + 'px';
    });
    setTimeout(() => {
      if (descEl.value) { descEl.style.height = 'auto'; descEl.style.height = descEl.scrollHeight + 'px'; }
    }, 0);
    list.appendChild(div);
  });
}

function addProject() {
  state.projects.push({ title: '', desc: '', date: new Date().toLocaleDateString('ru') });
  save(); renderProjects();
}

function removeProject(i) {
  if (!confirm('Удалить проект?')) return;
  state.projects.splice(i, 1); save(); renderProjects();
}

// ── CUSTOM SECTIONS ────────────────────────────────────────────────────────
function renderCustomSections() {
  const container = document.getElementById('customSectionsContainer');
  if (!container) return;
  container.innerHTML = '';
  (state.customSections || []).forEach((sec, i) => {
    const el = document.createElement('section');
    el.className = 'card collapsible-section' + (sec._collapsed ? ' section-collapsed' : '');
    el.innerHTML = `
      <div class="section-header custom-section-header">
        <input class="custom-sec-title" value="${esc(sec.title)}" placeholder="Название блока">
        <div class="section-header-right">
          <span class="section-toggle no-print">${sec._collapsed ? '▶' : '▼'}</span>
          <button class="btn-icon no-print" onclick="removeCustomSection(${i})" title="Удалить блок">🗑</button>
        </div>
      </div>
      <div class="section-body">
        <div class="editable custom-sec-body" data-placeholder="Напиши что угодно..." contenteditable="true">${sec.body || ''}</div>
      </div>`;

    // toggle collapse by clicking header (but not input/buttons)
    el.querySelector('.section-header').addEventListener('click', e => {
      if (e.target.closest('input,button')) return;
      sec._collapsed = !sec._collapsed;
      el.classList.toggle('section-collapsed', sec._collapsed);
      el.querySelector('.section-toggle').textContent = sec._collapsed ? '▶' : '▼';
      save();
    });

    el.querySelector('.custom-sec-title').addEventListener('input', ev => {
      state.customSections[i].title = ev.target.value; save();
    });
    el.querySelector('.custom-sec-body').addEventListener('input', ev => {
      state.customSections[i].body = ev.target.textContent; save();
    });

    container.appendChild(el);
  });
}

function addCustomSection() {
  state.customSections.push({ title: 'Новый блок', body: '', _collapsed: false });
  save(); renderCustomSections();
  // focus the new title
  setTimeout(() => {
    const inputs = document.querySelectorAll('.custom-sec-title');
    if (inputs.length) inputs[inputs.length - 1].select();
  }, 50);
}

function removeCustomSection(i) {
  const title = state.customSections[i].title || 'этот блок';
  if (!confirm(`Удалить "${title}"?`)) return;
  state.customSections.splice(i, 1);
  save(); renderCustomSections();
}

// ── CATEGORIES ─────────────────────────────────────────────────────────────
const CAT_COLORS = [
  { label: 'Нет',        value: '',        dot: '⬜' },
  { label: 'Срочно',     value: 'red',     dot: '🔴' },
  { label: 'Важно',      value: 'orange',  dot: '🟠' },
  { label: 'В процессе', value: 'blue',    dot: '🔵' },
  { label: 'Готово',     value: 'green',   dot: '🟢' },
];

function renderCategories(filter) {
  const list = document.getElementById('categoriesList');
  list.innerHTML = '';
  state.categories.forEach((cat, ci) => {
    const done   = cat.skills.filter(s => s.status === 'done').length;
    const frozen = cat.skills.filter(s => s.status === 'frozen').length;
    const total  = cat.skills.length;
    const pct    = total ? Math.round(done / total * 100) : 0;
    const collapsed = cat._collapsed || false;
    const color = cat.color || '';
    const colorDot = (CAT_COLORS.find(c => c.value === color) || CAT_COLORS[0]).dot;

    const div = document.createElement('div');
    div.className = `category${color ? ' cat-color-' + color : ''}${collapsed ? ' cat-collapsed-grid' : ''}`;
    div.draggable = true;
    div.dataset.ci = ci;

    div.innerHTML = `
      <div class="category-header">
        <span class="cat-drag no-print" title="Перетащить">⠿</span>
        <span class="cat-color-btn no-print" onclick="cycleCatColor(${ci})" title="Цветовая метка">${colorDot}</span>
        <input class="category-name" value="${esc(cat.name)}" placeholder="Название раздела">
        <span class="cat-progress-text">${done}/${total}${frozen ? ` · ${frozen}❄` : ''} (${pct}%)</span>
        <button class="btn-icon no-print cat-collapse" onclick="toggleCollapse(${ci})" title="${collapsed ? 'Развернуть' : 'Свернуть'}">${collapsed ? '▶' : '▼'}</button>
        <button class="btn-icon no-print" onclick="removeCategory(${ci})">🗑</button>
      </div>
      <div class="cat-bar-wrap"><div class="cat-bar" style="width:${pct}%"></div></div>
      <div class="skills-list cat-body${collapsed ? ' cat-hidden' : ''}" id="skills-${ci}"></div>
      <div class="add-skill-row no-print cat-body${collapsed ? ' cat-hidden' : ''}" id="add-row-${ci}">
        <button class="btn-small" onclick="openSkillInput(${ci})">+ Навык</button>
      </div>`;

    div.querySelector('.category-name').addEventListener('input', ev => {
      state.categories[ci].name = ev.target.value; save();
    });

    // drag & drop
    div.addEventListener('dragstart', onDragStart);
    div.addEventListener('dragover',  onDragOver);
    div.addEventListener('drop',      onDrop);
    div.addEventListener('dragend',   onDragEnd);

    list.appendChild(div);
    if (!collapsed) renderSkills(ci, filter);
  });
}

// ── COLLAPSE ───────────────────────────────────────────────────────────────
function toggleCollapse(ci) {
  state.categories[ci]._collapsed = !state.categories[ci]._collapsed;
  save(); renderCategories();
}

// ── CAT COLOR ──────────────────────────────────────────────────────────────
function cycleCatColor(ci) {
  const cur = state.categories[ci].color || '';
  const idx = CAT_COLORS.findIndex(c => c.value === cur);
  state.categories[ci].color = CAT_COLORS[(idx + 1) % CAT_COLORS.length].value;
  save(); renderCategories();
}

// ── DRAG & DROP ────────────────────────────────────────────────────────────
let dragSrcIdx = null;

function onDragStart(e) {
  dragSrcIdx = +this.dataset.ci;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}
function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  document.querySelectorAll('.category').forEach(el => el.classList.remove('drag-over'));
  this.classList.add('drag-over');
}
function onDrop(e) {
  e.preventDefault();
  const targetIdx = +this.dataset.ci;
  if (dragSrcIdx === null || dragSrcIdx === targetIdx) return;
  const moved = state.categories.splice(dragSrcIdx, 1)[0];
  state.categories.splice(targetIdx, 0, moved);
  save(); renderCategories(); updateTotalProgress();
}
function onDragEnd() {
  document.querySelectorAll('.category').forEach(el => {
    el.classList.remove('dragging', 'drag-over');
  });
  dragSrcIdx = null;
}

function addCategory() {
  state.categories.push({ name: 'Новый раздел', skills: [] });
  save(); renderCategories(); updateTotalProgress();
}

function removeCategory(ci) {
  if (!confirm('Удалить раздел?')) return;
  state.categories.splice(ci, 1); save(); renderCategories(); updateTotalProgress();
}

// ── SKILLS ─────────────────────────────────────────────────────────────────
const LEVELS = ['новичок', 'средний', 'уверенный'];
const STATUS_CYCLE = { planned: 'done', done: 'frozen', frozen: 'planned' };
const STATUS_ICON  = { planned: '○', done: '✓', frozen: '❄' };

function renderSkills(ci, filter) {
  const container = document.getElementById(`skills-${ci}`);
  if (!container) return;
  container.innerHTML = '';
  state.categories[ci].skills.forEach((sk, si) => {
    // search filter
    if (filter && !sk.name.toLowerCase().includes(filter)) return;

    const st = sk.status || 'planned';
    const hours = sk.hours || 0;
    const hasNote = sk.note && sk.note.trim();

    const wrap = document.createElement('div');
    wrap.className = 'skill-wrap';

    const item = document.createElement('div');
    item.className = `skill-item ${st}`;
    item.innerHTML = `
      <div class="skill-check" onclick="toggleSkill(${ci},${si})" title="Сменить статус">${STATUS_ICON[st]}</div>
      <input class="skill-name" value="${esc(sk.name)}" placeholder="Навык">
      <span class="skill-level no-print" onclick="cycleLevel(${ci},${si})">${sk.level || LEVELS[0]}</span>
      <div class="skill-hours no-print" title="Часов практики">
        <span class="hours-icon">⏱</span>
        <input class="hours-input" type="number" min="0" value="${hours}" placeholder="0">
        <span class="hours-label">ч</span>
      </div>
      <button class="btn-icon note-btn no-print ${hasNote ? 'has-note' : ''}" onclick="toggleNote(${ci},${si})" title="${hasNote ? esc(sk.note) : 'Добавить заметку'}">💬</button>
      <span class="skill-date">${sk.date || ''}</span>
      <button class="btn-icon no-print" onclick="removeSkill(${ci},${si})">✕</button>`;

    item.querySelector('.skill-name').addEventListener('input', ev => {
      state.categories[ci].skills[si].name = ev.target.value; save();
    });
    item.querySelector('.hours-input').addEventListener('change', ev => {
      const val = Math.max(0, parseInt(ev.target.value) || 0);
      ev.target.value = val;
      state.categories[ci].skills[si].hours = val; save();
    });

    wrap.appendChild(item);

    const noteRow = document.createElement('div');
    noteRow.className = 'note-row';
    noteRow.id = `note-${ci}-${si}`;
    noteRow.style.display = sk._noteOpen ? 'flex' : 'none';
    noteRow.innerHTML = `
      <div class="note-inner">
        <textarea class="note-input" placeholder="Заметка: что изучил, какой ресурс, что осталось...">${esc(sk.note || '')}</textarea>
        <button class="note-collapse-btn" onclick="collapseNote(${ci},${si})">▲ Свернуть</button>
      </div>`;
    const ta = noteRow.querySelector('.note-input');
    // auto-grow
    function autoGrow() { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; }
    ta.addEventListener('input', ev => {
      state.categories[ci].skills[si].note = ev.target.value; save();
      autoGrow();
      const btn = item.querySelector('.note-btn');
      btn.classList.toggle('has-note', !!ev.target.value.trim());
      btn.title = ev.target.value.trim() || 'Добавить заметку';
    });
    if (sk._noteOpen) setTimeout(autoGrow, 0);

    wrap.appendChild(noteRow);
    container.appendChild(wrap);
  });
}

function toggleNote(ci, si) {
  const sk = state.categories[ci].skills[si];
  sk._noteOpen = !sk._noteOpen;
  const row = document.getElementById(`note-${ci}-${si}`);
  if (row) {
    row.style.display = sk._noteOpen ? 'flex' : 'none';
    if (sk._noteOpen) {
      const ta = row.querySelector('textarea');
      if (ta) { ta.focus(); ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; }
    }
  }
}

function collapseNote(ci, si) {
  state.categories[ci].skills[si]._noteOpen = false;
  const row = document.getElementById(`note-${ci}-${si}`);
  if (row) row.style.display = 'none';
}

function openSkillInput(ci) {
  const row = document.getElementById(`add-row-${ci}`);
  if (!row || row.querySelector('.skill-input-wrap')) return;

  // collect suggestions: all template skills not yet in this category
  const existing = new Set(state.categories[ci].skills.map(s => s.name.toLowerCase()));
  const suggestions = getAllTemplateSuggestions(ci).filter(s => !existing.has(s.toLowerCase()));

  row.innerHTML = `
    <div class="skill-input-wrap">
      <div class="skill-input-box">
        <input id="skill-inp-${ci}" class="skill-inp" placeholder="Введи навык или выбери из списка..." autocomplete="off">
        <button class="btn-small" onclick="confirmSkillInput(${ci})">Добавить</button>
        <button class="btn-icon" onclick="cancelSkillInput(${ci})">✕</button>
      </div>
      <div class="suggestions-list" id="sugg-${ci}"></div>
    </div>`;

  const inp = document.getElementById(`skill-inp-${ci}`);
  const suggBox = document.getElementById(`sugg-${ci}`);

  function renderSugg(filter) {
    const q = filter.toLowerCase();
    const filtered = q
      ? suggestions.filter(s => s.toLowerCase().includes(q))
      : suggestions;
    suggBox.innerHTML = '';
    if (!filtered.length) { suggBox.style.display = 'none'; return; }
    suggBox.style.display = 'block';
    filtered.slice(0, 8).forEach(s => {
      const item = document.createElement('div');
      item.className = 'sugg-item';
      // highlight match
      if (q) {
        const idx = s.toLowerCase().indexOf(q);
        item.innerHTML = esc(s.slice(0, idx)) +
          `<mark>${esc(s.slice(idx, idx + q.length))}</mark>` +
          esc(s.slice(idx + q.length));
      } else {
        item.textContent = s;
      }
      item.addEventListener('mousedown', e => {
        e.preventDefault();
        inp.value = s;
        suggBox.style.display = 'none';
      });
      suggBox.appendChild(item);
    });
  }

  inp.addEventListener('input', () => renderSugg(inp.value));
  inp.addEventListener('focus', () => renderSugg(inp.value));
  inp.addEventListener('blur', () => setTimeout(() => { suggBox.style.display = 'none'; }, 150));
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') confirmSkillInput(ci);
    if (e.key === 'Escape') cancelSkillInput(ci);
  });

  renderSugg('');
  inp.focus();
}

function confirmSkillInput(ci) {
  const inp = document.getElementById(`skill-inp-${ci}`);
  if (!inp) return;
  const name = inp.value.trim();
  if (!name) { cancelSkillInput(ci); return; }

  // duplicate check across ALL categories
  const duplicate = state.categories.some(cat =>
    cat.skills.some(s => s.name.toLowerCase() === name.toLowerCase())
  );
  if (duplicate) {
    inp.style.borderColor = '#f87171';
    inp.title = 'Такой навык уже есть';
    inp.placeholder = '⚠ Уже существует!';
    inp.value = '';
    setTimeout(() => { inp.style.borderColor = ''; inp.placeholder = 'Введи навык или выбери из списка...'; }, 1800);
    return;
  }

  state.categories[ci].skills.push({
    name, status: 'planned', level: LEVELS[0],
    hours: 0, note: '',
    date: new Date().toLocaleDateString('ru')
  });
  save(); renderCategories(); updateTotalProgress();
}

function cancelSkillInput(ci) {
  const row = document.getElementById(`add-row-${ci}`);
  if (row) row.innerHTML = `<button class="btn-small" onclick="openSkillInput(${ci})">+ Навык</button>`;
}

// collect all skill names from templates relevant to this category name
function getAllTemplateSuggestions(ci) {
  const catName = (state.categories[ci].name || '').toLowerCase();
  const all = [];
  Object.values(TEMPLATES).forEach(tpl => {
    tpl.forEach(section => {
      // prefer matching section, but include all
      section.skills.forEach(s => { if (!all.includes(s)) all.push(s); });
    });
  });
  return all;
}

function addSkill(ci) { openSkillInput(ci); }

function toggleSkill(ci, si) {
  const sk = state.categories[ci].skills[si];
  sk.status = STATUS_CYCLE[sk.status || 'planned'];
  save(); renderCategories(); updateTotalProgress();
}

function cycleLevel(ci, si) {
  const sk = state.categories[ci].skills[si];
  const idx = LEVELS.indexOf(sk.level || LEVELS[0]);
  sk.level = LEVELS[(idx + 1) % LEVELS.length];
  save(); renderCategories();
}

function removeSkill(ci, si) {
  const name = state.categories[ci].skills[si].name || 'этот навык';
  if (!confirm(`Удалить "${name}"?`)) return;
  state.categories[ci].skills.splice(si, 1);
  save(); renderCategories(); updateTotalProgress();
}

// ── SEARCH ─────────────────────────────────────────────────────────────────
function onSearch(val) {
  const filter = val.trim().toLowerCase();
  document.getElementById('searchClear').style.display = filter ? 'block' : 'none';
  renderCategories(filter || null);
}

function clearSearch() {
  document.getElementById('skillSearch').value = '';
  document.getElementById('searchClear').style.display = 'none';
  renderCategories();
}

// ── PROGRESS ───────────────────────────────────────────────────────────────
function updateTotalProgress() {
  let done = 0, total = 0;
  state.categories.forEach(cat => {
    total += cat.skills.length;
    done += cat.skills.filter(s => s.status === 'done').length;
  });
  const pct = total ? Math.round(done / total * 100) : 0;
  document.getElementById('totalBar').style.width = pct + '%';
  document.getElementById('totalLabel').textContent = `${done} / ${total} (${pct}%)`;
}

// ── TEMPLATES ──────────────────────────────────────────────────────────────
const TEMPLATES = {
  'Пентестер': [
    { name: 'Сети и протоколы', skills: [
      'Модель OSI — все 7 уровней',
      'TCP/IP, UDP, ICMP',
      'DNS, HTTP/S, SSH, FTP',
      'Wireshark / tcpdump — анализ трафика',
      'Nmap — сканирование сетей',
      'VPN, прокси, Tor',
      'ARP, DHCP, VLAN'
    ]},
    { name: 'Операционные системы', skills: [
      'Linux — команды, файловая система, права',
      'Kali Linux / Parrot OS',
      'Bash-скриптинг',
      'Windows — Active Directory, GPO',
      'PowerShell — основы',
      'VMware / VirtualBox'
    ]},
    { name: 'Инструменты пентеста', skills: [
      'Metasploit Framework',
      'Burp Suite',
      'Nessus / OpenVAS',
      'Hydra / John the Ripper',
      'SQLmap',
      'Aircrack-ng',
      'Gobuster / ffuf',
      'Impacket',
      'BloodHound',
      'Mimikatz'
    ]},
    { name: 'Веб-уязвимости (OWASP Top 10)', skills: [
      'SQL Injection',
      'XSS (Reflected, Stored, DOM)',
      'CSRF',
      'IDOR',
      'RCE — Remote Code Execution',
      'LFI / RFI',
      'SSRF',
      'XXE',
      'Broken Authentication',
      'JWT-атаки'
    ]},
    { name: 'Криптография', skills: [
      'Кодирование vs шифрование vs хэширование',
      'Base64 / Base32 / Base58 / Hex — распознать и декодировать',
      'CyberChef — универсальный инструмент декодирования',
      'Хэш-функции — MD5, SHA-1, SHA-256 (необратимы)',
      'Hashcat / John the Ripper — брутфорс хэшей',
      'Симметричное шифрование — AES (принцип)',
      'Асимметричное шифрование — RSA (принцип)',
      'SSL/TLS — handshake, сертификаты, MITM',
      'ROT13 / Caesar — классические шифры (CTF)'
    ]},
    { name: 'Методологии', skills: [
      'PTES',
      'OWASP Testing Guide',
      'MITRE ATT&CK',
      'CVE, CVSS — оценка уязвимостей',
      'Написание отчёта по пентесту',
      'Bug Bounty — HackerOne, Bugcrowd'
    ]}
  ],

  'ИБ-специалист': [
    { name: 'Основы информационной безопасности', skills: [
      'CIA-триада (конфиденциальность, целостность, доступность)',
      'Модели угроз и нарушителей',
      'Управление рисками ИБ',
      'ISO/IEC 27001',
      'NIST Cybersecurity Framework',
      'Классификация информации',
      'Политика информационной безопасности',
      'Принцип минимальных привилегий',
      'Zero Trust — концепция',
      'Социальная инженерия — виды атак'
    ]},
    { name: 'Сети и защита периметра', skills: [
      'TCP/IP, OSI — уверенное знание',
      'Межсетевые экраны (Firewall) — настройка правил',
      'IDS / IPS — обнаружение вторжений',
      'VPN — настройка и эксплуатация',
      'DMZ — демилитаризованная зона',
      'Сегментация сети, VLAN',
      'Wireshark — анализ трафика',
      'WAF — Web Application Firewall',
      'NAT, PAT — трансляция адресов',
      'Honeypot / Honeynet — ловушки'
    ]},
    { name: 'Средства защиты информации (СЗИ)', skills: [
      'ViPNet — настройка и администрирование',
      'Dallas Lock — управление доступом',
      'КриптоПро CSP — работа с ЭЦП',
      'Secret Net Studio',
      'Аура — СЗИ от НСД',
      'Антивирусные решения (Kaspersky, Dr.Web)',
      'DLP-системы (контроль утечек)',
      'PAM-системы (управление привилегиями)',
      'СКЗИ — классификация и применение',
      'Средства контроля USB-носителей'
    ]},
    { name: 'Операционные системы и виртуализация', skills: [
      'Linux — администрирование, права доступа',
      'Windows Server — AD, GPO, политики безопасности',
      'Hardening ОС (усиление конфигурации)',
      'VMware vSphere / VirtualBox',
      'Контейнеры — Docker (основы безопасности)',
      'Astra Linux — работа с сертифицированной ОС',
      'РЕД ОС / ALT Linux',
      'SELinux / AppArmor — мандатный контроль',
      'Резервное копирование и восстановление',
      'Управление патчами (Patch Management)'
    ]},
    { name: 'Мониторинг и реагирование на инциденты', skills: [
      'SIEM — принципы работы (Splunk, ELK, MaxPatrol SIEM)',
      'Анализ логов (Windows Event Log, syslog)',
      'DFIR — цифровая криминалистика',
      'Forensics-инструменты (Autopsy, Volatility)',
      'Playbook / Runbook для инцидентов',
      'Threat Intelligence — основы',
      'IOC — индикаторы компрометации',
      'MITRE ATT&CK — классификация атак',
      'Тriage — первичная сортировка инцидентов',
      'Threat Hunting — проактивный поиск угроз'
    ]},
    { name: 'Нормативная база РФ', skills: [
      'ФЗ-152 "О персональных данных"',
      'Требования ФСТЭК России',
      'Требования ФСБ России',
      'Приказ ФСТЭК №17 (ГИС)',
      'Приказ ФСТЭК №21 (ИСПДн)',
      'Приказ ФСТЭК №239 (КИИ)',
      'ФЗ-187 "О безопасности КИИ"',
      'СТО БР ИББС (банковская сфера)',
      'ГОСТ Р 57580 (финансовые организации)',
      'Составление организационно-распорядительной документации',
      'Аттестация объектов информатизации',
      'Категорирование объектов КИИ'
    ]}
  ]
};

function openTemplateModal() {
  const modal = document.getElementById('templateModal');
  modal.style.display = 'flex';
}

function closeTemplateModal() {
  document.getElementById('templateModal').style.display = 'none';
}

function applyTemplate(name) {
  const tpl = TEMPLATES[name];
  if (!tpl) return;
  const today = new Date().toLocaleDateString('ru');
  tpl.forEach(cat => {
    // avoid duplicate category names
    let existing = state.categories.find(c => c.name === cat.name);
    if (!existing) {
      existing = { name: cat.name, skills: [] };
      state.categories.push(existing);
    }
    cat.skills.forEach(skillName => {
      if (!existing.skills.find(s => s.name === skillName)) {
        existing.skills.push({ name: skillName, status: 'planned', level: 'новичок', date: today });
      }
    });
  });
  save(); renderCategories(); updateTotalProgress();
  closeTemplateModal();
}

// ── IMPORT / EXPORT ────────────────────────────────────────────────────────
function exportJSON() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `resume-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function importJSON() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = '.json,application/json';
  input.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!parsed || typeof parsed !== 'object') throw new Error();
        state = parsed;
        if (!state.edu)   state.edu   = [];
        if (!state.certs) state.certs = [];
        if (!state.about) state.about = '';
        save();
        location.reload();
      } catch {
        showToast('⚠ Не удалось загрузить файл — неверный формат');
      }
    };
    reader.readAsText(file);
  });
  input.click();
}

// ── TOAST ──────────────────────────────────────────────────────────────────
function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('toast-show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('toast-show'), 3000);
}

// ── PRINT MODAL ────────────────────────────────────────────────────────────
function openPrintModal() {
  document.getElementById('printModal').style.display = 'flex';
}
function closePrintModal() {
  document.getElementById('printModal').style.display = 'none';
}
function doPrint() {
  const filter = document.querySelector('input[name="printFilter"]:checked').value;
  document.body.dataset.printFilter = filter;

  // hide empty sections
  const empties = [];

  // fixed sections
  ['aboutSection','eduSection','certsSection','projectsSection'].forEach(id => {
    const sec = document.getElementById(id);
    if (!sec) return;
    const body = sec.querySelector('.section-body, #eduList, #certsList, #projectsList, #about');
    const isEmpty =
      (id === 'aboutSection' && !state.about.trim()) ||
      (id === 'eduSection'   && !state.edu.length) ||
      (id === 'certsSection' && !state.certs.length) ||
      (id === 'projectsSection' && !state.projects.length);
    if (isEmpty) { sec.classList.add('print-hidden'); empties.push(sec); }
  });

  // custom sections
  document.querySelectorAll('#customSectionsContainer section').forEach((sec, i) => {
    const cs = state.customSections[i];
    if (!cs || !cs.body.trim()) { sec.classList.add('print-hidden'); empties.push(sec); }
  });

  // categories without visible skills
  document.querySelectorAll('#categoriesList .category').forEach((el, i) => {
    const cat = state.categories[i];
    if (!cat) return;
    let visibleSkills = cat.skills;
    if (filter === 'done')      visibleSkills = visibleSkills.filter(s => s.status === 'done');
    if (filter === 'no-frozen') visibleSkills = visibleSkills.filter(s => s.status !== 'frozen');
    if (!visibleSkills.length) { el.classList.add('print-hidden'); empties.push(el); }
  });

  closePrintModal();
  setTimeout(() => {
    window.print();
    empties.forEach(el => el.classList.remove('print-hidden'));
    delete document.body.dataset.printFilter;
  }, 100);
}

// ── UTILS ──────────────────────────────────────────────────────────────────
function esc(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
