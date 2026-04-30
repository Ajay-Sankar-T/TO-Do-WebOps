const state = {
  theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  filter: 'all',
  view: 'list',
  search: '',
  streak: 12,
  quotes: [
    'Small progress still counts. Ship one important thing today.',
    'Clarity beats intensity. Finish the next meaningful task.',
    'Momentum grows when your tasks are visible and concrete.'
  ],
  tasks: [
    { id: crypto.randomUUID(), title: 'Redesign the hero for the WebOps submission page', category: 'Design', priority: 'high', due: 'Today', completed: false },
    { id: crypto.randomUUID(), title: 'Split the app into HTML, CSS, and JavaScript files', category: 'Development', priority: 'high', due: 'Tonight', completed: false },
    { id: crypto.randomUUID(), title: 'Polish mobile spacing and button states', category: 'Design', priority: 'medium', due: 'Tomorrow', completed: false },
    { id: crypto.randomUUID(), title: 'Review mechanics notes for tomorrow morning', category: 'Study', priority: 'low', due: '8 AM', completed: true },
    { id: crypto.randomUUID(), title: 'Prepare portfolio links and GitHub screenshots', category: 'Personal', priority: 'medium', due: 'Weekend', completed: false }
  ]
};

const root = document.documentElement;
const els = {
  taskForm: document.getElementById('task-form'),
  taskList: document.getElementById('task-list'),
  filterBtns: [...document.querySelectorAll('.filter-btn')],
  viewBtns: [...document.querySelectorAll('.segmented-btn')],
  searchInput: document.getElementById('search-input'),
  progressRing: document.getElementById('progress-ring'),
  progressLabel: document.getElementById('progress-label'),
  streakCount: document.getElementById('streak-count'),
  focusTask: document.getElementById('focus-task'),
  heroStats: document.getElementById('hero-stats'),
  overviewGrid: document.getElementById('overview-grid'),
  kanbanBoard: document.getElementById('kanban-board'),
  colPending: document.getElementById('col-pending'),
  colHigh: document.getElementById('col-high'),
  colCompleted: document.getElementById('col-completed'),
  motivation: document.getElementById('motivation'),
  clearCompletedBtn: document.getElementById('clear-completed-btn'),
  themeToggle: document.querySelector('[data-theme-toggle]')
};

function setTheme(theme) {
  state.theme = theme;
  root.setAttribute('data-theme', theme);
  els.themeToggle.textContent = theme === 'dark' ? '☀' : '☾';
}

function filteredTasks() {
  return state.tasks.filter(task => {
    const text = `${task.title} ${task.category} ${task.priority} ${task.due}`.toLowerCase();
    const matchesSearch = text.includes(state.search.toLowerCase());
    const matchesFilter =
      state.filter === 'all' ||
      (state.filter === 'pending' && !task.completed) ||
      (state.filter === 'completed' && task.completed) ||
      (state.filter === 'high' && task.priority === 'high');
    return matchesSearch && matchesFilter;
  });
}

function stats() {
  const total = state.tasks.length;
  const completed = state.tasks.filter(t => t.completed).length;
  const pending = total - completed;
  const high = state.tasks.filter(t => t.priority === 'high' && !t.completed).length;
  return { total, completed, pending, high, percent: total ? Math.round((completed / total) * 100) : 0 };
}

function renderStats() {
  const s = stats();
  const blocks = [
    ['Tasks', s.total],
    ['Pending', s.pending],
    ['Completed', s.completed],
    ['High priority', s.high]
  ];
  els.heroStats.innerHTML = blocks.map(([label, value]) => `<div class="metric"><strong>${value}</strong><span>${label}</span></div>`).join('');
  els.overviewGrid.innerHTML = blocks.map(([label, value]) => `<div class="mini-card"><strong>${value}</strong><span>${label}</span></div>`).join('');
  els.progressRing.style.setProperty('--progress', `${s.percent * 3.6}deg`);
  els.progressLabel.textContent = `${s.percent}%`;
  els.streakCount.textContent = `${state.streak} days`;
  const nextFocus = state.tasks.find(t => !t.completed && t.priority === 'high') || state.tasks.find(t => !t.completed);
  els.focusTask.textContent = nextFocus ? nextFocus.title : 'Everything completed';
}

