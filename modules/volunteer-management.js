// Team Leader Volunteer Management Module
class VolunteerManager {
  constructor() {
    this.teamId = null;
    this.volunteers = [];
    this.tasks = [];
    this.init();
  }

  async init() {
    if (currentUser?.role !== ROLES.TEAM_LEADER) {
      console.log('Volunteer management only available for Team Leaders');
      return;
    }

    await this.loadTeamData();
    this.setupEventListeners();
    this.renderVolunteerManagement();
  }

  async loadTeamData() {
    try {
      // Load team leader's team from backend API
      const teamsResult = await window.GoogleAuthAPI.getTeams(currentUser.id);
      
      if (teamsResult.success && teamsResult.teams.length > 0) {
        this.teamId = teamsResult.teams[0].id;
        
        // Load volunteers for this team from backend API
        const volunteersResult = await window.GoogleAuthAPI.getVolunteers(this.teamId);
        if (volunteersResult.success) {
          this.volunteers = volunteersResult.volunteers;
        }

        // Load tasks for this team from backend API
        const tasksResult = await window.GoogleAuthAPI.getTasks(this.teamId);
        if (tasksResult.success) {
          this.tasks = tasksResult.tasks;
        }
      }
    } catch (error) {
      console.error('Error loading team data:', error);
    }
  }

  setupEventListeners() {
    // Add volunteer button
    const addVolunteerBtn = document.getElementById('add-volunteer-btn');
    if (addVolunteerBtn) {
      addVolunteerBtn.addEventListener('click', () => this.showAddVolunteerModal());
    }

    // Add task button
    const addTaskBtn = document.getElementById('add-task-btn');
    if (addTaskBtn) {
      addTaskBtn.addEventListener('click', () => this.showAddTaskModal());
    }
  }

