// Campus Event & Volunteer Management System

const ROLES = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin", 
  FACULTY_COORDINATOR: "Faculty Coordinator",
  CLUB_COORDINATOR: "Club Coordinator",
  TEAM_LEADER: "Team Leader",
  VOLUNTEER: "Volunteer",
  CAMPUS_AMBASSADOR: "Campus Ambassador",
};

// Predefined teams
const TEAMS = {
  TECH_TEAM: { id: "tech-team", name: "Tech Team" },
  MARKETING_TEAM: { id: "marketing-team", name: "Marketing Team" },
  SPONSORSHIP_TEAM: { id: "sponsorship-team", name: "Sponsorship Team" },
  GRAPHIC_TEAM: { id: "graphic-team", name: "Graphic Team" },
  DECORATION_TEAM: { id: "decoration-team", name: "Decoration Team" },
  PRODUCTION_TEAM: { id: "production-team", name: "Production Team" },
  MEDIA_TEAM: { id: "media-team", name: "Media Team" },
  PR_TEAM: { id: "pr-team", name: "PR Team" },
  CONTENT_TEAM: { id: "content-team", name: "Content Team" },
};

// Role descriptions and features
const ROLE_DESCRIPTIONS = {
  [ROLES.SUPER_ADMIN]: {
    description: "Full system control",
    features: ["Full system access", "Create/Delete Admins", "Manage permissions", "View all reports"]
  },
  [ROLES.ADMIN]: {
    description: "Event management",
    features: ["Create/Edit/Delete events", "Assign coordinators & team leads", "Approve registrations", "View reports"]
  },
  [ROLES.FACULTY_COORDINATOR]: {
    description: "Academic oversight",
    features: ["View assigned events", "Monitor progress", "Approve requests"]
  },
  [ROLES.CLUB_COORDINATOR]: {
    description: "Club management",
    features: ["Manage club events", "Manage volunteers", "View registrations"]
  },
  [ROLES.TEAM_LEADER]: {
    description: "Team management",
    features: ["View assigned tasks", "Update task status", "Manage team members"]
  },
  [ROLES.VOLUNTEER]: {
    description: "Task execution",
    features: ["View assigned tasks", "Update task progress"]
  },
  [ROLES.CAMPUS_AMBASSADOR]: {
    description: "Campus promotion",
    features: ["Unique referral code", "Track referrals & registrations"]
  },
};

const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: {
    modules: [
      "overview-module",
      "admin-management-module",
      "permissions-module", 
      "events-module",
      "registrations-module",
      "tasks-module",
      "notifications-module",
      "reports-module",
      "logs-module",
    ],
    canManageEvents: true,
    canApproveRegistrations: true,
    canAssignTasks: true,
    canSendAnnouncements: true,
    canViewAllLogs: true,
    canManageAdmins: true,
  },
  [ROLES.ADMIN]: {
    modules: [
      "overview-module",
      "events-module",
      "coordinator-module",
      "registrations-module",
      "reports-module",
      "notifications-module",
    ],
    canManageEvents: true,
    canApproveRegistrations: true,
    canAssignTasks: true,
    canSendAnnouncements: true,
    canViewAllLogs: false,
    canManageAdmins: false,
  },
  [ROLES.FACULTY_COORDINATOR]: {
    modules: [
      "overview-module",
      "assigned-events-module",
      "progress-module",
      "requests-module",
      "notifications-module",
    ],
    canManageEvents: false,
    canApproveRegistrations: true,
    canAssignTasks: false,
    canSendAnnouncements: false,
    canViewAllLogs: false,
    canManageAdmins: false,
  },
  [ROLES.CLUB_COORDINATOR]: {
    modules: [
      "overview-module",
      "club-events-module",
      "volunteers-module",
      "registrations-module",
      "notifications-module",
    ],
    canManageEvents: true,
    canApproveRegistrations: false,
    canAssignTasks: false,
    canSendAnnouncements: true,
    canViewAllLogs: false,
    canManageAdmins: false,
  },
  [ROLES.TEAM_LEADER]: {
    modules: [
      "overview-module",
      "tasks-module",
      "volunteer-management-module",
      "notifications-module",
    ],
    canManageEvents: false,
    canApproveRegistrations: false,
    canAssignTasks: true,
    canSendAnnouncements: false,
    canViewAllLogs: false,
    canManageAdmins: false,
  },
  [ROLES.VOLUNTEER]: {
    modules: [
      "overview-module",
      "my-tasks-module",
      "notifications-module",
    ],
    canManageEvents: false,
    canApproveRegistrations: false,
    canAssignTasks: false,
    canSendAnnouncements: false,
    canViewAllLogs: false,
    canManageAdmins: false,
  },
  [ROLES.CAMPUS_AMBASSADOR]: {
    modules: [
      "overview-module",
      "referral-module",
      "referrals-module",
      "registrations-module",
      "notifications-module",
    ],
    canManageEvents: false,
    canApproveRegistrations: false,
    canAssignTasks: false,
    canSendAnnouncements: false,
    canViewAllLogs: false,
    canManageAdmins: false,
  },
};