function taskTemplate(task) {
  return `
    <li class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
      <button class="check-btn" type="button" aria-label="Toggle task completion"></button>
      <div class="task-main">
        <div class="task-title-row">
          <p class="task-title">${task.title}</p>
          <span class="chip ${task.completed ? 'done' : task.priority}">${task.completed ? 'Done' : task.priority}</span>
        </div>
        <div class="task-meta">
          <span>${task.category}</span>
          <span>•</span>
          <span>${task.due || 'No due label'}</span>
        </div>
        <div class="task-tags">
          <button class="task-action" data-action="edit" type="button">Edit</button>
          <button class="task-action" data-action="delete" type="button">Delete</button>
          ${task.completed ? '<button class="task-action" data-action="undo" type="button">Undo</button>' : ''}
        </div>
      </div>
      <div class="task-actions"><button class="task-action" data-action="focus" type="button">Focus</button></div>
    </li>`;
}

function renderList() {
  const tasks = filteredTasks();
  els.taskList.innerHTML = tasks.length ? tasks.map(taskTemplate).join('') : `<li class="empty-state">No matching tasks yet. Add one or change the filter.</li>`;
}

function renderBoard() {
  const all = filteredTasks();
  const pending = all.filter(t => !t.completed);
  const high = all.filter(t => !t.completed && t.priority === 'high');
  const completed = all.filter(t => t.completed);
  const makeCards = items => items.length ? items.map(t => `<div class="kanban-card"><strong>${t.title}</strong><p>${t.category} • ${t.due || 'No due label'} • ${t.priority}</p></div>`).join('') : `<div class="empty-state">Nothing here.</div>`;
  els.colPending.innerHTML = makeCards(pending);
  els.colHigh.innerHTML = makeCards(high);
  els.colCompleted.innerHTML = makeCards(completed);
}

function renderView() {
  const listActive = state.view === 'list';
  els.taskList.hidden = !listActive;
  els.kanbanBoard.hidden = listActive;
  els.taskList.classList.toggle('view-active', listActive);
  renderList();
  renderBoard();
}

function renderAll() {
  renderStats();
  renderView();
  els.motivation.textContent = state.quotes[stats().completed % state.quotes.length];
}

function updateFilterButtons() {
  els.filterBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.filter === state.filter));
}

function updateViewButtons() {
  els.viewBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.view === state.view));
}

els.themeToggle.addEventListener('click', () => setTheme(state.theme === 'dark' ? 'light' : 'dark'));

els.taskForm.addEventListener('submit', e => {
  e.preventDefault();
  const formData = new FormData(els.taskForm);
  const title = String(formData.get('task')).trim();
  if (!title) return;
  state.tasks.unshift({
    id: crypto.randomUUID(),
    title,
    category: String(formData.get('category')),
    priority: String(formData.get('priority')),
    due: String(formData.get('due')).trim(),
    completed: false
  });
  els.taskForm.reset();
  renderAll();
});

els.searchInput.addEventListener('input', e => {
  state.search = e.target.value;
  renderView();
});

els.filterBtns.forEach(btn => btn.addEventListener('click', () => {
  state.filter = btn.dataset.filter;
  updateFilterButtons();
  renderView();
}));

els.viewBtns.forEach(btn => btn.addEventListener('click', () => {
  state.view = btn.dataset.view;
  updateViewButtons();
  renderView();
}));

els.taskList.addEventListener('click', e => {
  const item = e.target.closest('.task-item');
  if (!item) return;
  const id = item.dataset.id;
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;

  if (e.target.closest('.check-btn')) task.completed = !task.completed;
  const action = e.target.dataset.action;
  if (action === 'delete') state.tasks = state.tasks.filter(t => t.id !== id);
  if (action === 'undo') task.completed = false;
  if (action === 'focus') els.focusTask.textContent = task.title;
  if (action === 'edit') {
    const nextTitle = prompt('Edit task title', task.title);
    if (nextTitle && nextTitle.trim()) task.title = nextTitle.trim();
  }
  renderAll();
});

els.clearCompletedBtn.addEventListener('click', () => {
  state.tasks = state.tasks.filter(task => !task.completed);
  renderAll();
});

setTheme(state.theme);
updateFilterButtons();
updateViewButtons();
renderAll();
