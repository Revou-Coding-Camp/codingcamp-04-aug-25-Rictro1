// js/script.js
class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        this.initializeElements();
        this.bindEvents();
        this.renderTasks();
        this.updateStats();
        this.setMinDate();
    }

    initializeElements() {
        this.taskForm = document.getElementById('taskForm');
        this.taskInput = document.getElementById('taskInput');
        this.dateInput = document.getElementById('dateInput');
        this.taskError = document.getElementById('taskError');
        this.dateError = document.getElementById('dateError');
        this.taskList = document.getElementById('taskList');
        this.filterBar = document.getElementById('filterBar');
        this.totalTasksElement = document.getElementById('totalTasks');
        this.completedTasksElement = document.getElementById('completedTasks');
        this.clearCompletedBtn = document.getElementById('clearCompleted');
    }

    bindEvents() {
        this.taskForm.addEventListener('submit', (e) => this.handleSubmit(e));
        // filter buttons
        if (this.filterBar) {
            this.filterBar.addEventListener('click', (e) => {
                const button = e.target.closest('[data-filter]');
                if (!button) return;
                const value = button.getAttribute('data-filter');
                this.setActiveFilterButton(value);
                this.currentFilter = value;
                this.renderTasks();
            });
        }
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());
        
        // Real-time validation
        this.taskInput.addEventListener('input', () => this.validateTaskInput());
        this.dateInput.addEventListener('change', () => this.validateDateInput());

        // Attach task list delegation once
        this.bindTaskEvents();
    }

    setActiveFilterButton(value) {
        const buttons = this.filterBar?.querySelectorAll('.filter') || [];
        buttons.forEach((btn) => btn.classList.remove('active'));
        const active = this.filterBar?.querySelector(`[data-filter="${value}"]`);
        if (active) active.classList.add('active');
    }

    setMinDate() {
        const today = new Date().toISOString().split('T')[0];
        this.dateInput.min = today;
        if (!this.dateInput.value) {
            this.dateInput.value = today;
        }
    }

validateTaskInput() {
    const task = this.taskInput.value.trim();
    
    if (task.length === 0) {
        this.showPopup('⚠️ Task cannot be empty', 'error');
        return false;
    }
    
    if (task.length < 3) {
        this.showPopup('⚠️ Task must be at least 3 characters long', 'error');
        return false;
    }
    
    if (task.length > 100) {
        this.showPopup('⚠️ Task must be less than 100 characters', 'error');
        return false;
    }
    
    // Check for duplicate tasks
    const duplicateTask = this.tasks.find(t => 
        t.text.toLowerCase() === task.toLowerCase() && !t.completed
    );
    
    if (duplicateTask) {
        this.showPopup('⚠️ This task already exists', 'error');
        return false;
    }

    return true;
}