// Utility functions
const STORAGE_KEYS = {
  STATE: "eventSuiteState",
  USER: "eventSuiteUser",
};

const state = {
  events: [],
  registrations: [],
  tasks: [],
  notifications: [],
  logs: [],
};

let currentUser = null;
let selectedGoogleAccount = null;
let selectedRole = null;

function $(id) {
  return document.getElementById(id);
}

function rid(prefix = "id") {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getPermissions() {
  if (!currentUser) return null;
  return ROLE_PERMISSIONS[currentUser.role] || null;
}

function safeParseJson(raw, fallback) {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveState() {
  try {
    localStorage.setItem(
      STORAGE_KEYS.STATE,
      JSON.stringify(state)
    );
    if (currentUser) {
      localStorage.setItem(
        STORAGE_KEYS.USER,
        JSON.stringify(currentUser)
      );
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  } catch {
    // localStorage could be blocked/quota reached; ignore for demo
  }
}

function loadState() {
  const loaded = safeParseJson(
    localStorage.getItem(STORAGE_KEYS.STATE),
    null
  );
  if (loaded) {
    state.events = Array.isArray(loaded.events) ? loaded.events : [];
    state.registrations = Array.isArray(loaded.registrations)
      ? loaded.registrations
      : [];
    state.tasks = Array.isArray(loaded.tasks) ? loaded.tasks : [];
    state.notifications = Array.isArray(loaded.notifications)
      ? loaded.notifications
      : [];
    state.logs = Array.isArray(loaded.logs) ? loaded.logs : [];
  }

  const user = safeParseJson(
    localStorage.getItem(STORAGE_KEYS.USER),
    null
  );
  if (user) currentUser = user;
}

function logActivity(action, details) {
  state.logs.unshift({
    id: rid("log"),
    ts: new Date().toISOString(),
    action,
    details: details || "",
    actor: currentUser ? currentUser.name : "System",
    role: currentUser ? currentUser.role : "System",
  });
  if (state.logs.length > 500) state.logs.length = 500;
}

function notify(title, body) {
  state.notifications.unshift({
    id: rid("notif"),
    ts: new Date().toISOString(),
    title,
    body,
    author: currentUser ? currentUser.name : "System",
  });
  if (state.notifications.length > 200) state.notifications.length = 200;
}

function formatDateTime(dt) {
  if (!dt) return "-";
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return String(dt);
  return (
    d.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) +
    " · " +
    d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
}

function formatDate(d) {
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(n) {
  const num = Number(n || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

function setActiveModule(moduleId) {
  document
    .querySelectorAll(".nav-item")
    .forEach((b) => b.classList.remove("active"));
  document
    .querySelectorAll(".module")
    .forEach((m) => m.setAttribute("hidden", "true"));

  const navBtn = document.querySelector(
    `.nav-item[data-target="${moduleId}"]`
  );
  if (navBtn) navBtn.classList.add("active");
  const module = document.getElementById(moduleId);
  if (module) module.removeAttribute("hidden");
}

function renderUserArea() {
  const area = $("user-area");
  area.innerHTML = "";
  if (!currentUser) return;

  const pill = document.createElement("div");
  pill.className = "user-pill";
  pill.innerHTML = `
    <span>${currentUser.name}</span>
    <span class="role">${currentUser.role}</span>
  `;

  const badge = document.createElement("div");
  badge.className = "badge";
  badge.innerHTML = `<span class="badge-dot"></span><span>Active session</span>`;

  const logout = document.createElement("button");
  logout.className = "btn ghost";
  logout.textContent = "Logout";
  logout.addEventListener("click", () => {
    logActivity("logout", "User signed out");
    currentUser = null;
    saveState();
    $("dashboard-section").setAttribute("hidden", "true");
    $("login-section").removeAttribute("hidden");
    $("user-area").innerHTML = "";
  });

  area.appendChild(pill);
  area.appendChild(badge);
  area.appendChild(logout);
}

function renderSidebarPermissions() {
  const perms = getPermissions();
  document.querySelectorAll(".nav-item").forEach((btn) => {
    const moduleId = btn.dataset.target;
    if (!perms || !perms.modules.includes(moduleId)) {
      btn.setAttribute("hidden", "true");
    } else {
      btn.removeAttribute("hidden");
    }
  });
}

function renderAdminUsers() {
  const tbody = $("admin-users-table");
  tbody.innerHTML = "";
  const seen = new Set();
  const allUsers = [
    ...(currentUser ? [currentUser] : []),
    ...DEMO_USERS,
  ].filter((u) => u && u.name && u.role);

  allUsers.forEach((u) => {
    const key = `${u.name}__${u.role}`;
    if (seen.has(key)) return;
    seen.add(key);
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${u.name}</td><td>${u.role}</td>`;
    tbody.appendChild(tr);
  });

  const roleList = $("role-capabilities");
  roleList.innerHTML = "";
  Object.entries(ROLE_PERMISSIONS).forEach(([role, caps]) => {
    const li = document.createElement("li");
    const allowed = Object.entries(caps)
      .filter(([k]) => k !== "modules")
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(", ");
    li.innerHTML = `<strong>${role}</strong>: ${
      allowed || "modules only"
    }`;
    roleList.appendChild(li);
  });
}

function renderOverview() {
  $("stat-total-events").textContent = state.events.length;
  $("stat-total-registrations").textContent =
    state.registrations.length;
  const revenue = state.registrations
    .filter((r) => r.status === "approved")
    .reduce((sum, r) => sum + Number(r.amountPaid || 0), 0);
  $("stat-revenue").textContent = formatCurrency(revenue);

  const list = $("overview-events");
  list.innerHTML = "";
  const sorted = [...state.events].sort(
    (a, b) => new Date(a.datetime) - new Date(b.datetime)
  );
  sorted.slice(0, 6).forEach((ev) => {
    const approved = state.registrations.filter(
      (r) => r.eventId === ev.id && r.status === "approved"
    ).length;
    const li = document.createElement("li");
    li.innerHTML = `
      <div>
        <div>${ev.title}</div>
        <div class="tiny muted">${formatDateTime(
          ev.datetime
        )} • ${ev.location}</div>
      </div>
      <span class="chip ${
        approved >= ev.limit ? "danger" : "success"
      }">${approved}/${ev.limit}</span>
    `;
    list.appendChild(li);
  });

  const ambassadorPanel = $("campus-ambassador-panel");
  if (currentUser?.role === ROLES.CAMPUS_AMBASSADOR) {
    ambassadorPanel.removeAttribute("hidden");
    const code = currentUser.referralCode || "N/A";
    $("referral-code").textContent = code;
    $("referral-count").textContent = state.registrations.filter(
      (r) => r.referralCode === code
    ).length;
  } else {
    ambassadorPanel.setAttribute("hidden", "true");
  }
}

function renderEventsSelect() {
  const select = $("registration-event");
  const keep = select.value;
  select.innerHTML = "";
  state.events.forEach((ev) => {
    const opt = document.createElement("option");
    opt.value = ev.id;
    opt.textContent = `${ev.title} — ${formatDateTime(ev.datetime)}`;
    select.appendChild(opt);
  });
  if (keep) select.value = keep;
}

function renderEventsTable() {
  const tbody = $("events-table-body");
  tbody.innerHTML = "";
  const perms = getPermissions();
  const canManage = !!perms?.canManageEvents;
  const now = Date.now();

  state.events.forEach((ev) => {
    const approved = state.registrations.filter(
      (r) => r.eventId === ev.id && r.status === "approved"
    ).length;
    const isFull = approved >= ev.limit;
    const isPast = new Date(ev.datetime).getTime() < now;
    const status = isPast ? "Completed" : isFull ? "Full" : "Open";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${ev.title}</td>
      <td>${formatDateTime(ev.datetime)}</td>
      <td>${ev.limit}</td>
      <td>${approved}</td>
      <td><span class="status-pill ${
        status === "Full"
          ? "rejected"
          : status === "Completed"
          ? "completed"
          : "approved"
      }">${status}</span></td>
    `;

    const actions = document.createElement("td");
    actions.className = "data-table-actions";

    const edit = document.createElement("button");
    edit.className = "btn ghost";
    edit.textContent = "Edit";
    edit.disabled = !canManage;
    edit.addEventListener("click", () => {
      $("event-id").value = ev.id;
      $("event-title").value = ev.title;
      $("event-datetime").value = ev.datetime;
      $("event-location").value = ev.location;
      $("event-limit").value = String(ev.limit);
      $("event-price").value = String(ev.price || "");
      $("event-coordinator-type").value =
        ev.coordinatorType || "faculty";
      setActiveModule("events-module");
    });

    const del = document.createElement("button");
    del.className = "btn danger";
    del.textContent = "Delete";
    del.disabled = !canManage;
    del.addEventListener("click", () => {
      if (!confirm("Delete this event and its registrations?")) return;
      state.events = state.events.filter((e) => e.id !== ev.id);
      state.registrations = state.registrations.filter(
        (r) => r.eventId !== ev.id
      );
      logActivity("event_deleted", `Deleted event "${ev.title}"`);
      saveState();
      renderAll();
    });

    actions.appendChild(edit);
    actions.appendChild(del);
    tr.appendChild(actions);
    tbody.appendChild(tr);
  });
}

function initEventsModule() {
  $("event-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const perms = getPermissions();
    if (!perms?.canManageEvents) {
      alert("You don't have permission to manage events.");
      return;
    }

    const id = $("event-id").value.trim() || null;
    const title = $("event-title").value.trim();
    const datetime = $("event-datetime").value;
    const location = $("event-location").value.trim();
    const limit = Number($("event-limit").value || 0);
    const price = Number($("event-price").value || 0);
    const coordinatorType = $("event-coordinator-type").value;
    if (!title || !datetime || !location || !limit) return;

    if (id) {
      const ev = state.events.find((x) => x.id === id);
      if (!ev) return;
      Object.assign(ev, {
        title,
        datetime,
        location,
        limit,
        price,
        coordinatorType,
      });
      logActivity("event_updated", `Updated event "${title}"`);
    } else {
      state.events.push({
        id: rid("event"),
        title,
        datetime,
        location,
        limit,
        price,
        coordinatorType,
        createdBy: currentUser.name,
        createdByRole: currentUser.role,
      });
      logActivity("event_created", `Created event "${title}"`);
    }

    $("event-form").reset();
    $("event-id").value = "";
    saveState();
    renderAll();
  });

  $("event-reset").addEventListener("click", () => {
    $("event-form").reset();
    $("event-id").value = "";
  });
}

function renderRegistrationsTable() {
  const tbody = $("registrations-table-body");
  tbody.innerHTML = "";
  const perms = getPermissions();
  const canApprove = !!perms?.canApproveRegistrations;

  state.registrations.forEach((reg) => {
    const ev = state.events.find((e) => e.id === reg.eventId);
    const tr = document.createElement("tr");

    const paid =
      Number(reg.amountPaid || 0) > 0
        ? `<span class="chip success">${formatCurrency(
            reg.amountPaid
          )}</span>`
        : `<span class="chip warning">Pending</span>`;

    const statusClass =
      reg.status === "approved"
        ? "approved"
        : reg.status === "rejected"
        ? "rejected"
        : "pending";

    tr.innerHTML = `
      <td>${ev ? ev.title : "Event removed"}</td>
      <td>${reg.type === "team" ? "Team" : "Individual"}</td>
      <td>${reg.teamName || reg.createdBy}</td>
      <td>${reg.count}</td>
      <td><span class="status-pill ${statusClass}">${
      reg.status[0].toUpperCase() + reg.status.slice(1)
    }</span></td>
      <td>${paid}</td>
    `;

    const actions = document.createElement("td");
    actions.className = "data-table-actions";

    if (canApprove) {
      const approve = document.createElement("button");
      approve.className = "btn primary";
      approve.textContent = "Approve";
      approve.disabled = reg.status === "approved";
      approve.addEventListener("click", () => {
        reg.status = "approved";
        logActivity(
          "registration_approved",
          `Approved registration for "${ev?.title || "Event"}"`
        );
        notify(
          "Registration approved",
          `Your registration for "${ev?.title || "Event"}" was approved (email simulated).`
        );
        saveState();
        renderAll();
      });

      const reject = document.createElement("button");
      reject.className = "btn danger";
      reject.textContent = "Reject";
      reject.disabled = reg.status === "rejected";
      reject.addEventListener("click", () => {
        reg.status = "rejected";
        logActivity(
          "registration_rejected",
          `Rejected registration for "${ev?.title || "Event"}"`
        );
        saveState();
        renderAll();
      });

      actions.appendChild(approve);
      actions.appendChild(reject);
    } else {
      const info = document.createElement("span");
      info.className = "tiny muted";
      info.textContent =
        reg.createdBy === currentUser?.name ? "Awaiting approval" : "-";
      actions.appendChild(info);
    }

    tr.appendChild(actions);
    tbody.appendChild(tr);
  });
}

function initRegistrationsModule() {
  $("registration-form").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!currentUser) return;
    const eventId = $("registration-event").value;
    if (!eventId) return;
    const type = $("registration-type").value;
    const count = Number($("registration-count").value || 1);
    const teamName = $("registration-team-name").value.trim();
    const referralCode =
      $("registration-referral").value.trim() || null;
    const amountPaid = Number($("registration-amount").value || 0);
    if (count <= 0) return;

    const ev = state.events.find((e) => e.id === eventId);
    const approvedCount = state.registrations.filter(
      (r) => r.eventId === eventId && r.status === "approved"
    ).length;
    if (ev && approvedCount >= ev.limit) {
      alert("Registration limit reached for this event.");
      return;
    }

    state.registrations.push({
      id: rid("reg"),
      eventId,
      type,
      createdBy: currentUser.name,
      createdByRole: currentUser.role,
      teamName: type === "team" ? teamName || "Team" : null,
      count,
      status: "pending",
      amountPaid,
      referralCode,
      ts: new Date().toISOString(),
    });
    logActivity(
      "registration_submitted",
      `Submitted ${type} registration for "${ev?.title || "Event"}"`
    );
    if (referralCode) {
      logActivity("referral_used", `Referral: ${referralCode}`);
    }
    notify(
      "Registration submitted",
      `Registration for "${ev?.title || "Event"}" is pending approval.`
    );

    $("registration-form").reset();
    $("registration-count").value = "1";
    saveState();
    renderAll();
  });
}

function initTasksModule() {
  $("task-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const perms = getPermissions();
    if (!perms?.canAssignTasks) {
      alert("You don't have permission to assign tasks.");
      return;
    }
    const title = $("task-title").value.trim();
    const assigneeId = $("task-assignee").value;
    const deadline = $("task-deadline").value || null;
    const status = $("task-status").value || "todo";
    if (!title || !assigneeId) return;

    const u = getAllUsers().find((x) => x.id === assigneeId);
    state.tasks.push({
      id: rid("task"),
      title,
      assigneeId,
      assigneeName: u ? u.name : "User",
      deadline,
      status,
      createdBy: currentUser.name,
      createdByRole: currentUser.role,
    });
    logActivity("task_assigned", `Task "${title}" assigned`);
    notify("New task", `"${title}" assigned to ${u ? u.name : "User"}.`);

    $("task-form").reset();
    saveState();
    renderAll();
  });
}

