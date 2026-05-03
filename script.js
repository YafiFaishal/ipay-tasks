const STORAGE_KEY = 'ipay_financial_tasks_v2';
const THEME_KEY = 'ipay_theme_preference';

let state = {
  tasks: [],
  filter: 'All',
  sort: 'dueDate',
  search: ''
};

// DOM Elements
const dom = {
  html: document.documentElement,
  themeToggle: document.getElementById('theme-toggle'),
  navItems: document.querySelectorAll('.nav-item'),
  pages: document.querySelectorAll('.page'),
  pageTitle: document.getElementById('main-page-title'),
  
  // Dashboard
  greeting: document.getElementById('greeting'),
  statTotal: document.getElementById('stat-total'),
  statCompleted: document.getElementById('stat-completed'),
  statProgress: document.getElementById('stat-progress'),
  statUrgent: document.getElementById('stat-urgent'),
  quickAddForm: document.getElementById('quick-add-form'),
  quickAddInput: document.getElementById('quick-add-input'),
  dashTodayList: document.getElementById('dashboard-today-list'),
  dashUpcomingList: document.getElementById('dashboard-upcoming-list'),
  
  // My Tasks
  searchInput: document.getElementById('search-input'),
  filterChips: document.querySelectorAll('.filter-chip'),
  sortSelect: document.getElementById('sort-select'),
  myTasksList: document.getElementById('my-tasks-list'),
  tasksEmptyState: document.getElementById('tasks-empty-state'),
  
  // Priority Kanban
  kanbanUrgent: document.getElementById('kanban-urgent'),
  kanbanMedium: document.getElementById('kanban-medium'),
  kanbanLow: document.getElementById('kanban-low'),
  countUrgent: document.getElementById('count-urgent'),
  countMedium: document.getElementById('count-medium'),
  countLow: document.getElementById('count-low'),
  kanbanTabs: document.querySelectorAll('.kanban-tab'),
  kanbanCols: document.querySelectorAll('.kanban-column'),
  
  // Modal
  fabAdd: document.getElementById('fab-add-task'),
  addModal: document.getElementById('add-modal'),
  btnCloseModal: document.getElementById('btn-close-modal'),
  fullAddForm: document.getElementById('full-add-form'),
  modalTitle: document.getElementById('modal-title'),
  modalDate: document.getElementById('modal-date'),
  modalPriority: document.getElementById('modal-priority'),
  modalCategory: document.getElementById('modal-category')
};

// Initialization
function init() {
  loadTheme();
  loadTasks();
  updateGreeting();
  setupEventListeners();
  
  // Set default dates
  const today = new Date().toISOString().split('T')[0];
  dom.modalDate.value = today;
  
  lucide.createIcons();
  render();
}

function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) {
    dom.html.setAttribute('data-theme', saved);
  }
}

function toggleTheme() {
  const current = dom.html.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  dom.html.setAttribute('data-theme', next);
  localStorage.setItem(THEME_KEY, next);
}

function loadTasks() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      state.tasks = JSON.parse(stored);
    } catch(e) {
      state.tasks = [];
    }
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
}

function updateGreeting() {
  const hour = new Date().getHours();
  let text = 'Good evening';
  if (hour < 12) text = 'Good morning';
  else if (hour < 18) text = 'Good afternoon';
  dom.greeting.textContent = `${text}, User`;
}

// Navigation
function switchPage(targetId, titleText) {
  dom.navItems.forEach(nav => {
    if (nav.dataset.target === targetId) nav.classList.add('active');
    else nav.classList.remove('active');
  });
  
  dom.pages.forEach(page => {
    if (page.id === `page-${targetId}`) page.classList.add('active');
    else page.classList.remove('active');
  });
  
  dom.pageTitle.textContent = titleText;
  lucide.createIcons();
}

