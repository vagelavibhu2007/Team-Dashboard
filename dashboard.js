// Campus Event & Volunteer Management Dashboard
const API_BASE_URL = 'http://localhost:3001/api';

// Global state
let currentUser = null;
let authToken = null;

// DOM Elements
const $ = (id) => document.getElementById(id);

// Role definitions
const ROLES = {
    SUPER_ADMIN: "Super Admin",
    ADMIN: "Admin", 
    FACULTY_COORDINATOR: "Faculty Coordinator",
    CLUB_COORDINATOR: "Club Coordinator",
    TEAM_LEADER: "Team Leader",
    VOLUNTEER: "Volunteer",
    CAMPUS_AMBASSADOR: "Campus Ambassador",
};

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    // Set footer year
    const footerYear = document.getElementById('footer-year');
    if (footerYear) {
        footerYear.textContent = new Date().getFullYear();
    }
    
    // Check for existing session
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');
    
    if (savedToken && savedUser) {
        authToken = savedToken;
        currentUser = JSON.parse(savedUser);
        await showDashboard();
    } else {
        showLogin();
    }
    
    // Setup event listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Login form
    $('user-role').addEventListener('change', handleRoleChange);
    $('login-btn').addEventListener('click', handleLogin);
    
    // Navigation
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('nav-item')) {
            const target = e.target.dataset.target;
            if (target) {
                setActiveModule(target);
            }
        }
    });
    
    // Module forms
    const taskForm = $('task-form');
    if (taskForm) {
        taskForm.addEventListener('submit', handleTaskSubmit);
    }
    
    const eventForm = $('event-form');
    if (eventForm) {
        eventForm.addEventListener('submit', handleEventSubmit);
    }
    
    // Refresh buttons
    const refreshBtn = $('refresh-members-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadTeamMembers);
    }
}

function handleRoleChange() {
    const role = $('user-role').value;
    const teamSelection = $('team-selection');
    
    if (role === "Team Leader" || role === "Volunteer") {
        teamSelection.classList.remove('hidden');
        teamSelection.classList.add('visible');
    } else {
        teamSelection.classList.add('hidden');
        teamSelection.classList.remove('visible');
    }
}

async function handleLogin() {
    console.log('Login button clicked');
    
    const name = $('user-name').value.trim();
    const role = $('user-role').value;
    const teamId = role === "Team Leader" || role === "Volunteer" ? $('user-team').value : null;
    
    console.log('Login data:', { name, role, teamId });
    
    if (!name || !role) {
        alert("Please fill in all required fields");
        return;
    }
    
    if ((role === "Team Leader" || role === "Volunteer") && !teamId) {
        alert("Please select a team");
        return;
    }
    
    try {
        console.log('Sending login request to:', `${API_BASE_URL}/auth/login`);
        
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, role, teamId })
        });
        
        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success) {
            authToken = data.token;
            currentUser = data.user;
            
            console.log('Login successful, user:', currentUser);
            
            // Save to localStorage
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            await showDashboard();
        } else {
            console.error('Login failed:', data.error);
            alert('Login failed: ' + data.error);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed: ' + error.message);
    }
}

async function showDashboard() {
    console.log('Showing dashboard for user:', currentUser);
    
    $('login-section').setAttribute('hidden', 'true');
    $('dashboard-section').removeAttribute('hidden');
    
    // Show role-specific modules
    showRoleModules();
    
    // Load dashboard data
    await loadDashboardStats();
    await loadTasks();
    await loadEvents();
    
    if (currentUser.role === ROLES.TEAM_LEADER) {
        await loadTeamMembers();
    }
    
    // Set first module as active
    const firstModule = getFirstAvailableModule();
    if (firstModule) {
        setActiveModule(firstModule);
    }
    
    // Update user area
    updateUserArea();
    
    console.log('Dashboard loaded successfully');
}

function showLogin() {
    $('login-section').removeAttribute('hidden');
    $('dashboard-section').setAttribute('hidden', 'true');
}