function getAllUsers() {
  const raw = [
    ...(currentUser ? [currentUser] : []),
    ...DEMO_USERS,
  ].filter((u) => u && u.id && u.name && u.role);
  const seen = new Set();
  return raw.filter((u) => {
    if (seen.has(u.id)) return false;
    seen.add(u.id);
    return true;
  });
}

function renderTaskAssigneeOptions() {
  const assignee = $("task-assignee");
  if (!assignee) return;
  const keep = assignee.value;
  assignee.innerHTML = "";
  getAllUsers().forEach((u) => {
    const opt = document.createElement("option");
    opt.value = u.id;
    opt.textContent = `${u.name} — ${u.role}`;
    assignee.appendChild(opt);
  });
  if (keep) assignee.value = keep;
}

function renderTasksTable() {
  const tbody = $("tasks-table-body");
  tbody.innerHTML = "";
  const perms = getPermissions();

  state.tasks.forEach((t) => {
    const tr = document.createElement("tr");
    const statusClass =
      t.status === "in_progress"
        ? "in-progress"
        : t.status === "completed"
        ? "completed"
        : "todo";

    tr.innerHTML = `
      <td>${t.title}</td>
      <td>${t.assigneeName}</td>
      <td>${t.deadline ? formatDate(t.deadline) : "-"}</td>
      <td><span class="status-pill ${statusClass}">${
      t.status === "in_progress"
        ? "In Progress"
        : t.status[0].toUpperCase() + t.status.slice(1)
    }</span></td>
    `;

    const updateCell = document.createElement("td");
    const sel = document.createElement("select");
    sel.innerHTML = `
      <option value="todo">To Do</option>
      <option value="in_progress">In Progress</option>
      <option value="completed">Completed</option>
    `;
    sel.value = t.status;
    const canUpdate =
      currentUser &&
      (currentUser.id === t.assigneeId || perms?.canAssignTasks);
    sel.disabled = !canUpdate;
    sel.addEventListener("change", () => {
      t.status = sel.value;
      logActivity("task_status_updated", `Task "${t.title}" => ${t.status}`);
      saveState();
      renderAll();
    });

    updateCell.appendChild(sel);
    tr.appendChild(updateCell);
    tbody.appendChild(tr);
  });
}