// Event Listeners setup
function setupEventListeners() {
  dom.themeToggle.addEventListener('click', toggleTheme);
  
  dom.navItems.forEach(nav => {
    nav.addEventListener('click', () => {
      const target = nav.dataset.target;
      const title = nav.querySelector('.nav-text').textContent;
      switchPage(target, title);
    });
  });
  
  // Quick Add
  dom.quickAddForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addTask({
      title: dom.quickAddInput.value,
      dueDate: new Date().toISOString().split('T')[0],
      priority: 'Medium',
      category: ''
    });
    dom.quickAddInput.value = '';
    dom.quickAddInput.blur();
  });
  
  // Full Add Modal
  dom.fabAdd.addEventListener('click', () => dom.addModal.classList.add('active'));
  dom.btnCloseModal.addEventListener('click', () => dom.addModal.classList.remove('active'));
  dom.addModal.addEventListener('click', (e) => {
    if (e.target === dom.addModal) dom.addModal.classList.remove('active');
  });
  
  dom.fullAddForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addTask({
      title: dom.modalTitle.value,
      dueDate: dom.modalDate.value,
      priority: dom.modalPriority.value,
      category: dom.modalCategory.value
    });
    dom.addModal.classList.remove('active');
    dom.fullAddForm.reset();
    dom.modalDate.value = new Date().toISOString().split('T')[0];
    dom.modalPriority.value = 'Medium';
  });
  
  // Global clicks (delete, toggle)
  document.addEventListener('click', (e) => {
    const delBtn = e.target.closest('.btn-delete');
    if (delBtn) {
      const card = delBtn.closest('.task-card');
      card.classList.add('sliding-out');
      setTimeout(() => deleteTask(delBtn.dataset.id), 300);
    }
    
    const cb = e.target.closest('.task-checkbox');
    if (cb) {
      toggleTask(cb.dataset.id, cb.checked);
    }
  });
  
  // My Tasks Controls
  dom.searchInput.addEventListener('input', (e) => {
    state.search = e.target.value.toLowerCase();
    renderMyTasks();
  });
  
  dom.filterChips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      dom.filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.filter = chip.dataset.filter;
      renderMyTasks();
    });
  });
  
  dom.sortSelect.addEventListener('change', (e) => {
    state.sort = e.target.value;
    renderMyTasks();
  });

  // Kanban Mobile Tabs
  dom.kanbanTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      dom.kanbanTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const colId = tab.dataset.col;
      dom.kanbanCols.forEach(col => {
        if (col.classList.contains(colId)) col.classList.add('active');
        else col.classList.remove('active');
      });
    });
  });

  // Drag and Drop
  dom.kanbanCols.forEach(col => {
    col.addEventListener('dragover', e => {
      e.preventDefault();
      col.classList.add('drag-over');
    });
    col.addEventListener('dragleave', () => col.classList.remove('drag-over'));
    col.addEventListener('drop', e => {
      e.preventDefault();
      col.classList.remove('drag-over');
      const id = e.dataTransfer.getData('text/plain');
      const newPriority = col.dataset.priority;
      if (id && newPriority) {
        const task = state.tasks.find(t => t.id === id);
        if (task && task.priority !== newPriority) {
          task.priority = newPriority;
          saveTasks();
          render();
        }
      }
    });
  });
}

// State Modifiers
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function addTask(data) {
  state.tasks.push({
    id: generateId(),
    title: data.title.trim(),
    dueDate: data.dueDate,
    priority: data.priority,
    category: data.category.trim(),
    completed: false,
    createdAt: Date.now()
  });
  saveTasks();
  render();
}

function toggleTask(id, completed) {
  const task = state.tasks.find(t => t.id === id);
  if (task) {
    task.completed = completed;
    saveTasks();
    render();
  }
}

function deleteTask(id) {
  state.tasks = state.tasks.filter(t => t.id !== id);
  saveTasks();
  render();
}

// Rendering
function render() {
  renderDashboard();
  renderMyTasks();
  renderKanban();
  lucide.createIcons();
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function createTaskEl(task, showCategory = false, dragEnabled = false) {
  const div = document.createElement('div');
  div.className = `task-card ${task.completed ? 'done' : ''}`;
  if (dragEnabled) {
    div.draggable = true;
    div.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', task.id);
      setTimeout(() => div.classList.add('dragging'), 0);
    });
    div.addEventListener('dragend', () => div.classList.remove('dragging'));
  }
  
  const catHtml = showCategory && task.category ? `<span class="category-tag">${escapeHtml(task.category)}</span>` : '';
  
  div.innerHTML = `
    ${dragEnabled ? `
      <div class="task-header">
        <div style="display:flex; align-items:flex-start; gap:12px;">
          <input type="checkbox" class="task-checkbox" data-id="${task.id}" ${task.completed ? 'checked' : ''}>
          <div class="task-content">
            <div class="task-title">${escapeHtml(task.title)}</div>
            <div class="task-meta">
              <span><i data-lucide="calendar"></i> ${task.dueDate || 'No Date'}</span>
              ${catHtml}
            </div>
          </div>
        </div>
        <button class="btn-delete" data-id="${task.id}"><i data-lucide="trash-2"></i></button>
      </div>
    ` : `
      <input type="checkbox" class="task-checkbox" data-id="${task.id}" ${task.completed ? 'checked' : ''}>
      <div class="task-content">
        <div class="task-title">${escapeHtml(task.title)}</div>
        <div class="task-meta">
          <span><i data-lucide="calendar"></i> ${task.dueDate || 'No Date'}</span>
          <span class="priority-badge priority-${task.priority}">${task.priority}</span>
          ${catHtml}
        </div>
      </div>
      <button class="btn-delete" data-id="${task.id}"><i data-lucide="trash-2"></i></button>
    `}
  `;
  return div;
}

