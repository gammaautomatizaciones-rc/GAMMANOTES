let currentCategoryIndex = null;
let currentSearch = '';
let currentFilter = 'all';

function logLocalStorage() {
    console.log('=== LOCAL STORAGE CONTENTS (SORTED) ===');
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
        keys.push(localStorage.key(i));
    }
    keys.sort();
    keys.forEach(key => {
        const value = localStorage.getItem(key);
        console.log(`${key}: ${value}`);
    });
    console.log('=== END LOCAL STORAGE ===');
}

document.addEventListener('DOMContentLoaded', function() {
    logLocalStorage();
    localStorage.setItem('AG_accessGranted', 'true');
    loadData();
    document.getElementById('add-category-form').addEventListener('submit', addCategory);
    document.getElementById('search-input').addEventListener('input', updateSearch);
    document.getElementById('filter-select').addEventListener('change', updateFilter);
    document.getElementById('import-input').addEventListener('change', importData);
});

function loadData() {
    const data = JSON.parse(localStorage.getItem('AG_tasks')) || { categories: [] };
    renderSidebar(data.categories);
    renderMain(data.categories);
    renderStats(data.categories);
}

function saveData(data) {
    localStorage.setItem('AG_tasks', JSON.stringify(data));
    logLocalStorage();
}

function addCategory(event) {
    event.preventDefault();
    const input = document.getElementById('category-input');
    const name = input.value.trim().toUpperCase();
    if (name) {
        const data = JSON.parse(localStorage.getItem('AG_tasks')) || { categories: [] };
        data.categories.push({ name: name, tasks: [] });
        saveData(data);
        currentCategoryIndex = data.categories.length - 1;
        renderSidebar(data.categories);
        renderMain(data.categories);
        renderStats(data.categories);
        input.value = '';
        input.focus();
    }
}

function addTask(categoryIndex) {
    const input = document.querySelector('.task-input');
    const text = input.value.trim().toUpperCase();
    if (text) {
        const data = JSON.parse(localStorage.getItem('AG_tasks')) || { categories: [] };
        data.categories[categoryIndex].tasks.push({ text: text, status: 'Pendiente' });
        saveData(data);
        renderSidebar(data.categories);
        renderMain(data.categories);
        setTimeout(() => {
            const input = document.querySelector('.task-input');
            input.value = '';
            input.focus();
        }, 0);
        input.focus();
    }
}

function changeStatus(categoryIndex, taskIndex, status) {
    const data = JSON.parse(localStorage.getItem('AG_tasks')) || { categories: [] };
    data.categories[categoryIndex].tasks[taskIndex].status = status;
    saveData(data);
    renderSidebar(data.categories);
    renderMain(data.categories);
    renderStats(data.categories);
}

function deleteCategory(index) {
    if (confirm('¿Eliminar esta categoría y todas sus tareas?')) {
        const data = JSON.parse(localStorage.getItem('AG_tasks')) || { categories: [] };
        data.categories.splice(index, 1);
        if (currentCategoryIndex === index) currentCategoryIndex = null;
        else if (currentCategoryIndex > index) currentCategoryIndex--;
        saveData(data);
        renderSidebar(data.categories);
        renderMain(data.categories);
        renderStats(data.categories);
    }
}

function deleteTask(categoryIndex, taskIndex) {
    const data = JSON.parse(localStorage.getItem('AG_tasks')) || { categories: [] };
    data.categories[categoryIndex].tasks.splice(taskIndex, 1);
    saveData(data);
    renderSidebar(data.categories);
    renderMain(data.categories);
    renderStats(data.categories);
}

function toggleCategory(index) {
    const category = document.querySelector(`#category-${index}`);
    category.classList.toggle('collapsed');
}

function updateSearch() {
    currentSearch = document.getElementById('search-input').value.toLowerCase();
    const data = JSON.parse(localStorage.getItem('AG_tasks')) || { categories: [] };
    renderMain(data.categories);
}

function updateFilter() {
    currentFilter = document.getElementById('filter-select').value;
    const data = JSON.parse(localStorage.getItem('AG_tasks')) || { categories: [] };
    renderMain(data.categories);
}

function editCat(el, index) {
    editCategory(index, el.innerText.toUpperCase());
}

function editTaskEl(el, categoryIndex, taskIndex) {
    editTask(categoryIndex, taskIndex, el.innerText.toUpperCase());
}

function clearCompleted() {
    const data = JSON.parse(localStorage.getItem('AG_tasks')) || { categories: [] };
    data.categories.forEach(cat => {
        cat.tasks = cat.tasks.filter(task => task.status !== 'Completada');
    });
    saveData(data);
    renderSidebar(data.categories);
    renderMain(data.categories);
    renderStats(data.categories);
}

function exportData() {
    const data = localStorage.getItem('AG_tasks') || '{"categories":[]}';
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tasks.json';
    a.click();
    URL.revokeObjectURL(url);
}

function exportToJSON() {
    return localStorage.getItem('AG_tasks') || '{"categories":[]}';
}

function importFromJSON(json) {
    try {
        const data = JSON.parse(json);
        localStorage.setItem('AG_tasks', JSON.stringify(data));
        currentCategoryIndex = null;
        renderSidebar(data.categories);
        renderMain(data.categories);
        renderStats(data.categories);
        logLocalStorage();
    } catch (err) {
        alert('Error al importar: JSON inválido');
    }
}

