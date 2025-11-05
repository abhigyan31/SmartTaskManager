// Change this to your actual Render backend URL
const BASE_URL = 'https://smarttaskmanager-1yf8.onrender.com';

// =================== Dashboard Page Scripts =================== //
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('taskForm')) {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const taskList = document.getElementById('taskList');
        const taskForm = document.getElementById('taskForm');
        const taskInput = document.getElementById('taskInput');
        const logoutBtn = document.getElementById('logoutBtn');

        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
        });

        function loadTasks() {
            fetch(`${BASE_URL}/api/tasks`, {
                headers: { 'Authorization': 'Bearer ' + token }
            })
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch tasks');
                return res.json();
            })
            .then(tasks => {
                taskList.innerHTML = '';
                tasks.forEach(task => renderTask(task));
            })
            .catch(() => {
                alert('Error loading tasks. Please login again.');
                localStorage.removeItem('token');
                window.location.href = 'login.html';
            });
        }

        function renderTask(task) {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';

            const span = document.createElement('span');
            span.textContent = task.task;

            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'form-control d-none';
            input.value = task.task;

            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-warning btn-sm mr-2';
            editBtn.textContent = 'Edit';

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-danger btn-sm';
            deleteBtn.textContent = 'Delete';

            li.appendChild(span);
            li.appendChild(input);
            li.appendChild(editBtn);
            li.appendChild(deleteBtn);
            taskList.appendChild(li);

            editBtn.onclick = () => {
                if (editBtn.textContent === 'Edit') {
                    span.classList.add('d-none');
                    input.classList.remove('d-none');
                    input.focus();
                    editBtn.textContent = 'Save';
                } else {
                    const updatedTask = input.value.trim();
                    if (!updatedTask) {
                        alert('Task cannot be empty');
                        return;
                    }
                    fetch(`${BASE_URL}/api/tasks/${task.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + token
                        },
                        body: JSON.stringify({ task: updatedTask })
                    })
                    .then(res => {
                        if (!res.ok) throw new Error('Failed to update task');
                        return res.json();
                    })
                    .then(() => {
                        span.textContent = updatedTask;
                        span.classList.remove('d-none');
                        input.classList.add('d-none');
                        editBtn.textContent = 'Edit';
                    })
                    .catch(() => alert('Error updating task'));
                }
            };

            deleteBtn.onclick = () => {
                fetch(`${BASE_URL}/api/tasks/${task.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': 'Bearer ' + token }
                })
                .then(res => {
                    if (!res.ok) throw new Error('Failed to delete task');
                    return res.json();
                })
                .then(data => {
                    if (data.message === 'Task deleted') {
                        li.remove();
                    } else {
                        alert('Failed to delete task');
                    }
                })
                .catch(() => alert('Error deleting task'));
            };
        }

        taskForm.addEventListener('submit', e => {
            e.preventDefault();
            const newTask = taskInput.value.trim();
            if (!newTask) return;

            fetch(`${BASE_URL}/api/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ task: newTask })
            })
            .then(res => {
                if (!res.ok) throw new Error('Failed to add task');
                return res.json();
            })
            .then(data => {
                if (data.task) {
                    renderTask(data.task);
                    taskInput.value = '';
                } else {
                    alert('Failed to add task');
                }
            })
            .catch(() => alert('Error adding task'));
        });

        loadTasks();
    }
});

// =================== Login Page Scripts =================== //
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        try {
            const response = await fetch(`${BASE_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (response.ok) {
                alert(data.message);
                localStorage.setItem('token', data.token);
                window.location.href = 'dashboard.html';
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    });
}

// =================== Signup Page Scripts =================== //
if (document.getElementById('signupForm')) {
    document.getElementById('signupForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${BASE_URL}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });
            const data = await response.json();
            if (response.ok) {
                alert(data.message);
                window.location.href = 'login.html';
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    });
}
