class TodoApp {
    constructor() {
        try {
            const storedTodos = localStorage.getItem('todos');
            if (storedTodos) {
                this.todos = JSON.parse(storedTodos);
            } else {
                this.todos = [];
            }
        } catch (error) {
            console.error('讀取localStorage時發生錯誤:', error);
            this.todos = [];
        }
        
        this.currentFilter = 'today';
        this.editingId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setDefaultDate();
        this.renderTodos();
        this.updateStats();
    }

    setupEventListeners() {
        // 新增待辦事項
        document.getElementById('addBtn').addEventListener('click', () => this.addTodo());
        
        // 按Enter鍵新增
        document.getElementById('todoInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });

        // 分類標籤切換
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.filter);
            });
        });

        // 模態框關閉
        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelEditBtn').addEventListener('click', () => this.closeModal());
        
        // 點擊模態框外部關閉
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });

        // 儲存編輯
        document.getElementById('saveEditBtn').addEventListener('click', () => this.saveEdit());
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('todoDate').value = today;
    }

    addTodo() {
        const input = document.getElementById('todoInput');
        const dateInput = document.getElementById('todoDate');
        const colorSelect = document.getElementById('todoColor');
        
        const text = input.value.trim();
        const date = dateInput.value;
        const color = colorSelect.value;
        
        if (!text || !date) {
            alert('請輸入待辦事項和選擇日期！');
            return;
        }

        // 檢查是否已達到100則記事限制
        if (this.todos.length >= 100) {
            alert('已達到100則記事限制！請先刪除一些舊的記事。');
            return;
        }

        const todo = {
            id: Date.now(),
            text: text,
            date: date,
            color: color,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.todos.push(todo);
        this.saveTodos();
        this.renderTodos();
        this.updateStats();
        
        // 清空輸入框
        input.value = '';
        input.focus();
        
        // 顯示成功訊息
        this.showNotification(`待辦事項已新增！(第${this.todos.length}/100則)`, 'success');
    }

    deleteTodo(id) {
        if (confirm('確定要刪除這個待辦事項嗎？')) {
            this.todos = this.todos.filter(todo => todo.id !== id);
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
            this.showNotification('待辦事項已刪除！', 'info');
        }
    }

    toggleComplete(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
            
            const message = todo.completed ? '已完成！' : '已取消完成！';
            this.showNotification(message, 'success');
        }
    }

    editTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            this.editingId = id;
            document.getElementById('editInput').value = todo.text;
            document.getElementById('editDate').value = todo.date;
            document.getElementById('editColor').value = todo.color;
            document.getElementById('editModal').style.display = 'block';
        }
    }

    saveEdit() {
        const input = document.getElementById('editInput');
        const dateInput = document.getElementById('editDate');
        const colorSelect = document.getElementById('editColor');
        
        const text = input.value.trim();
        const date = dateInput.value;
        const color = colorSelect.value;
        
        if (!text || !date) {
            alert('請輸入待辦事項和選擇日期！');
            return;
        }

        const todo = this.todos.find(t => t.id === this.editingId);
        if (todo) {
            todo.text = text;
            todo.date = date;
            todo.color = color;
            
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
            this.closeModal();
            this.showNotification('待辦事項已更新！', 'success');
        }
    }

    closeModal() {
        document.getElementById('editModal').style.display = 'none';
        this.editingId = null;
    }

    switchTab(filter) {
        this.currentFilter = filter;
        
        // 更新標籤狀態
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const targetBtn = document.querySelector(`[data-filter="${filter}"]`);
        if (targetBtn) {
            targetBtn.classList.add('active');
        }
        
        this.renderTodos();
    }

    getFilteredTodos() {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        // 計算本週的開始和結束日期
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        
        switch (this.currentFilter) {
            case 'today':
                return this.todos.filter(todo => todo.date === todayStr);
            case 'week':
                return this.todos.filter(todo => {
                    const todoDate = new Date(todo.date);
                    todoDate.setHours(12, 0, 0, 0);
                    return todoDate >= weekStart && todoDate <= weekEnd;
                });
            case 'all':
                return this.todos;
            case 'overdue':
                return this.todos.filter(todo => {
                    const todoDate = new Date(todo.date);
                    return todoDate < today && !todo.completed;
                });
            default:
                return this.todos;
        }
    }

    renderTodos() {
        const todoList = document.getElementById('todoList');
        const filteredTodos = this.getFilteredTodos();
        
        if (filteredTodos.length === 0) {
            todoList.innerHTML = `
                <div class="empty-state">
                    <p style="text-align: center; font-size: 1.2rem; color: #666; padding: 40px;">
                        ${this.getEmptyStateMessage()}
                    </p>
                </div>
            `;
            return;
        }

        // 按日期排序
        filteredTodos.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        const htmlContent = filteredTodos.map(todo => this.renderTodoItem(todo)).join('');
        todoList.innerHTML = htmlContent;
        
        // 重新綁定事件
        this.bindTodoEvents();
    }

    getEmptyStateMessage() {
        switch (this.currentFilter) {
            case 'today':
                return '今天沒有待辦事項';
            case 'week':
                return '本週沒有待辦事項';
            case 'all':
                return '沒有待辦事項';
            case 'overdue':
                return '沒有過期的待辦事項';
            default:
                return '沒有待辦事項';
        }
    }

    renderTodoItem(todo) {
        const date = new Date(todo.date);
        const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
        
        return `
            <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                <div class="todo-content">
                    <div class="todo-text" style="color: ${todo.color};">${todo.text}</div>
                    <div class="todo-date">${formattedDate}</div>
                </div>
                <div class="todo-actions">
                    <button class="complete-btn" onclick="app.toggleComplete(${todo.id})">
                        ${todo.completed ? '✓' : '○'}
                    </button>
                    <button class="edit-btn" onclick="app.editTodo(${todo.id})">✎</button>
                    <button class="delete-btn" onclick="app.deleteTodo(${todo.id})">🗑</button>
                </div>
            </div>
        `;
    }

    bindTodoEvents() {
        // 事件已經通過onclick綁定，這裡可以添加其他事件
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(todo => todo.completed).length;
        const pending = total - completed;
        
        document.getElementById('totalCount').textContent = `${total}/100`;
        document.getElementById('completedCount').textContent = completed;
        document.getElementById('pendingCount').textContent = pending;
        
        this.updateProgressBar(total, 100);
        this.updateTodoLimitInfo(total, 100);
    }

    updateProgressBar(current, max) {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        if (progressFill && progressText) {
            const percentage = Math.min((current / max) * 100, 100);
            progressFill.style.width = `${percentage}%`;
            progressText.textContent = `${Math.round(percentage)}% (${current}/${max})`;
        }
    }

    updateTodoLimitInfo(current, max) {
        const limitInfo = document.getElementById('todoLimitInfo');
        if (limitInfo) {
            const remaining = max - current;
            if (remaining <= 0) {
                limitInfo.textContent = '已達到記事上限！';
                limitInfo.style.color = '#ff4444';
            } else if (remaining <= 10) {
                limitInfo.textContent = `還可新增 ${remaining} 則記事`;
                limitInfo.style.color = '#ff8800';
            } else {
                limitInfo.textContent = `還可新增 ${remaining} 則記事`;
                limitInfo.style.color = '#4CAF50';
            }
        }
    }

    saveTodos() {
        try {
            const todosJson = JSON.stringify(this.todos);
            localStorage.setItem('todos', todosJson);
        } catch (error) {
            console.error('儲存到localStorage時發生錯誤:', error);
            try {
                localStorage.removeItem('todos');
                localStorage.setItem('todos', JSON.stringify(this.todos));
            } catch (retryError) {
                console.error('重新儲存也失敗:', retryError);
            }
        }
    }

    showNotification(message, type = 'info') {
        // 移除現有的通知
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // 自動移除通知
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.remove();
            }
        }, 3000);
    }
}