function showRoleModules() {
    // Hide all role modules
    document.querySelectorAll('.role-modules').forEach(module => {
        module.setAttribute('hidden', 'true');
    });
    
    // Show appropriate module based on role
    let roleClass = '';
    switch (currentUser.role) {
        case ROLES.SUPER_ADMIN:
            roleClass = 'super-admin-only';
            break;
        case ROLES.ADMIN:
            roleClass = 'admin-only';
            break;
        case ROLES.FACULTY_COORDINATOR:
            roleClass = 'faculty-coordinator-only';
            break;
        case ROLES.CLUB_COORDINATOR:
            roleClass = 'club-coordinator-only';
            break;
        case ROLES.TEAM_LEADER:
            roleClass = 'team-leader-only';
            break;
        case ROLES.VOLUNTEER:
            roleClass = 'volunteer-only';
            break;
        case ROLES.CAMPUS_AMBASSADOR:
            roleClass = 'campus-ambassador-only';
            break;
    }
    
    const roleModule = document.querySelector(`.role-modules.${roleClass}`);
    if (roleModule) {
        roleModule.removeAttribute('hidden');
    }
}

function getFirstAvailableModule() {
    const modules = document.querySelectorAll('.nav-item');
    return modules.length > 0 ? modules[0].dataset.target : 'overview-module';
}