  renderVolunteerManagement() {
    const container = document.getElementById('volunteer-management-container');
    if (!container) return;

    container.innerHTML = `
      <div class="volunteer-management">
        <div class="section-header">
          <h2>Team Management</h2>
          <div class="header-actions">
            <button class="btn primary" id="add-volunteer-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Add Volunteer
            </button>
            <button class="btn primary" id="add-task-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Assign Task
            </button>
          </div>
        </div>

        <div class="management-grid">
          <!-- Volunteers Section -->
          <div class="card">
            <h3>Team Volunteers</h3>
            <div class="volunteers-list" id="volunteers-list">
              ${this.renderVolunteersList()}
            </div>
          </div>

          <!-- Tasks Section -->
          <div class="card">
            <h3>Assigned Tasks</h3>
            <div class="tasks-list" id="team-tasks-list">
              ${this.renderTasksList()}
            </div>
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  renderVolunteersList() {
    if (this.volunteers.length === 0) {
      return '<p class="muted">No volunteers added yet. Click "Add Volunteer" to get started.</p>';
    }

    return this.volunteers.map(volunteer => `
      <div class="volunteer-card" data-volunteer-id="${volunteer.id}">
        <div class="volunteer-info">
          <div class="volunteer-avatar">${volunteer.name.charAt(0).toUpperCase()}</div>
          <div class="volunteer-details">
            <div class="volunteer-name">${volunteer.name}</div>
            <div class="volunteer-email">${volunteer.email}</div>
            <div class="volunteer-status">
              <span class="status-badge ${volunteer.status}">${volunteer.status || 'Active'}</span>
            </div>
          </div>
        </div>
        <div class="volunteer-actions">
          <button class="btn ghost small" onclick="volunteerManager.assignTask('${volunteer.id}')">
            Assign Task
          </button>
          <button class="btn ghost small" onclick="volunteerManager.editVolunteer('${volunteer.id}')">
            Edit
          </button>
          <button class="btn danger small" onclick="volunteerManager.removeVolunteer('${volunteer.id}')">
            Remove
          </button>
        </div>
      </div>
    `).join('');
  }

  renderTasksList() {
    if (this.tasks.length === 0) {
      return '<p class="muted">No tasks assigned yet. Click "Assign Task" to create tasks.</p>';
    }

    return this.tasks.map(task => `
      <div class="task-card" data-task-id="${task.id}">
        <div class="task-header">
          <h4>${task.title}</h4>
          <span class="status-badge ${task.status}">${task.status}</span>
        </div>
        <div class="task-details">
          <div class="task-assignee">Assigned to: ${task.assigneeName || 'Unassigned'}</div>
          <div class="task-deadline">Due: ${task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}</div>
          <div class="task-description">${task.description || 'No description'}</div>
        </div>
        <div class="task-actions">
          <button class="btn ghost small" onclick="volunteerManager.editTask('${task.id}')">
            Edit
          </button>
          <button class="btn danger small" onclick="volunteerManager.deleteTask('${task.id}')">
            Delete
          </button>
        </div>
      </div>
    `).join('');
  }

  showAddVolunteerModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>Add Volunteer to Team</h3>
          <button class="btn ghost" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <form id="add-volunteer-form" class="form-grid">
          <label>
            Name
            <input type="text" id="volunteer-name" required>
          </label>
          <label>
            Email
            <input type="email" id="volunteer-email" required>
          </label>
          <label>
            Phone
            <input type="tel" id="volunteer-phone">
          </label>
          <label>
            Skills
            <input type="text" id="volunteer-skills" placeholder="e.g., Event Management, First Aid">
          </label>
          <div class="form-actions">
            <button type="button" class="btn ghost" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
            <button type="submit" class="btn primary">Add Volunteer</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#add-volunteer-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.addVolunteer({
        name: modal.querySelector('#volunteer-name').value,
        email: modal.querySelector('#volunteer-email').value,
        phone: modal.querySelector('#volunteer-phone').value,
        skills: modal.querySelector('#volunteer-skills').value,
        teamId: this.teamId,
        status: 'Active'
      });
      modal.remove();
    });
  }

  async addVolunteer(volunteerData) {
    try {
      const result = await window.GoogleAuthAPI.addVolunteer(volunteerData);
      
      if (result.success) {
        this.volunteers.push(result.volunteer);
        this.renderVolunteerManagement();
        this.showNotification('Volunteer added successfully!', 'success');
      } else {
        this.showNotification('Failed to add volunteer: ' + result.error, 'error');
      }
    } catch (error) {
      console.error('Error adding volunteer:', error);
      this.showNotification('Failed to add volunteer', 'error');
    }
  }

  async removeVolunteer(volunteerId) {
    if (!confirm('Are you sure you want to remove this volunteer?')) return;

    try {
      await window.FirebaseDB.helpers.delete('volunteers', volunteerId);
      this.volunteers = this.volunteers.filter(v => v.id !== volunteerId);
      this.renderVolunteerManagement();
      
      this.showNotification('Volunteer removed successfully', 'success');
    } catch (error) {
      console.error('Error removing volunteer:', error);
      this.showNotification('Failed to remove volunteer', 'error');
    }
  }

  showAddTaskModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>Assign Task</h3>
          <button class="btn ghost" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <form id="add-task-form" class="form-grid">
          <label>
            Task Title
            <input type="text" id="task-title" required>
          </label>
          <label>
            Description
            <textarea id="task-description" rows="3"></textarea>
          </label>
          <label>
            Assign to
            <select id="task-assignee" required>
              <option value="">Select volunteer</option>
              ${this.volunteers.map(v => `<option value="${v.id}">${v.name}</option>`).join('')}
            </select>
          </label>
          <label>
            Deadline
            <input type="date" id="task-deadline">
          </label>
          <label>
            Priority
            <select id="task-priority">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <div class="form-actions">
            <button type="button" class="btn ghost" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
            <button type="submit" class="btn primary">Assign Task</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#add-task-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const assigneeId = modal.querySelector('#task-assignee').value;
      const assignee = this.volunteers.find(v => v.id === assigneeId);
      
      await this.addTask({
        title: modal.querySelector('#task-title').value,
        description: modal.querySelector('#task-description').value,
        assigneeId: assigneeId,
        assigneeName: assignee.name,
        teamId: this.teamId,
        deadline: modal.querySelector('#task-deadline').value,
        priority: modal.querySelector('#task-priority').value,
        status: 'todo'
      });
      modal.remove();
    });
  }

  async addTask(taskData) {
    try {
      const result = await window.GoogleAuthAPI.assignTask(taskData);
      
      if (result.success) {
        this.tasks.push(result.task);
        this.renderVolunteerManagement();
        this.showNotification('Task assigned successfully!', 'success');
      } else {
        this.showNotification('Failed to assign task: ' + result.error, 'error');
      }
    } catch (error) {
      console.error('Error adding task:', error);
      this.showNotification('Failed to assign task', 'error');
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;

    if (type === 'success') {
      notification.style.background = '#22c55e';
    } else if (type === 'error') {
      notification.style.background = '#ef4444';
    } else {
      notification.style.background = '#6366f1';
    }

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Initialize when DOM is ready
let volunteerManager;
document.addEventListener('DOMContentLoaded', () => {
  if (currentUser?.role === ROLES.TEAM_LEADER) {
    volunteerManager = new VolunteerManager();
  }
});

// Export for global access
window.VolunteerManager = VolunteerManager;
