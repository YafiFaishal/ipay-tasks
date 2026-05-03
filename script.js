const STORAGE_KEY = 'ipay_financial_tasks_v2';

let state = {
  tasks: [],
  filter: 'All'
};

const dom = {
  form: document.getElementById('task-form'),
  titleInput: document.getElementById('task-title'),
  dateInput: document.getElementById('task-date'),
  priorityInput: document.getElementById('task-priority'),
  filters: document.getElementById('filters'),
  listToday: document.getElementById('list-today'),
  listUpcoming: document.getElementById('list-upcoming'),
  groupToday: document.getElementById('group-today'),
  groupUpcoming: document.getElementById('group-upcoming'),
  emptyState: document.getElementById('empty-state'),
  
  statTotalVal: document.getElementById('stat-total-val'),
  statTotalBar: document.getElementById('stat-total-bar'),
  statCompletedVal: document.getElementById('stat-completed-val'),
  statCompletedBar: document.getElementById('stat-completed-bar'),
  statUrgentVal: document.getElementById('stat-urgent-val'),
  statUrgentBar: document.getElementById('stat-urgent-bar'),
};

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function init() {
  const today = new Date().toISOString().split('T')[0];
  dom.dateInput.value = today;
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      state.tasks = JSON.parse(stored);
    } catch(e) {
      state.tasks = [];
    }
  }

  lucide.createIcons();
  bindEvents();
  render();
}

function bindEvents() {
  dom.form.addEventListener('submit', (e) => {
    e.preventDefault();
    addTask(dom.titleInput.value, dom.dateInput.value, dom.priorityInput.value);
    dom.titleInput.value = '';
    const today = new Date().toISOString().split('T')[0];
    dom.dateInput.value = today;
    dom.priorityInput.value = 'Medium';
    dom.titleInput.focus();
  });

  dom.filters.addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-chip')) {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');
      state.filter = e.target.dataset.filter;
      render();
    }
  });

  document.addEventListener('click', (e) => {
    const delBtn = e.target.closest('.btn-delete');
    if (delBtn) {
      deleteTask(delBtn.dataset.id);
      return;
    }
    
    const cb = e.target.closest('.task-checkbox');
    if (cb) {
      toggleTask(cb.dataset.id, cb.checked);
    }
  });
}

function addTask(title, dueDate, priority) {
  state.tasks.push({
    id: generateId(),
    title: title.trim(),
    dueDate,
    priority,
    completed: false,
    createdAt: Date.now()
  });
  saveAndRender();
}

function toggleTask(id, completed) {
  const task = state.tasks.find(t => t.id === id);
  if (task) {
    task.completed = completed;
    saveAndRender();
  }
}

function deleteTask(id) {
  state.tasks = state.tasks.filter(t => t.id !== id);
  saveAndRender();
}

function saveAndRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
  render();
}

function render() {
  updateStats();
  
  let filtered = state.tasks;
  
  if (state.filter === 'Active') {
    filtered = filtered.filter(t => !t.completed);
  } else if (state.filter === 'Done') {
    filtered = filtered.filter(t => t.completed);
  } else if (state.filter === 'Urgent') {
    filtered = filtered.filter(t => t.priority === 'Urgent');
  }

  filtered.sort((a, b) => {
    if (a.dueDate === b.dueDate) return b.createdAt - a.createdAt;
    return a.dueDate > b.dueDate ? 1 : -1;
  });

  const todayStr = new Date().toISOString().split('T')[0];
  
  const todayTasks = [];
  const upcomingTasks = [];
  
  filtered.forEach(task => {
    if (!task.dueDate || task.dueDate <= todayStr) {
      todayTasks.push(task);
    } else {
      upcomingTasks.push(task);
    }
  });

  dom.listToday.innerHTML = '';
  dom.listUpcoming.innerHTML = '';
  
  if (todayTasks.length > 0) {
    dom.groupToday.style.display = 'block';
    todayTasks.forEach(t => dom.listToday.appendChild(createTaskEl(t)));
  } else {
    dom.groupToday.style.display = 'none';
  }
  
  if (upcomingTasks.length > 0) {
    dom.groupUpcoming.style.display = 'block';
    upcomingTasks.forEach(t => dom.listUpcoming.appendChild(createTaskEl(t)));
  } else {
    dom.groupUpcoming.style.display = 'none';
  }
  
  if (todayTasks.length === 0 && upcomingTasks.length === 0) {
    dom.emptyState.hidden = false;
  } else {
    dom.emptyState.hidden = true;
  }

  lucide.createIcons();
}

function createTaskEl(task) {
  const div = document.createElement('div');
  div.className = `task-item ${task.completed ? 'done' : ''}`;
  
  const badgeText = task.completed ? 'Done' : task.priority;
  const priorityClass = task.completed ? 'done' : task.priority.toLowerCase();
  
  div.innerHTML = `
    <input type="checkbox" class="task-checkbox" data-id="${task.id}" ${task.completed ? 'checked' : ''} aria-label="Toggle task">
    <div class="task-content">
      <div class="task-title">${escapeHtml(task.title)}</div>
      <div class="task-meta">
        <span><i data-lucide="calendar"></i> ${task.dueDate || 'No Date'}</span>
        <span class="badge ${priorityClass}">${badgeText}</span>
      </div>
    </div>
    <button class="btn-delete" data-id="${task.id}" aria-label="Delete task">
      <i data-lucide="trash-2"></i>
    </button>
  `;
  return div;
}

function updateStats() {
  const total = state.tasks.length;
  const completed = state.tasks.filter(t => t.completed).length;
  const urgent = state.tasks.filter(t => t.priority === 'Urgent').length;
  
  dom.statTotalVal.textContent = total;
  dom.statCompletedVal.textContent = completed;
  dom.statUrgentVal.textContent = urgent;
  
  const compPct = total === 0 ? 0 : Math.round((completed / total) * 100);
  const urgPct = total === 0 ? 0 : Math.round((urgent / total) * 100);
  
  dom.statTotalBar.style.width = total > 0 ? '100%' : '0%';
  dom.statCompletedBar.style.width = `${compPct}%`;
  dom.statUrgentBar.style.width = `${urgPct}%`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', init);