function setActiveModule(moduleId) {
    // Hide all modules
    document.querySelectorAll('.module').forEach(module => {
        module.setAttribute('hidden', 'true');
    });
    
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected module
    const selectedModule = $(moduleId);
    if (selectedModule) {
        selectedModule.removeAttribute('hidden');
    }
    
    // Add active class to selected nav item
    const activeNavItem = document.querySelector(`[data-target="${moduleId}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }
}

function updateUserArea() {
    const userArea = $('user-area');
    if (userArea && currentUser) {
        userArea.innerHTML = `
            <div class="user-profile">
                <span class="user-name">${currentUser.name}</span>
                <span class="user-role">${currentUser.role}</span>
                ${currentUser.teamName ? `<span class="user-team">${currentUser.teamName}</span>` : ''}
                <button class="btn ghost" onclick="logout()">Logout</button>
            </div>
        `;
    }
}

async function loadDashboardStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            updateStatsDisplay(data.stats);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function updateStatsDisplay(stats) {
    const totalEventsEl = $('stat-total-events');
    const totalTasksEl = $('stat-total-tasks');
    const teamMembersEl = $('stat-team-members');
    
    if (totalEventsEl) {
        totalEventsEl.textContent = stats.totalEvents || 0;
    }
    
    if (totalTasksEl) {
        totalTasksEl.textContent = stats.totalTasks || stats.myTasks || 0;
    }
    
    if (teamMembersEl) {
        teamMembersEl.textContent = stats.teamMembers || 0;
    }
}

async function loadTasks() {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayTasks(data.tasks);
            populateTaskAssignees(data.tasks);
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
}

function displayTasks(tasks) {
    const tasksList = $('tasks-list');
    if (!tasksList) return;
    
    if (tasks.length === 0) {
        tasksList.innerHTML = '<p class="muted">No tasks found</p>';
        return;
    }
    
    tasksList.innerHTML = tasks.map(task => `
        <div class="task-card">
            <h4>${task.title}</h4>
            <p>${task.description || 'No description'}</p>
            <div class="task-meta">
                <span class="task-status status-${task.status}">${task.status.replace('_', ' ')}</span>
                <span class="task-priority priority-${task.priority}">${task.priority}</span>
                ${task.deadline ? `<span class="task-deadline">Due: ${new Date(task.deadline).toLocaleDateString()}</span>` : ''}
            </div>
            ${task.assignedTo ? `
                <div class="task-assignee">
                    Assigned to: ${task.assignedTo.name}
                </div>
            ` : ''}
            <div class="task-actions">
                ${currentUser.role === ROLES.TEAM_LEADER || currentUser.role === ROLES.ADMIN ? 
                    `<button class="btn small" onclick="updateTaskStatus('${task._id}', 'completed')">Mark Complete</button>` : 
                    `<button class="btn small" onclick="updateTaskStatus('${task._id}', 'in_progress')">Start Task</button>`
                }
            </div>
        </div>
    `).join('');
}

function populateTaskAssignees(tasks) {
    const assigneeSelect = $('task-assignee');
    if (!assigneeSelect) return;
    
    // Get unique team members
    const teamMembers = [...new Set(tasks
        .filter(task => task.assignedTo)
        .map(task => JSON.stringify(task.assignedTo))
    )].map(str => JSON.parse(str));
    
    assigneeSelect.innerHTML = '<option value="">Select assignee</option>' +
        teamMembers.map(member => `
            <option value="${member._id}">${member.name}</option>
        `).join('');
}

async function handleTaskSubmit(e) {
    e.preventDefault();
    
    const taskData = {
        title: $('task-title').value,
        description: $('task-description').value,
        assignedTo: $('task-assignee').value,
        teamId: currentUser.teamId,
        priority: $('task-priority').value,
        deadline: $('task-deadline').value
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(taskData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Task created successfully!');
            $('task-form').reset();
            await loadTasks();
            await loadDashboardStats();
        } else {
            alert('Failed to create task: ' + data.error);
        }
    } catch (error) {
        console.error('Error creating task:', error);
        alert('Failed to create task: ' + error.message);
    }
}

async function updateTaskStatus(taskId, status) {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ status })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Task status updated!');
            await loadTasks();
            await loadDashboardStats();
        } else {
            alert('Failed to update task: ' + data.error);
        }
    } catch (error) {
        console.error('Error updating task:', error);
        alert('Failed to update task: ' + error.message);
    }
}

async function loadEvents() {
    try {
        const response = await fetch(`${API_BASE_URL}/events`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayEvents(data.events);
        }
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

function displayEvents(events) {
    const eventsList = $('events-list');
    if (!eventsList) return;
    
    if (events.length === 0) {
        eventsList.innerHTML = '<p class="muted">No events found</p>';
        return;
    }
    
    eventsList.innerHTML = events.map(event => `
        <div class="event-card">
            <h4>${event.title}</h4>
            <p>${event.description}</p>
            <div class="event-meta">
                <span>📅 ${new Date(event.date).toLocaleDateString()}</span>
                <span>📍 ${event.location}</span>
                <span>👥 Limit: ${event.limit}</span>
                <span>💰 ₹${event.price}</span>
            </div>
            <div class="event-status status-${event.status}">${event.status}</div>
        </div>
    `).join('');
}

async function handleEventSubmit(e) {
    e.preventDefault();
    
    const eventData = {
        title: $('event-title').value,
        description: $('event-description').value,
        date: $('event-date').value,
        location: $('event-location').value,
        limit: parseInt($('event-limit').value),
        price: parseFloat($('event-price').value) || 0
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(eventData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Event created successfully!');
            $('event-form').reset();
            await loadEvents();
            await loadDashboardStats();
        } else {
            alert('Failed to create event: ' + data.error);
        }
    } catch (error) {
        console.error('Error creating event:', error);
        alert('Failed to create event: ' + error.message);
    }
}

async function loadTeamMembers() {
    try {
        const response = await fetch(`${API_BASE_URL}/teams/${currentUser.teamId}/members`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayTeamMembers(data.members);
            updateTeamInfo(data.members);
        }
    } catch (error) {
        console.error('Error loading team members:', error);
    }
}

function displayTeamMembers(members) {
    const membersList = $('members-list');
    if (!membersList) return;
    
    if (members.length === 0) {
        membersList.innerHTML = '<p class="muted">No team members found</p>';
        return;
    }
    
    membersList.innerHTML = members.map(member => `
        <div class="volunteer-card">
            <h4>${member.name}</h4>
            <div class="volunteer-info">
                <span>📧 ${member.email}</span>
                <span>📱 ${member.phone || 'Not provided'}</span>
                <span>🎭 ${member.role}</span>
            </div>
            ${member.skills && member.skills.length > 0 ? `
                <div class="volunteer-skills">
                    ${member.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                </div>
            ` : ''}
        </div>
    `).join('');
}

function updateTeamInfo(members) {
    const teamNameEl = $('current-team-name');
    const memberCountEl = $('member-count');
    
    if (teamNameEl) {
        teamNameEl.textContent = currentUser.teamName || 'Unknown Team';
    }
    
    if (memberCountEl) {
        memberCountEl.textContent = members.length;
    }
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    authToken = null;
    currentUser = null;
    showLogin();
}