function initNotificationsModule() {
  $("announcement-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const perms = getPermissions();
    if (!perms?.canSendAnnouncements) {
      alert("Only Admin/Super Admin can publish announcements.");
      return;
    }
    const title = $("announcement-title").value.trim();
    const body = $("announcement-body").value.trim();
    if (!title || !body) return;
    notify(title, body);
    logActivity("announcement", `Announcement "${title}" published`);
    $("announcement-form").reset();
    saveState();
    renderAll();
  });
}

function renderNotifications() {
  const list = $("notifications-list");
  list.innerHTML = "";
  state.notifications.slice(0, 30).forEach((n) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div>
        <div>${n.title}</div>
        <div class="tiny muted">${new Date(n.ts).toLocaleString()}${
      n.author ? ` • ${n.author}` : ""
    }</div>
      </div>
      <span class="chip">In-app</span>
    `;
    list.appendChild(li);
  });
}

function renderLogs() {
  const list = $("logs-list");
  list.innerHTML = "";
  const perms = getPermissions();
  const visible =
    perms?.canViewAllLogs
      ? state.logs
      : state.logs.filter((l) => l.actor === currentUser?.name);

  visible.slice(0, 80).forEach((l) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div>
        <div class="tiny muted">${new Date(
          l.ts
        ).toLocaleString()} • ${l.actor} (${l.role})</div>
        <div><strong>${l.action}</strong></div>
        <div class="tiny muted">${l.details}</div>
      </div>
    `;
    list.appendChild(li);
  });
}