function renderDashboard() {
  const total = state.tasks.length;
  const completed = state.tasks.filter(t => t.completed).length;
  const urgent = state.tasks.filter(t => !t.completed && t.priority === 'Urgent').length;
  
  dom.statTotal.textContent = total;
  dom.statCompleted.textContent = completed;
  dom.statUrgent.textContent = urgent;
  
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  dom.statProgress.style.width = `${pct}%`;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const activeTasks = state.tasks.filter(t => !t.completed);
  
  // Sort active tasks by due date
  activeTasks.sort((a, b) => (a.dueDate > b.dueDate) ? 1 : -1);
  
  const todayTasks = activeTasks.filter(t => !t.dueDate || t.dueDate <= todayStr).slice(0, 5);
  const upcomingTasks = activeTasks.filter(t => t.dueDate > todayStr).slice(0, 3);
  
  dom.dashTodayList.innerHTML = '';
  if (todayTasks.length) {
    todayTasks.forEach(t => dom.dashTodayList.appendChild(createTaskEl(t)));
  } else {
    dom.dashTodayList.innerHTML = '<div style="color:var(--text-secondary); font-size:14px; padding:8px;">No tasks for today. You\'re all caught up!</div>';
  }
  
  dom.dashUpcomingList.innerHTML = '';
  if (upcomingTasks.length) {
    upcomingTasks.forEach(t => dom.dashUpcomingList.appendChild(createTaskEl(t)));
  } else {
    dom.dashUpcomingList.innerHTML = '<div style="color:var(--text-secondary); font-size:14px; padding:8px;">No upcoming tasks.</div>';
  }
}

function renderMyTasks() {
  let filtered = state.tasks;
  
  if (state.search) {
    filtered = filtered.filter(t => t.title.toLowerCase().includes(state.search) || (t.category && t.category.toLowerCase().includes(state.search)));
  }
  
  switch(state.filter) {
    case 'Active': filtered = filtered.filter(t => !t.completed); break;
    case 'Done': filtered = filtered.filter(t => t.completed); break;
    case 'Urgent': filtered = filtered.filter(t => t.priority === 'Urgent'); break;
    case 'Medium': filtered = filtered.filter(t => t.priority === 'Medium'); break;
    case 'Low': filtered = filtered.filter(t => t.priority === 'Low'); break;
  }
  
  filtered.sort((a, b) => {
    switch(state.sort) {
      case 'dueDate': return (a.dueDate > b.dueDate) ? 1 : -1;
      case 'priority': 
        const p = { 'Urgent': 1, 'Medium': 2, 'Low': 3 };
        return p[a.priority] - p[b.priority];
      case 'created': return b.createdAt - a.createdAt;
      case 'alpha': return a.title.localeCompare(b.title);
      default: return 0;
    }
  });
  
  dom.myTasksList.innerHTML = '';
  if (filtered.length > 0) {
    dom.tasksEmptyState.hidden = true;
    filtered.forEach(t => dom.myTasksList.appendChild(createTaskEl(t, true)));
  } else {
    dom.tasksEmptyState.hidden = false;
  }
}

function renderKanban() {
  const activeTasks = state.tasks.filter(t => !t.completed);
  const urgents = activeTasks.filter(t => t.priority === 'Urgent');
  const mediums = activeTasks.filter(t => t.priority === 'Medium');
  const lows = activeTasks.filter(t => t.priority === 'Low');
  
  dom.countUrgent.textContent = urgents.length;
  dom.countMedium.textContent = mediums.length;
  dom.countLow.textContent = lows.length;
  
  dom.kanbanUrgent.innerHTML = '';
  urgents.forEach(t => dom.kanbanUrgent.appendChild(createTaskEl(t, true, true)));
  
  dom.kanbanMedium.innerHTML = '';
  mediums.forEach(t => dom.kanbanMedium.appendChild(createTaskEl(t, true, true)));
  
  dom.kanbanLow.innerHTML = '';
  lows.forEach(t => dom.kanbanLow.appendChild(createTaskEl(t, true, true)));
}

document.addEventListener('DOMContentLoaded', init);