showPopup(message, type = 'success') {
    let popup = document.getElementById('notification-popup');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'notification-popup';
        popup.className = 'notification-popup';
        document.body.appendChild(popup);
    }

    popup.textContent = message;
    popup.className = `notification-popup ${type} visible`;

    setTimeout(() => {
        popup.classList.remove('visible');
    }, 3000);
}


    validateDateInput() {
        const selectedDate = this.dateInput.value;
        
        if (!selectedDate) {
            this.showPopup('⚠️ Please select a due date', 'error');
            return false;
        }
        
        const today = new Date();
        const selected = new Date(selectedDate);
        today.setHours(0, 0, 0, 0);
        selected.setHours(0, 0, 0, 0);
        
        if (selected < today) {
            this.showPopup('⚠️ Due date cannot be in the past', 'error');
            return false;
        }
        
        return true;
    }

    showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (!errorElement) {
            if (message) this.showPopup(message, 'error');
            return;
        }
        errorElement.textContent = message;
        errorElement.classList.toggle('show', Boolean(message));
    }


    clearError(elementId) {
        this.showError(elementId, '');
    }

    handleSubmit(e) {
        e.preventDefault();
        
        const isTaskValid = this.validateTaskInput();
        const isDateValid = this.validateDateInput();
        
        if (!isTaskValid || !isDateValid) {
            return;
        }
        
        const taskText = this.taskInput.value.trim();
        const dueDate = this.dateInput.value;
        
        this.addTask(taskText, dueDate);
        this.taskForm.reset();
        this.clearError('taskError');
        this.clearError('dateError');
        
        // Show success feedback
        this.showPopup('✅ Task added successfully!', 'success');
    }



    addTask(text, dueDate) {
        const task = {
            id: Date.now(),
            text: text,
            dueDate: dueDate,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        this.tasks.unshift(task);
        this.saveTasks();
        this.renderTasks();
        // Pulse the newly inserted row for feedback
        requestAnimationFrame(() => {
            const row = document.querySelector(`[data-task-id="${task.id}"]`);
            if (row) {
                row.classList.add('pulse');
                setTimeout(() => row.classList.remove('pulse'), 500);
            }
        });
        this.updateStats();
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
        }
    }

    deleteTask(id) {
        const taskElement = document.querySelector(`[data-task-id="${id}"]`);
        
        if (taskElement) {
            taskElement.classList.add('removing');
            
            setTimeout(() => {
                this.tasks = this.tasks.filter(t => t.id !== id);
                this.saveTasks();
                this.renderTasks();
                this.updateStats();
                this.showPopup('🗑️ Task deleted successfully!', 'success');
            }, 300);
        }
    }

    getTaskStatus(task) {
        if (task.completed) return 'completed';
        
        const today = new Date();
        const dueDate = new Date(task.dueDate);
        today.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);
        
        if (dueDate < today) return 'overdue';
        return 'pending';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        today.setHours(0, 0, 0, 0);
        tomorrow.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        
        if (date.getTime() === today.getTime()) {
            return '📅 Today';
        } else if (date.getTime() === tomorrow.getTime()) {
            return '📅 Tomorrow';
        } else {
            return `📅 ${date.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
            })}`;
        }
    }

    // select-based filter removed in redesign

    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'completed':
                return this.tasks.filter(t => t.completed);
            case 'pending':
                return this.tasks.filter(t => !t.completed && this.getTaskStatus(t) === 'pending');
            case 'overdue':
                return this.tasks.filter(t => !t.completed && this.getTaskStatus(t) === 'overdue');
            default:
                return this.tasks;
        }
    }

    renderTasks() {
        const filteredTasks = this.getFilteredTasks();
        
        if (filteredTasks.length === 0) {
            this.taskList.innerHTML = this.getEmptyStateHTML();
            return;
        }
        
        const tasksHTML = filteredTasks.map(task => this.createTaskHTML(task)).join('');
        this.taskList.innerHTML = tasksHTML;
    }

    getEmptyStateHTML() {
        const messages = {
            all: { icon: '📝', title: 'No tasks yet', subtitle: 'Add your first task above to get started!' },
            completed: { icon: '✅', title: 'No completed tasks', subtitle: 'Complete some tasks to see them here!' },
            pending: { icon: '⏳', title: 'No pending tasks', subtitle: 'All caught up! Great work!' },
            overdue: { icon: '⚠️', title: 'No overdue tasks', subtitle: 'You\'re staying on top of things!' }
        };
        
        const message = messages[this.currentFilter] || messages.all;
        
        return `
            <tr class="empty-state">
                <td colspan="5">
                    <div class="empty-content">
                        <div class="empty-icon">${message.icon}</div>
                        <h3>${message.title}</h3>
                        <p>${message.subtitle}</p>
                    </div>
                </td>
            </tr>
        `;
    }

    createTaskHTML(task) {
        const status = this.getTaskStatus(task);
        const formattedDate = this.formatDate(task.dueDate);
        const priorityLevel = this.getPriorityLevel(task);
        
        return `
            <tr class="task-row ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                <td>
                    <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-action="toggle">
                        ${task.completed ? '✓' : ''}
                    </div>
                </td>
                <td>
                    <div class="task-text">${this.escapeHtml(task.text)}</div>
                </td>
                <td>
                    <div class="task-date">${formattedDate}</div>
                </td>
                <td>
                    <span class="task-status ${status}">${status}</span>
                </td>
                <td>
                    <div class="task-actions">
                        <button class="btn-delete" data-action="delete" title="Delete task">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    getPriorityLevel(task) {
        const today = new Date();
        const dueDate = new Date(task.dueDate);
        const diffTime = dueDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return 'overdue';
        if (diffDays <= 1) return 'urgent';
        if (diffDays <= 3) return 'high';
        if (diffDays <= 7) return 'medium';
        return 'low';
    }

    bindTaskEvents() {
        this.taskList.addEventListener('click', (e) => {
            const actionEl = e.target.closest('[data-action]');
            if (!actionEl) return;
            const taskRow = actionEl.closest('.task-row');
            if (!taskRow) return;
            const taskId = parseInt(taskRow.dataset.taskId);
            const action = actionEl.dataset.action;
            if (action === 'toggle') this.toggleTask(taskId);
            if (action === 'delete') this.deleteTask(taskId);
        });
    }

    clearCompleted() {
        const completedTasks = this.tasks.filter(t => t.completed);
        
        if (completedTasks.length === 0) {
            this.showPopup('ℹ️ No completed tasks to clear!', 'info');
            return;
        }
        
        if (confirm(`Are you sure you want to delete ${completedTasks.length} completed task(s)?`)) {
            this.tasks = this.tasks.filter(t => !t.completed);
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.showPopup(`🧹 ${completedTasks.length} completed task(s) cleared!`, 'success');
        }
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        
        this.totalTasksElement.textContent = total;
        this.completedTasksElement.textContent = completed;
        
        // Update clear completed button
        const hasCompleted = completed > 0;
        this.clearCompletedBtn.style.opacity = hasCompleted ? '1' : '0.5';
        this.clearCompletedBtn.style.pointerEvents = hasCompleted ? 'auto' : 'none';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveTasks() {
        try {
            localStorage.setItem('taskflow-tasks', JSON.stringify(this.tasks));
        } catch (e) {
            // ignore storage errors
        }
    }

    loadTasks() {
        try {
            const stored = localStorage.getItem('taskflow-tasks');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }
}

// Initialize the Task Manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TaskManager();
});