// 全域變數
let app;

// 頁面載入完成後初始化
document.addEventListener('DOMContentLoaded', () => {
    app = new TodoApp();
});

// 觸控手勢支援
let startX = 0;
let startY = 0;

document.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
});

document.addEventListener('touchend', (e) => {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    
    const diffX = startX - endX;
    const diffY = startY - endY;
    
    // 水平滑動切換標籤
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        const tabs = ['today', 'week', 'all', 'overdue'];
        const currentIndex = tabs.indexOf(app.currentFilter);
        
        if (diffX > 0 && currentIndex < tabs.length - 1) {
            // 向左滑動，下一個標籤
            app.switchTab(tabs[currentIndex + 1]);
        } else if (diffX < 0 && currentIndex > 0) {
            // 向右滑動，上一個標籤
            app.switchTab(tabs[currentIndex - 1]);
        }
    }
});

// 鍵盤快捷鍵支援
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case '1':
                e.preventDefault();
                app.switchTab('today');
                break;
            case '2':
                e.preventDefault();
                app.switchTab('week');
                break;
            case '3':
                e.preventDefault();
                app.switchTab('all');
                break;
            case '4':
                e.preventDefault();
                app.switchTab('overdue');
                break;
        }
    }
});

// Service Worker 註冊
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(registration => console.log('ServiceWorker registered'))
        .catch(error => console.log('ServiceWorker registration failed'));
}