function initReportsModule() {
  $("export-registrations").addEventListener("click", () => {
    const rows = [
      [
        "eventTitle",
        "type",
        "teamOrName",
        "count",
        "status",
        "amountPaid",
        "createdBy",
        "ts",
        "referralCode",
      ],
    ];
    state.registrations.forEach((r) => {
      const ev = state.events.find((e) => e.id === r.eventId);
      rows.push([
        ev ? ev.title : "Event removed",
        r.type,
        r.teamName || r.createdBy,
        String(r.count),
        r.status,
        String(r.amountPaid || 0),
        r.createdBy,
        r.ts,
        r.referralCode || "",
      ]);
    });
    const csv = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
    downloadBlob("registrations.csv", "text/csv;charset=utf-8", csv);
  });

  $("export-backup").addEventListener("click", () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      state,
    };
    downloadBlob(
      "event-suite-backup.json",
      "application/json",
      JSON.stringify(backup, null, 2)
    );
  });
}

function downloadBlob(filename, mime, content) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function renderReports() {
  const tbody = $("reports-table-body");
  tbody.innerHTML = "";
  state.events.forEach((ev) => {
    const regs = state.registrations.filter((r) => r.eventId === ev.id);
    const approved = regs.filter((r) => r.status === "approved");
    const revenue = approved.reduce(
      (sum, r) => sum + Number(r.amountPaid || 0),
      0
    );
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${ev.title}</td>
      <td>${regs.length}</td>
      <td>${approved.length}</td>
      <td>${formatCurrency(revenue)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderAll() {
  renderSidebarPermissions();
  renderUserArea();
  renderAdminUsers();
  renderOverview();
  renderEventsSelect();
  renderEventsTable();
  renderRegistrationsTable();
  renderTaskAssigneeOptions();
  renderTasksTable();
  renderNotifications();
  renderReports();
  renderLogs();
}

function renderShellForUser() {
  $("login-section").setAttribute("hidden", "true");
  $("dashboard-section").removeAttribute("hidden");
  renderAll();

  // Hide all role modules first
  document.querySelectorAll('.role-modules').forEach(module => {
    module.setAttribute("hidden", "true");
  });

  // Show modules based on user role
  const role = currentUser?.role;
  if (role) {
    let roleClass = '';
    switch (role) {
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
      roleModule.removeAttribute("hidden");
    }
  }

  // Show/hide Team Leader specific features
  const teamLeaderSection = $("team-leader-volunteer-management");
  if (currentUser?.role === ROLES.TEAM_LEADER) {
    teamLeaderSection?.removeAttribute("hidden");
    // Initialize volunteer management
    if (!window.volunteerManager) {
      window.volunteerManager = new VolunteerManager();
    }
    window.volunteerManager.init();
  } else {
    teamLeaderSection?.setAttribute("hidden", "true");
  }

  const perms = getPermissions();
  const first = perms?.modules?.[0] || "overview-module";
  setActiveModule(first);
}

// Volunteer Management System
class VolunteerManager {
  constructor() {
    this.volunteers = [];
    this.currentTeamId = currentUser?.teamId;
    this.currentTeamName = currentUser?.teamName;
  }

  async init() {
    this.bindEvents();
    await this.loadVolunteers();
    this.updateTeamInfo();
  }

  bindEvents() {
    $("add-volunteer-btn").addEventListener("click", () => this.showAddVolunteerModal());
    $("close-volunteer-modal").addEventListener("click", () => this.hideAddVolunteerModal());
    $("cancel-add-volunteer").addEventListener("click", () => this.hideAddVolunteerModal());
    $("add-volunteer-form").addEventListener("submit", (e) => this.handleAddVolunteer(e));
    $("refresh-volunteers-btn").addEventListener("click", () => this.loadVolunteers());
  }

  updateTeamInfo() {
    if ($("current-team-name")) {
      $("current-team-name").textContent = this.currentTeamName || "Unknown Team";
    }
    if ($("volunteer-count")) {
      $("volunteer-count").textContent = this.volunteers.length;
    }
  }

  async loadVolunteers() {
    try {
      // Load volunteers from localStorage (for demo)
      const allVolunteers = JSON.parse(localStorage.getItem('volunteers') || '[]');
      this.volunteers = allVolunteers.filter(v => v.teamId === this.currentTeamId);
      
      // Also load users who are volunteers in this team
      const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const teamVolunteers = allUsers.filter(u => 
        u.role === ROLES.VOLUNTEER && u.teamId === this.currentTeamId
      );
      
      // Combine both sources
      this.volunteers = [
        ...this.volunteers,
        ...teamVolunteers.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone || 'Not provided',
          skills: user.skills || [],
          status: 'Active',
          joinedAt: user.createdAt
        }))
      ];

      this.renderVolunteers();
      this.updateTeamInfo();
    } catch (error) {
      console.error('Error loading volunteers:', error);
    }
  }

  renderVolunteers() {
    const container = $("volunteer-list");
    if (!container) return;

    if (this.volunteers.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 40px;">No volunteers found in your team. Click "Add Volunteer" to get started.</p>';
      return;
    }

    container.innerHTML = this.volunteers.map(volunteer => `
      <div class="volunteer-card">
        <h4>${volunteer.name}</h4>
        <div class="volunteer-info">
          <span>📧 ${volunteer.email}</span>
          <span>📱 ${volunteer.phone}</span>
          <span>📅 Joined: ${new Date(volunteer.joinedAt).toLocaleDateString()}</span>
        </div>
        ${volunteer.skills && volunteer.skills.length > 0 ? `
          <div class="volunteer-skills">
            ${volunteer.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
          </div>
        ` : ''}
        <div class="volunteer-actions">
          <button class="btn primary" onclick="volunteerManager.assignTask('${volunteer.id}')">Assign Task</button>
          <button class="btn ghost" onclick="volunteerManager.viewDetails('${volunteer.id}')">View Details</button>
        </div>
      </div>
    `).join('');
  }

  showAddVolunteerModal() {
    $("add-volunteer-modal")?.removeAttribute("hidden");
  }

  hideAddVolunteerModal() {
    $("add-volunteer-modal")?.setAttribute("hidden", "true");
    $("add-volunteer-form")?.reset();
  }

  async handleAddVolunteer(e) {
    e.preventDefault();
    
    const name = $("volunteer-name").value.trim();
    const email = $("volunteer-email").value.trim();
    const phone = $("volunteer-phone").value.trim();
    const skills = $("volunteer-skills").value.split(',').map(s => s.trim()).filter(s => s);

    if (!name || !email) {
      alert('Please fill in name and email');
      return;
    }

    const volunteer = {
      id: 'vol_' + Date.now(),
      name,
      email,
      phone: phone || 'Not provided',
      skills,
      teamId: this.currentTeamId,
      teamName: this.currentTeamName,
      status: 'Active',
      joinedAt: new Date().toISOString(),
      addedBy: currentUser.id
    };

    try {
      // Save to localStorage
      const volunteers = JSON.parse(localStorage.getItem('volunteers') || '[]');
      volunteers.push(volunteer);
      localStorage.setItem('volunteers', JSON.stringify(volunteers));

      this.volunteers.push(volunteer);
      this.renderVolunteers();
      this.updateTeamInfo();
      this.hideAddVolunteerModal();

      alert('Volunteer added successfully!');
    } catch (error) {
      console.error('Error adding volunteer:', error);
      alert('Failed to add volunteer');
    }
  }

  assignTask(volunteerId) {
    const volunteer = this.volunteers.find(v => v.id === volunteerId);
    if (!volunteer) return;

    // Switch to tasks module and pre-fill the assignee
    setActiveModule('tasks-module');
    
    // Wait for the module to load, then set the assignee
    setTimeout(() => {
      const assigneeSelect = $("task-assignee");
      if (assigneeSelect) {
        // Clear existing options and add this volunteer
        assigneeSelect.innerHTML = `<option value="${volunteer.id}">${volunteer.name}</option>`;
      }
    }, 100);
  }

  viewDetails(volunteerId) {
    const volunteer = this.volunteers.find(v => v.id === volunteerId);
    if (!volunteer) return;

    alert(`Volunteer Details:\n\nName: ${volunteer.name}\nEmail: ${volunteer.email}\nPhone: ${volunteer.phone}\nSkills: ${volunteer.skills.join(', ') || 'None'}\nJoined: ${new Date(volunteer.joinedAt).toLocaleDateString()}`);
  }
}

function initNav() {
  $("sidebar-nav").addEventListener("click", (e) => {
    const btn = e.target.closest(".nav-item");
    if (!btn || btn.hasAttribute("hidden")) return;
    const target = btn.dataset.target;
    if (!target) return;
    setActiveModule(target);
  });
}

function initLogin() {
  const loginStep1 = $("login-step-1");
  const roleSelectionStep = $("role-selection-step");

  function showLoginStep1() {
    loginStep1.removeAttribute("hidden");
    roleSelectionStep.setAttribute("hidden", "true");
    selectedGoogleAccount = null;
    selectedRole = null;
  }

  function showRoleSelection() {
    loginStep1.setAttribute("hidden", "true");
    roleSelectionStep.removeAttribute("hidden");
    renderRoleOptions();
  }

  async function initiateGoogleAuth() {
    try {
      // Redirect to Google OAuth via backend
      window.GoogleAuthAPI.initiateGoogleAuth();
    } catch (error) {
      console.error('Google sign-in failed:', error);
      // Fallback to demo mode for development
      simulateGoogleAuth();
    }
  }

  function simulateGoogleAuth() {
    // Simulate getting user info from Google
    const mockGoogleUser = {
      id: "google_" + Date.now(),
      name: "Demo User",
      email: "demo.user@gmail.com",
      avatar: "DU"
    };
    
    selectedGoogleAccount = mockGoogleUser;
    showRoleSelection();
  }

  // Handle authentication callback on page load
  async function handleAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.has('token') && urlParams.has('user')) {
      // Handle successful authentication
      const result = await window.GoogleAuthAPI.handleAuthSuccess();
      
      if (result.success) {
        currentUser = result.user;
        selectedGoogleAccount = currentUser;
        
        // Check if user has a role
        if (currentUser.role) {
          // User already has a role, go directly to dashboard
          renderShellForUser();
        } else {
          // User needs to select a role
          showRoleSelection();
        }
      } else {
        console.error('Authentication failed:', result.error);
        alert('Authentication failed: ' + result.error);
      }
    } else if (urlParams.has('error')) {
      // Handle authentication error
      const result = window.GoogleAuthAPI.handleAuthError();
      if (!result.success) {
        console.error('Authentication error:', result.error);
        alert('Authentication error: ' + result.error);
      }
    }
  }

  function renderRoleOptions() {
    const roleOptions = $("role-options");
    roleOptions.innerHTML = "";

    Object.values(ROLES).forEach(role => {
      const roleInfo = ROLE_DESCRIPTIONS[role];
      const roleCard = document.createElement("div");
      roleCard.className = "role-card";
      roleCard.innerHTML = `
        <div class="role-title">${role}</div>
        <div class="role-description">${roleInfo.description}</div>
        <ul class="role-features">
          ${roleInfo.features.map(feature => `<li>${feature}</li>`).join("")}
        </ul>
      `;
      
      roleCard.addEventListener("click", () => {
        document.querySelectorAll(".role-card").forEach(card => 
          card.classList.remove("selected")
        );
        roleCard.classList.add("selected");
        selectedRole = role;
        updateRoleHint(role);
      });

      roleOptions.appendChild(roleCard);
    });
  }

  function updateRoleHint(role) {
    const roleHint = $("role-hint");
    const roleInfo = ROLE_DESCRIPTIONS[role];
    roleHint.textContent = `As a ${role}, you will have access to: ${roleInfo.features.join(", ")}.`;
  }

  // Event listeners for new login system
  $("user-role").addEventListener("change", handleRoleChange);
  
  $("login-btn").addEventListener("click", handleLogin);

  function handleRoleChange() {
    const role = $("user-role").value;
    const teamSelection = $("team-selection");
    
    if (role === "Team Leader" || role === "Volunteer") {
      teamSelection.classList.remove("hidden");
      teamSelection.classList.add("visible");
    } else {
      teamSelection.classList.add("hidden");
      teamSelection.classList.remove("visible");
    }
  }

  async function handleLogin() {
    const name = $("user-name").value.trim();
    const role = $("user-role").value;
    const teamId = role === "Team Leader" || role === "Volunteer" ? $("user-team").value : null;
    
    if (!name || !role) {
      alert("Please fill in all required fields");
      return;
    }
    
    if ((role === "Team Leader" || role === "Volunteer") && !teamId) {
      alert("Please select a team");
      return;
    }
    
    try {
      // Create user object
      currentUser = {
        id: generateUserId(),
        name: name,
        role: role,
        teamId: teamId,
        teamName: teamId ? Object.values(TEAMS).find(team => team.id === teamId)?.name : null,
        email: `${name.toLowerCase().replace(/\s+/g, '.')}@campus.edu`,
        createdAt: new Date().toISOString()
      };
      
      // Save to localStorage
      saveUserToDatabase(currentUser);
      
      logActivity("login", `User signed in as ${role}${teamId ? ` (${currentUser.teamName})` : ''}`);
      saveState();
      renderShellForUser();
      
      // Reset form
      $("user-name").value = "";
      $("user-role").value = "";
      $("user-team").value = "";
      $("team-selection").classList.add("hidden");
      
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed: ' + error.message);
    }
  }

  function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  function saveUserToDatabase(user) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const existingUserIndex = users.findIndex(u => u.id === user.id);
    
    if (existingUserIndex >= 0) {
      users[existingUserIndex] = user;
    } else {
      users.push(user);
    }
    
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  // default state
  showLoginStep1();
}

