class TodoApp {
    constructor() {
        try {
            const storedTodos = localStorage.getItem('todos');
            console.log('從localStorage讀取的原始數據:', storedTodos);
            
            if (storedTodos) {
                this.todos = JSON.parse(storedTodos);
                console.log('解析後的待辦事項:', this.todos);
            } else {
                this.todos = [];
                console.log('localStorage中沒有數據，初始化為空陣列');
            }
        } catch (error) {
            console.error('讀取localStorage時發生錯誤:', error);
            this.todos = [];
        }
        
        this.currentFilter = 'today';
        this.editingId = null;
        
        console.log('初始化完成，待辦事項數量:', this.todos.length);
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
        console.log('找到的標籤按鈕數量:', tabButtons.length);
        
        tabButtons.forEach((btn, index) => {
            console.log(`標籤按鈕 ${index}:`, btn.textContent, 'data-filter:', btn.dataset.filter);
            btn.addEventListener('click', (e) => {
                console.log('標籤按鈕被點擊:', e.target.textContent, 'filter:', e.target.dataset.filter);
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

        console.log('準備新增待辦事項:', todo);
        console.log('新增前的待辦事項數量:', this.todos.length);

        this.todos.push(todo);
        console.log('新增後的待辦事項數量:', this.todos.length);
        console.log('所有待辦事項:', this.todos);

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
        if (!this.editingId) return;
        
        const text = document.getElementById('editInput').value.trim();
        const date = document.getElementById('editDate').value;
        const color = document.getElementById('editColor').value;
        
        if (!text || !date) {
            alert('請輸入待辦事項和選擇日期！');
            return;
        }

        const todo = this.todos.find(t => t.id === this.editingId);
        if (todo) {
            todo.text = text;
            todo.date = date;
            todo.color = color;
            todo.updatedAt = new Date().toISOString();
            
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
        console.log('切換到標籤:', filter);
        this.currentFilter = filter;
        
        // 更新標籤狀態
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const targetBtn = document.querySelector(`[data-filter="${filter}"]`);
        if (targetBtn) {
            targetBtn.classList.add('active');
            console.log('標籤狀態已更新');
        } else {
            console.error('找不到目標標籤按鈕:', filter);
        }
        
        this.renderTodos();
    }

    getFilteredTodos() {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        // 計算本週的開始日期（週日為開始）
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        weekStart.setHours(0, 0, 0, 0);
        
        // 計算本週的結束日期（週六為結束）
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        
        console.log('本週開始日期:', weekStart.toISOString());
        console.log('本週結束日期:', weekEnd.toISOString());
        console.log('今天日期:', today.toISOString());
        
        switch (this.currentFilter) {
            case 'today':
                return this.todos.filter(todo => todo.date === todayStr);
            case 'week':
                return this.todos.filter(todo => {
                    const todoDate = new Date(todo.date);
                    todoDate.setHours(12, 0, 0, 0); // 設定為中午12點，避免時區問題
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
        
        console.log('=== renderTodos 調用 ===');
        console.log('當前過濾器:', this.currentFilter);
        console.log('所有待辦事項數量:', this.todos.length);
        console.log('所有待辦事項:', this.todos);
        console.log('過濾後的待辦事項數量:', filteredTodos.length);
        console.log('過濾後的待辦事項:', filteredTodos);
        console.log('todoList元素:', todoList);
        
        if (filteredTodos.length === 0) {
            console.log('沒有待辦事項，顯示空狀態');
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
        console.log('排序後的待辦事項:', filteredTodos);
        
        const htmlContent = filteredTodos.map(todo => this.renderTodoItem(todo)).join('');
        console.log('生成的HTML內容長度:', htmlContent.length);
        console.log('HTML內容預覽:', htmlContent.substring(0, 200) + '...');
        
        todoList.innerHTML = htmlContent;
        console.log('HTML已設置到DOM');
        
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
        const isOverdue = new Date(todo.date) < new Date() && !todo.completed;
        const overdueClass = isOverdue ? 'overdue' : '';
        const completedClass = todo.completed ? 'completed' : '';
        
        const dateObj = new Date(todo.date);
        const formattedDate = this.formatDate(dateObj);
        
        return `
            <div class="todo-item ${overdueClass} ${completedClass}" data-id="${todo.id}">
                <div class="todo-header">
                    <span class="todo-date">📅 ${formattedDate}</span>
                    <div class="todo-actions">
                        <button class="action-btn edit-btn" onclick="todoApp.editTodo(${todo.id})">
                            ✏️ 編輯
                        </button>
                        <button class="action-btn delete-btn" onclick="todoApp.deleteTodo(${todo.id})">
                            🗑️ 刪除
                        </button>
                        <button class="action-btn complete-btn" onclick="todoApp.toggleComplete(${todo.id})">
                            ${todo.completed ? '↩️ 取消完成' : '✅ 完成'}
                        </button>
                    </div>
                </div>
                <div class="todo-text" style="color: ${todo.color}">
                    ${todo.text}
                </div>
                ${isOverdue ? '<span class="todo-priority priority-high">⚠️ 已過期</span>' : ''}
            </div>
        `;
    }

    formatDate(date) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (date.toDateString() === today.toDateString()) {
            return '今天';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return '明天';
        } else {
            const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
            return `${date.getMonth() + 1}月${date.getDate()}日 (週${weekdays[date.getDay()]})`;
        }
    }

    bindTodoEvents() {
        // 這裡可以添加更多的事件綁定
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(todo => todo.completed).length;
        const pending = total - completed;
        const maxTodos = 100;
        
        document.getElementById('totalCount').textContent = `${total}/${maxTodos}`;
        document.getElementById('completedCount').textContent = completed;
        document.getElementById('pendingCount').textContent = pending;
        
        // 更新進度條
        this.updateProgressBar(total, maxTodos);
        
        // 更新記事限制信息
        this.updateTodoLimitInfo(total, maxTodos);
    }
    
    updateProgressBar(current, max) {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        if (!progressFill || !progressText) return;
        
        const percentage = Math.min((current / max) * 100, 100);
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = `${Math.round(percentage)}% (${current}/${max})`;
        
        // 根據百分比改變顏色
        if (percentage >= 90) {
            progressFill.style.background = 'linear-gradient(45deg, #f44336, #d32f2f)';
        } else if (percentage >= 70) {
            progressFill.style.background = 'linear-gradient(45deg, #ff9800, #f57c00)';
        } else {
            progressFill.style.background = 'linear-gradient(45deg, #4CAF50, #45a049)';
        }
    }
    
    updateTodoLimitInfo(current, max) {
        const limitInfo = document.getElementById('todoLimitInfo');
        if (!limitInfo) return;
        
        const remaining = max - current;
        
        if (remaining <= 0) {
            limitInfo.textContent = '已達到記事上限！';
            limitInfo.style.color = '#f44336';
        } else if (remaining <= 10) {
            limitInfo.textContent = `還可新增 ${remaining} 則記事 (即將滿載)`;
            limitInfo.style.color = '#ff9800';
        } else {
            limitInfo.textContent = `還可新增 ${remaining} 則記事`;
            limitInfo.style.color = '#2E7D32';
        }
    }

    saveTodos() {
        try {
            const todosJson = JSON.stringify(this.todos);
            console.log('準備儲存到localStorage的數據:', todosJson);
            console.log('數據長度:', todosJson.length);
            
            localStorage.setItem('todos', todosJson);
            
            // 驗證儲存是否成功
            const storedData = localStorage.getItem('todos');
            if (storedData) {
                console.log('儲存成功！驗證數據:', storedData);
                console.log('儲存後的待辦事項數量:', this.todos.length);
            } else {
                console.error('儲存失敗：localStorage中沒有數據');
            }
        } catch (error) {
            console.error('儲存到localStorage時發生錯誤:', error);
            console.error('錯誤詳情:', error.message);
            
            // 嘗試清理localStorage並重新儲存
            try {
                localStorage.removeItem('todos');
                console.log('已清理localStorage，嘗試重新儲存');
                localStorage.setItem('todos', JSON.stringify(this.todos));
            } catch (retryError) {
                console.error('重新儲存也失敗:', retryError);
            }
        }
    }

    showNotification(message, type = 'info') {
        // 創建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            font-size: 1.1rem;
            font-weight: bold;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // 顯示動畫
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // 自動隱藏
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // 匯出功能
    exportTodos() {
        const dataStr = JSON.stringify(this.todos, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `todos_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    // 匯入功能
    importTodos(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedTodos = JSON.parse(e.target.result);
                if (Array.isArray(importedTodos)) {
                    this.todos = importedTodos;
                    this.saveTodos();
                    this.renderTodos();
                    this.updateStats();
                    this.showNotification('待辦事項已匯入！', 'success');
                } else {
                    throw new Error('無效的檔案格式');
                }
            } catch (error) {
                this.showNotification('匯入失敗：無效的檔案格式', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// 初始化應用程式
let todoApp;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM載入完成，初始化應用程式');
    todoApp = new TodoApp();
    
    // 添加匯入/匯出功能按鈕
    const header = document.querySelector('header');
    const exportBtn = document.createElement('button');
    exportBtn.textContent = '📤 匯出';
    exportBtn.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        background: #2196F3;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 1rem;
        font-weight: bold;
    `;
    exportBtn.onclick = () => todoApp.exportTodos();
    
    const importBtn = document.createElement('button');
    importBtn.textContent = '📥 匯入';
    importBtn.style.cssText = `
        position: absolute;
        top: 20px;
        right: 100px;
        background: #FF9800;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 1rem;
        font-weight: bold;
    `;
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    fileInput.onchange = (e) => {
        if (e.target.files.length > 0) {
            todoApp.importTodos(e.target.files[0]);
        }
    };
    
    importBtn.onclick = () => fileInput.click();
    
    header.style.position = 'relative';
    header.appendChild(exportBtn);
    header.appendChild(importBtn);
    document.body.appendChild(fileInput);
    
    console.log('應用程式初始化完成');
});

// 添加觸控手勢支援
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

document.addEventListener('touchend', (e) => {
    if (!touchStartX || !touchStartY) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;
    
    // 水平滑動手勢
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        if (diffX > 0) {
            // 向左滑動 - 切換到下一個標籤
            const tabs = ['today', 'week', 'all', 'overdue'];
            const currentIndex = tabs.indexOf(todoApp.currentFilter);
            const nextIndex = (currentIndex + 1) % tabs.length;
            todoApp.switchTab(tabs[nextIndex]);
        } else {
            // 向右滑動 - 切換到上一個標籤
            const tabs = ['today', 'week', 'all', 'overdue'];
            const currentIndex = tabs.indexOf(todoApp.currentFilter);
            const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
            todoApp.switchTab(tabs[prevIndex]);
        }
    }
    
    touchStartX = 0;
    touchStartY = 0;
});

// 添加鍵盤快捷鍵支援
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 'n':
                e.preventDefault();
                document.getElementById('todoInput').focus();
                break;
            case 's':
                e.preventDefault();
                if (todoApp) todoApp.exportTodos();
                break;
        }
    }
    
    // 數字鍵切換標籤
    if (e.key >= '1' && e.key <= '4') {
        const tabs = ['today', 'week', 'all', 'overdue'];
        const index = parseInt(e.key) - 1;
        if (tabs[index]) {
            todoApp.switchTab(tabs[index]);
        }
    }
});

// 添加離線支援
window.addEventListener('load', () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(registration => console.log('ServiceWorker registered'))
            .catch(error => console.log('ServiceWorker registration failed'));
    }
});