function importData(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                localStorage.setItem('AG_tasks', JSON.stringify(data));
                currentCategoryIndex = null;
                renderSidebar(data.categories);
                renderMain(data.categories);
                renderStats(data.categories);
                logLocalStorage();
            } catch (err) {
                alert('Error al importar: archivo inválido');
            }
        };
        reader.readAsText(file);
    }
}

function renderStats(categories) {
    let totalTasks = 0, completedTasks = 0, pendingTasks = 0, inProgressTasks = 0;
    categories.forEach(cat => {
        cat.tasks.forEach(task => {
            totalTasks++;
            if (task.status === 'Completada') completedTasks++;
            else if (task.status === 'Pendiente') pendingTasks++;
            else inProgressTasks++;
        });
    });
    const statsDiv = document.getElementById('stats');
    statsDiv.innerHTML = `
        <div class="stats-container">
            <span>📊 Total: ${totalTasks}</span>
            <span>⏳ Pendientes: ${pendingTasks}</span>
            <span>🔄 En Progreso: ${inProgressTasks}</span>
            <span>✅ Completadas: ${completedTasks}</span>
        </div>
    `;
}

function renderSidebar(categories) {
    const list = document.getElementById('category-list');
    list.innerHTML = '';
    categories.forEach((category, index) => {
        const li = document.createElement('li');
        li.className = `category-item ${currentCategoryIndex === index ? 'active' : ''}`;
        li.innerHTML = `
            <span>${category.name}</span>
            <button onclick="event.stopPropagation(); deleteCategory(${index})">🗑️</button>
        `;
        li.onclick = () => selectCategory(index);
        list.appendChild(li);
    });
}

function renderMain(categories) {
    const content = document.getElementById('category-content');
    if (currentCategoryIndex === null || !categories[currentCategoryIndex]) {
        content.innerHTML = '<p>Selecciona una categoría del sidebar para ver sus tareas.</p>';
        return;
    }
    const category = categories[currentCategoryIndex];
    let statusCounts = { 'Pendiente': 0, 'En Progreso': 0, 'Completada': 0 };
    category.tasks.forEach(task => statusCounts[task.status]++);
    let predominant = Object.keys(statusCounts).reduce((a, b) => statusCounts[a] > statusCounts[b] ? a : b);
    let classSuffix = predominant === 'Pendiente' ? 'pending' : predominant === 'En Progreso' ? 'in-progress' : 'completed';
    let taskItems = category.tasks.map((task, taskIndex) => {
        const matchesSearch = task.text.toLowerCase().includes(currentSearch);
        const matchesFilter = currentFilter === 'all' || task.status === currentFilter;
        if (matchesSearch && matchesFilter) {
            return `<li class="task ${task.status === 'Pendiente' ? 'pending' : task.status === 'En Progreso' ? 'in-progress' : 'completed'}">
                        <span contenteditable="true" onblur="editTaskEl(this, ${currentCategoryIndex}, ${taskIndex})" onkeydown="if(event.key==='Enter'){event.preventDefault(); this.blur();}">${task.text}</span>
                        <div class="task-actions">
                            <div class="status-buttons">
                                <button class="status-btn pending-btn ${task.status === 'Pendiente' ? 'active' : ''}" onclick="changeStatus(${currentCategoryIndex}, ${taskIndex}, 'Pendiente')">⏳ Pendiente</button>
                                <button class="status-btn in-progress-btn ${task.status === 'En Progreso' ? 'active' : ''}" onclick="changeStatus(${currentCategoryIndex}, ${taskIndex}, 'En Progreso')">🔄 En Progreso</button>
                                <button class="status-btn completed-btn ${task.status === 'Completada' ? 'active' : ''}" onclick="changeStatus(${currentCategoryIndex}, ${taskIndex}, 'Completada')">✅ Completada</button>
                            </div>
                            <button onclick="deleteTask(${currentCategoryIndex}, ${taskIndex})">❌</button>
                        </div>
                    </li>`;
        } else {
            return '';
        }
    }).join('');
    content.innerHTML = `
        <div class="category-main">
            <div class="category-header">
                <h2 contenteditable="true" onblur="editCat(this, ${currentCategoryIndex})" onkeydown="if(event.key==='Enter'){event.preventDefault(); this.blur();}">${category.name}</h2>
                <div class="category-actions">
                    <button onclick="clearCompleted()">🗑️ Limpiar Completadas</button>
                    <button onclick="exportData()">📤 Exportar</button>
                    <button onclick="document.getElementById('import-input').click()">📥 Importar</button>
                </div>
            </div>
            <div class="add-task">
                <input type="text" class="task-input" placeholder="Nueva tarea" onkeydown="if(event.key==='Enter'){event.preventDefault(); addTask(${currentCategoryIndex});}">
                <button onclick="addTask(${currentCategoryIndex})">➕ Agregar Tarea</button>
            </div>
            <ul>
                ${taskItems}
            </ul>
        </div>
    `;
}

function selectCategory(index) {
    currentCategoryIndex = index;
    const data = JSON.parse(localStorage.getItem('AG_tasks')) || { categories: [] };
    renderSidebar(data.categories);
    renderMain(data.categories);
}