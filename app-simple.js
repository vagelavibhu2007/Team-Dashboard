// Simple Campus Event & Volunteer Management Dashboard
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
    console.log('App initialized');
    
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
    console.log('Setting up event listeners');
    
    // Login form
    const roleSelect = $('user-role');
    const loginBtn = $('login-btn');
    
    if (roleSelect) {
        roleSelect.addEventListener('change', handleRoleChange);
        console.log('Role change listener attached');
    }
    
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
        console.log('Login button listener attached');
    }
    
    // Navigation
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('nav-item')) {
            const target = e.target.dataset.target;
            if (target) {
                setActiveModule(target);
            }
        }
    });
}

function handleRoleChange() {
    console.log('Role changed');
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
    console.log('Login button clicked!');
    
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
        // For demo purposes, create user without backend call
        console.log('Creating user locally...');
        
        currentUser = {
            id: 'user_' + Date.now(),
            name: name,
            email: `${name.toLowerCase().replace(/\s+/g, '.')}@campus.edu`,
            role: role,
            teamId: teamId,
            teamName: getTeamName(teamId),
            createdAt: new Date().toISOString()
        };
        
        authToken = 'demo_token_' + Date.now();
        
        console.log('User created:', currentUser);
        
        // Save to localStorage
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        await showDashboard();
        
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed: ' + error.message);
    }
}

function getTeamName(teamId) {
    const teams = {
        'tech-team': 'Tech Team',
        'marketing-team': 'Marketing Team',
        'sponsorship-team': 'Sponsorship Team',
        'graphic-team': 'Graphic Team',
        'decoration-team': 'Decoration Team',
        'production-team': 'Production Team',
        'media-team': 'Media Team',
        'pr-team': 'PR Team',
        'content-team': 'Content Team'
    };
    return teams[teamId] || null;
}

async function showDashboard() {
    console.log('Showing dashboard for:', currentUser);
    
    const loginSection = $('login-section');
    const dashboardSection = $('dashboard-section');
    
    if (loginSection) loginSection.setAttribute('hidden', 'true');
    if (dashboardSection) dashboardSection.removeAttribute('hidden');
    
    // Show role-specific modules
    showRoleModules();
    
    // Update user area
    updateUserArea();
    
    // Set first module as active
    const firstModule = getFirstAvailableModule();
    if (firstModule) {
        setActiveModule(firstModule);
    }
    
    console.log('Dashboard loaded successfully for role:', currentUser.role);
}

function showLogin() {
    console.log('Showing login');
    const loginSection = $('login-section');
    const dashboardSection = $('dashboard-section');
    
    if (loginSection) loginSection.removeAttribute('hidden');
    if (dashboardSection) dashboardSection.setAttribute('hidden', 'true');
}

function showRoleModules() {
    console.log('Showing modules for role:', currentUser.role);
    
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
        console.log('Showing role module:', roleClass);
    } else {
        console.log('Role module not found:', roleClass);
    }
}

function getFirstAvailableModule() {
    const modules = document.querySelectorAll('.nav-item');
    return modules.length > 0 ? modules[0].dataset.target : 'overview-module';
}

function setActiveModule(moduleId) {
    console.log('Setting active module:', moduleId);
    
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

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    authToken = null;
    currentUser = null;
    showLogin();
}