function makeReferralCode(name) {
  const slug = String(name)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 14);
  return `CAMPUS-${slug || "AMB"}`;
}

function seedIfEmpty() {
  if (state.events.length) return;
  state.events = [
    {
      id: rid("event"),
      title: "Hackathon Kickoff",
      datetime: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      location: "Main Auditorium",
      limit: 120,
      price: 0,
      coordinatorType: "faculty",
      createdBy: "System",
      createdByRole: "System",
    },
    {
      id: rid("event"),
      title: "Cultural Night",
      datetime: new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 16),
      location: "Open Grounds",
      limit: 500,
      price: 50,
      coordinatorType: "club",
      createdBy: "System",
      createdByRole: "System",
    },
  ];
  notify("Welcome", "Demo data seeded. Login to explore modules.");
  logActivity("seed", "Seeded demo data");
  saveState();
}

function init() {
  $("footer-year").textContent = String(new Date().getFullYear());
  loadState();
  seedIfEmpty();

  // Handle authentication callback first
  handleAuthCallback();

  // Check if user is already logged in via localStorage
  const savedUser = localStorage.getItem('currentUser');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    renderShellForUser();
  } else {
    // Show login page
    renderUserArea();
    $("dashboard-section").setAttribute("hidden", "true");
    $("login-section").removeAttribute("hidden");
  }

  initLogin();
  initNav();
  initEventsModule();
  initRegistrationsModule();
  initTasksModule();
  initNotificationsModule();
  initReportsModule();
}

document.addEventListener("DOMContentLoaded", init);

