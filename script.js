// Global Application State
let appState = {
    currentUser: null,
    sessions: [],
    subjects: ['Matemática', 'Programação', 'Física', 'Química', 'História', 'Inglês'],
    theme: 'light'
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    loadAppState();
    setupAuthentication();
    setupTheme();
    setupNavigation();
    setupSessionManagement();
    setupProgressTracking();
    setupSettings();
});

// Load data from localStorage
function loadAppState() {
    appState.currentUser = JSON.parse(localStorage.getItem('currentUser'));
    appState.sessions = JSON.parse(localStorage.getItem('sessions')) || [];
    appState.theme = localStorage.getItem('theme') || 'light';
    
    // Apply theme
    if (appState.theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

// Authentication System
function setupAuthentication() {
    // Only run on auth pages
    if (!document.getElementById('login-form')) return;

    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authMessage = document.getElementById('auth-message');

    // Tab switching
    loginTab?.addEventListener('click', () => switchAuthTab('login'));
    registerTab?.addEventListener('click', () => switchAuthTab('register'));

    // Form submissions
    registerForm?.addEventListener('submit', handleRegister);
    loginForm?.addEventListener('submit', handleLogin);

    // Redirect if logged in
    if (appState.currentUser && !window.location.pathname.includes('index.html')) {
        window.location.href = 'dashboard.html';
    }
}

function switchAuthTab(tab) {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authMessage = document.getElementById('auth-message');

    if (tab === 'login') {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
    } else {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
    }
    authMessage.classList.add('hidden');
}

function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    if (password.length < 8) {
        showAuthMessage('A senha deve ter pelo menos 8 caracteres');
        return;
    }

    const user = {
        name,
        email,
        password,
        createdAt: new Date().toISOString()
    };

    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('users', JSON.stringify([user]));
    
    showAuthMessage('Registro realizado com sucesso!', 'green');
    setTimeout(() => window.location.href = 'dashboard.html', 1500);
}

function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const storedUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (storedUser?.email === email && storedUser?.password === password) {
        showAuthMessage('Login realizado com sucesso!', 'green');
        setTimeout(() => window.location.href = 'dashboard.html', 1500);
    } else {
        showAuthMessage('Email ou senha incorretos');
    }
}

function showAuthMessage(message, color = 'red') {
    const authMessage = document.getElementById('auth-message');
    authMessage.textContent = message;
    authMessage.classList.remove('hidden', 'text-green-500', 'text-red-500');
    authMessage.classList.add(`text-${color}-500`);
}

// Navigation System
function setupNavigation() {
    // Logout button
    document.getElementById('logout-btn')?.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });

    // Check authentication on protected pages
    if (!window.location.pathname.includes('index.html') && !appState.currentUser) {
        window.location.href = 'index.html';
    }
}

// Session Management
function setupSessionManagement() {
    // Only run on schedule page
    if (!document.getElementById('session-form')) return;

    // Initialize date/time pickers
    flatpickr("#date", {
        dateFormat: "d/m/Y",
        locale: "pt",
        minDate: "today"
    });

    flatpickr("#time", {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true
    });

    // Form submission
    document.getElementById('session-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const subject = document.getElementById('subject').value;
        const customSubject = document.getElementById('custom-subject').value;
        const date = document.getElementById('date').value;
        const time = document.getElementById('time').value;
        const duration = document.getElementById('duration').value;
        const priority = document.querySelector('input[name="priority"]:checked').value;
        const notes = document.getElementById('notes').value;

        const session = {
            id: Date.now(),
            subject,
            displayName: customSubject || appState.subjects.find(s => s.toLowerCase() === subject) || subject,
            date,
            time,
            duration,
            priority,
            notes,
            completed: false,
            createdAt: new Date().toISOString()
        };

        appState.sessions.push(session);
        localStorage.setItem('sessions', JSON.stringify(appState.sessions));

        e.target.reset();
        document.getElementById('date')._flatpickr.clear();
        document.getElementById('time')._flatpickr.clear();

        alert('Sessão agendada com sucesso!');
        renderSessions();
    });

    // Filter controls
    document.getElementById('filter-subject')?.addEventListener('change', renderSessions);
    document.getElementById('filter-status')?.addEventListener('change', renderSessions);

    // Initial render
    renderSessions();
}

function renderSessions() {
    const container = document.getElementById('sessions-list');
    if (!container) return;

    const subjectFilter = document.getElementById('filter-subject')?.value || 'all';
    const statusFilter = document.getElementById('filter-status')?.value || 'all';

    let filteredSessions = [...appState.sessions];

    // Apply filters
    if (subjectFilter !== 'all') {
        filteredSessions = filteredSessions.filter(s => s.subject === subjectFilter);
    }

    if (statusFilter !== 'all') {
        filteredSessions = filteredSessions.filter(s => 
            statusFilter === 'completed' ? s.completed : !s.completed
        );
    }

    // Sort by date/time
    filteredSessions.sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        return dateA - dateB;
    });

    // Render sessions
    if (filteredSessions.length === 0) {
        container.innerHTML = `
            <div class="p-4 border rounded-lg bg-gray-50 text-center text-gray-500">
                <i class="fas fa-calendar-plus text-2xl mb-2"></i>
                <p>Nenhuma sessão encontrada</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredSessions.map(session => `
        <div class="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 ${session.completed ? 'bg-green-50' : ''}">
            <div>
                <h3 class="font-medium">${session.displayName}</h3>
                <p class="text-sm text-gray-600">${session.date} às ${session.time} (${session.duration} min)</p>
                ${session.notes ? `<p class="text-xs text-gray-500 mt-1">${session.notes}</p>` : ''}
            </div>
            <div class="flex space-x-2">
                <button class="complete-btn px-3 py-1 ${session.completed ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-600'} rounded-lg text-sm" data-id="${session.id}">
                    <i class="fas fa-${session.completed ? 'undo' : 'check'} mr-1"></i>${session.completed ? 'Reabrir' : 'Concluir'}
                </button>
                <button class="edit-btn px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm" data-id="${session.id}">
                    <i class="fas fa-edit mr-1"></i>Editar
                </button>
            </div>
        </div>
    `).join('');

    // Add event listeners to buttons
    document.querySelectorAll('.complete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.closest('button').dataset.id);
            const session = appState.sessions.find(s => s.id === id);
            if (session) {
                session.completed = !session.completed;
                localStorage.setItem('sessions', JSON.stringify(appState.sessions));
                renderSessions();
            }
        });
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.closest('button').dataset.id);
            // TODO: Implement edit functionality
            alert('Editar sessão ' + id);
        });
    });
}

// Progress Tracking
function setupProgressTracking() {
    // Only run on progress page
    if (!document.getElementById('weeklyChart')) return;

    // Calculate progress data
    const completedSessions = appState.sessions.filter(s => s.completed).length;
    const totalSessions = appState.sessions.length;
    const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

    // Weekly Progress Chart
    new Chart(document.getElementById('weeklyChart').getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
            datasets: [{
                label: 'Horas Estudadas',
                data: [1.5, 0, 2, 1, 1.5, 0.5, 0],
                backgroundColor: '#3B82F6',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Horas'
                    }
                }
            }
        }
    });

    // Subject Distribution Chart
    new Chart(document.getElementById('subjectChart').getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Matemática', 'Programação', 'Inglês', 'Outros'],
            datasets: [{
                data: [32, 28, 15, 25],
                backgroundColor: [
                    '#3B82F6',
                    '#10B981',
                    '#F59E0B',
                    '#EF4444'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });

    // Monthly Overview Chart
    new Chart(document.getElementById('monthlyChart').getContext('2d'), {
        type: 'line',
        data: {
            labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
            datasets: [{
                label: 'Horas por Semana',
                data: [5, 8, 6, 4],
                borderColor: '#8B5CF6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Horas'
                    }
                }
            }
        }
    });
}

// Settings Management
function setupSettings() {
    // Only run on settings page
    if (!document.getElementById('profile-form')) return;

    // Theme switcher
    document.getElementById('light-theme')?.addEventListener('click', () => {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    });

    document.getElementById('dark-theme')?.addEventListener('click', () => {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    });

    document.getElementById('system-theme')?.addEventListener('click', () => {
        localStorage.removeItem('theme');
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    });

    // Reset data confirmation
    document.getElementById('reset-data')?.addEventListener('click', () => {
        if (confirm('Tem certeza que deseja redefinir todos os seus dados? Esta ação não pode ser desfeita.')) {
            localStorage.removeItem('sessions');
            appState.sessions = [];
            alert('Todos os dados foram redefinidos com sucesso.');
        }
    });

    // Delete account confirmation
    document.getElementById('delete-account')?.addEventListener('click', () => {
        if (confirm('Tem certeza que deseja excluir sua conta permanentemente? Todos os dados serão perdidos.')) {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('users');
            localStorage.removeItem('sessions');
            window.location.href = 'index.html';
        }
    });

    // Profile form submission
    document.getElementById('profile-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        if (appState.currentUser) {
            appState.currentUser.name = document.getElementById('name').value;
            appState.currentUser.email = document.getElementById('email').value;
            localStorage.setItem('currentUser', JSON.stringify(appState.currentUser));
            alert('Perfil atualizado com sucesso!');
        }
    });
}

// Dashboard Updates
function updateDashboard() {
    // Only run on dashboard
    if (!document.getElementById('logout-btn')) return;

    const completedSessions = appState.sessions.filter(s => s.completed).length;
    const totalSessions = appState.sessions.length;
    const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

    // Update progress ring
    const circle = document.querySelector('.progress-ring__circle');
    if (circle) {
        const radius = circle.r.baseVal.value;
        const circumference = radius * 2 * Math.PI;
        circle.style.strokeDasharray = `${circumference} ${circumference}`;
        circle.style.strokeDashoffset = circumference - (completionRate / 100) * circumference;
    }

    // Update progress text
    const progressText = document.querySelector('.progress-percentage');
    if (progressText) {
        progressText.textContent = `${completionRate}%`;
    }

    // Update session count
    const sessionCount = document.querySelector('.session-count');
    if (sessionCount) {
        sessionCount.textContent = `${completedSessions}/${totalSessions}`;
    }
}
