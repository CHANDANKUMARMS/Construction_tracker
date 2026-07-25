// ============================================================
// dashboard.js
// Construction Project Tracker - Dashboard Logic
// Vanilla JS, relies on API_BASE_URL declared in config.js
// ============================================================

// ------------------------------------------------------------
// Global State
// ------------------------------------------------------------
let currentProjectCode = null;
let allProjectsCache = [];
let lastListView = "dashboard"; // "dashboard" or "browse" - where Back should return to

// ------------------------------------------------------------
// Auth Helpers
// ------------------------------------------------------------
function getToken() {
    return localStorage.getItem("token");
}

function requireAuthOrRedirect() {
    const token = getToken();
    if (!token) {
        window.location.replace("auth.html");
        return null;
    }
    return token;
}

// ------------------------------------------------------------
// Generic API Request Helper
// ------------------------------------------------------------
async function apiRequest(endpoint, method = "GET", body = null) {
    const token = requireAuthOrRedirect();
    if (!token) return null;

    try {
        const options = {
            method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        };

        if (body !== null) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

        if (response.status === 401) {
            window.location.href = "auth.html";
            return null;
        }

        let data = null;
        try {
            data = await response.json();
        } catch (parseErr) {
            data = null;
        }

        if (!response.ok) {
            const message = (data && (data.detail || data.message))
                ? (data.detail || data.message)
                : `Request failed with status ${response.status}`;
            throw new Error(message);
        }

        return data;
    } catch (error) {
        console.error(`API request failed [${method} ${endpoint}]:`, error);
        alert(`Error: ${error.message}`);
        return null;
    }
}

// ------------------------------------------------------------
// Section Visibility
// ------------------------------------------------------------
function hideAllSections() {
    const sections = [
        "dashboardSection",
        "createProjectSection",
        "browseProjectsSection",
        "projectSection"
    ];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add("hidden");
    });
}

function setActiveNavButton(activeId) {
    const navButtons = ["dashboardBtn", "createProjectBtn", "browseProjectsBtn"];
    navButtons.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (id === activeId) {
            el.classList.add("active");
        } else {
            el.classList.remove("active");
        }
    });
}

async function showDashboard() {
    hideAllSections();
    document.getElementById("dashboardSection").classList.remove("hidden");
    setActiveNavButton("dashboardBtn");
    await loadDashboard();
}

async function showBrowseProjects() {
    hideAllSections();
    document.getElementById("browseProjectsSection").classList.remove("hidden");
    setActiveNavButton("browseProjectsBtn");
    await loadBrowseProjects();
}

function showCreateProject() {
    hideAllSections();
    document.getElementById("createProjectSection").classList.remove("hidden");
    setActiveNavButton("createProjectBtn");
}

async function showProject(projectCode) {
    hideAllSections();
    document.getElementById("projectSection").classList.remove("hidden");
    setActiveNavButton(null);
    currentProjectCode = projectCode;
    await loadProject(projectCode);
    showProjectTab("overview");
}

// ------------------------------------------------------------
// Project Detail Tabs (Overview / Tasks / Engineers / Clients)
// ------------------------------------------------------------
function showProjectTab(tabName) {
    const tabs = {
        overview: { btn: "overviewBtn", div: "overviewDiv" },
        tasks: { btn: "tasksBtn", div: "tasksDiv" },
        engineers: { btn: "engineersBtn", div: "engineersDiv" },
        clients: { btn: "clientsBtn", div: "clientsDiv" }
    };

    Object.keys(tabs).forEach(key => {
        const btnEl = document.getElementById(tabs[key].btn);
        const divEl = document.getElementById(tabs[key].div);

        if (divEl) {
            if (key === tabName) {
                divEl.classList.remove("hidden");
            } else {
                divEl.classList.add("hidden");
            }
        }

        if (btnEl) {
            if (key === tabName) {
                btnEl.classList.add("active");
            } else {
                btnEl.classList.remove("active");
            }
        }
    });
}

// ------------------------------------------------------------
// Dashboard
// ------------------------------------------------------------
async function loadDashboard() {
    const projects = await apiRequest("/project/all", "GET");
    if (!projects) return;

    allProjectsCache = projects;

    const total = projects.length;
    const active = projects.filter(p => (p.status || "").toLowerCase() === "active").length;
    const completed = projects.filter(p => (p.status || "").toLowerCase() === "completed").length;

    document.getElementById("totalProjects").innerText = total;
    document.getElementById("activeProjects").innerText = active;
    document.getElementById("completedProjects").innerText = completed;

    const recentProjects = [...projects].slice(-5).reverse();
    renderProjectsTable(recentProjects, "recentProjectsBody");
}

// ------------------------------------------------------------
// Browse Projects
// ------------------------------------------------------------
async function loadBrowseProjects() {
    const projects = await apiRequest("/project/all", "GET");
    if (!projects) return;

    allProjectsCache = projects;
    renderProjectsTable(projects, "browseProjectsBody");

    const searchInput = document.getElementById("searchProject");
    if (searchInput) {
        searchInput.value = "";
    }
}

function filterBrowseProjects(query) {
    const normalizedQuery = (query || "").trim().toLowerCase();

    if (!normalizedQuery) {
        renderProjectsTable(allProjectsCache, "browseProjectsBody");
        return;
    }

    const filtered = allProjectsCache.filter(project => {
        const name = (project.project_name || "").toLowerCase();
        const code = (project.project_code || "").toLowerCase();
        const location = (project.location || "").toLowerCase();
        const status = (project.status || "").toLowerCase();

        return name.includes(normalizedQuery) ||
               code.includes(normalizedQuery) ||
               location.includes(normalizedQuery) ||
               status.includes(normalizedQuery);
    });

    renderProjectsTable(filtered, "browseProjectsBody");
}

// ------------------------------------------------------------
// Progress Calculation
// ------------------------------------------------------------
// GET /project/all does not return a "progress" field (only
// GET /project/{code} computes it server-side), so we derive it
// here from each project's tasks array to avoid showing 0% everywhere.
function computeProgress(project) {
    if (typeof project.progress === "number") {
        return project.progress;
    }

    const tasks = project.tasks || [];
    if (tasks.length === 0) return 0;

    const completed = tasks.filter(t => (t.status || "").toLowerCase() === "completed").length;
    return Math.floor((completed * 100) / tasks.length);
}

// ------------------------------------------------------------
// Shared: Render Projects Table
// ------------------------------------------------------------
function renderProjectsTable(projects, tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!projects || projects.length === 0) {
        const emptyRow = document.createElement("tr");
        emptyRow.innerHTML = `<td colspan="5">No projects found.</td>`;
        tbody.appendChild(emptyRow);
        return;
    }

    projects.forEach(project => {
        const row = document.createElement("tr");
        row.dataset.projectCode = project.project_code || "";

        const progressValue = computeProgress(project);

        row.innerHTML = `
            <td>${escapeHtml(project.project_name)}</td>
            <td>${escapeHtml(project.project_code)}</td>
            <td>${escapeHtml(project.status)}</td>
            <td>${progressValue}%</td>
            <td><button class="openProjectBtn">Open</button></td>
        `;

        tbody.appendChild(row);
    });
}

// Event delegation for "Open" buttons in either projects table.
// Each table records where it lives, so the Back button on the
// project detail page can return to Dashboard or Browse Projects
// depending on which one the user actually came from.
function attachProjectTableDelegation() {
    const tableOrigins = {
        recentProjectsBody: "dashboard",
        browseProjectsBody: "browse"
    };

    Object.keys(tableOrigins).forEach(tbodyId => {
        const tbody = document.getElementById(tbodyId);
        if (!tbody) return;

        tbody.addEventListener("click", async (event) => {
            const target = event.target;
            if (target && target.classList.contains("openProjectBtn")) {
                const row = target.closest("tr");
                const projectCode = row ? row.dataset.projectCode : null;
                if (projectCode) {
                    lastListView = tableOrigins[tbodyId];
                    await showProject(projectCode);
                }
            }
        });
    });
}

async function goBackFromProject() {
    if (lastListView === "browse") {
        await showBrowseProjects();
    } else {
        await showDashboard();
    }
}

// ------------------------------------------------------------
// Create Project
// ------------------------------------------------------------
function attachCreateProjectForm() {
    const form = document.getElementById("createProjectForm");
    if (!form) return;

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const projectName = document.getElementById("projectNameInput").value.trim();
        const location = document.getElementById("projectLocationInput").value.trim();
        const description = document.getElementById("projectDescriptionInput").value.trim();
        const startDate = document.getElementById("projectStartDate").value;
        const endDate = document.getElementById("projectEndDate").value;

        if (!projectName || !location) {
            alert("Project name and location are required.");
            return;
        }

        if (!startDate || !endDate) {
            alert("Start date and expected end date are required.");
            return;
        }

        if (new Date(endDate) < new Date(startDate)) {
            alert("Expected end date cannot be before the start date.");
            return;
        }

        const payload = {
            project_name: projectName,
            location: location,
            description: description,
            start_date: startDate,
            expected_end_date: endDate
        };

        const result = await apiRequest("/project/create", "POST", payload);
        if (!result) return;

        alert(result.message || "Project created successfully.");
        form.reset();

        await loadDashboard();
        await showBrowseProjects();
    });
}

// ------------------------------------------------------------
// Project Details (Overview / Tasks / Engineers / Clients)
// ------------------------------------------------------------
async function loadProject(projectCode) {
    const project = await apiRequest(`/project/${projectCode}`, "GET");
    if (!project) return;

    currentProjectCode = project.project_code;

    document.getElementById("projectName").innerText = project.project_name || "";
    document.getElementById("projectCode").innerText = project.project_code || "";
    document.getElementById("projectLocation").innerText = project.location || "";
    document.getElementById("projectStatus").value = project.status || "Active";

    const progressBar = document.getElementById("progressBar");
    const progressValue = (typeof project.progress === "number") ? project.progress : 0;
    if (progressBar) {
        progressBar.style.width = `${progressValue}%`;
        progressBar.innerText = `${progressValue}%`;
    }

    renderOverview(project.tasks || []);
    renderTasks(project.tasks || []);
    renderEngineers(project.engineers || []);
    renderClients(project.clients || []);
}

async function refreshCurrentProject() {
    if (currentProjectCode) {
        await loadProject(currentProjectCode);
    }
}

// ------------------------------------------------------------
// Overview
// ------------------------------------------------------------
function renderOverview(tasks) {
    const total = tasks.length;
    const completed = tasks.filter(t => (t.status || "").toLowerCase() === "completed").length;
    const pending = total - completed;

    document.getElementById("totalTasks").innerText = total;
    document.getElementById("completedTasks").innerText = completed;
    document.getElementById("pendingTasks").innerText = pending;
}

// ------------------------------------------------------------
// Tasks
// ------------------------------------------------------------
function renderTasks(tasks) {
    const tbody = document.getElementById("tasksBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!tasks || tasks.length === 0) {
        const emptyRow = document.createElement("tr");
        emptyRow.innerHTML = `<td colspan="4">No tasks yet.</td>`;
        tbody.appendChild(emptyRow);
        return;
    }

    tasks.forEach(task => {
        const isCompleted = (task.status || "").toLowerCase() === "completed";

        const row = document.createElement("tr");
        row.dataset.taskName = task.task_name || "";

        row.innerHTML = `
            <td>${escapeHtml(task.task_name)}</td>
            <td>${escapeHtml(task.deadline)}</td>
            <td>${escapeHtml(task.status)}</td>
            <td>
                <button class="completeTaskBtn" ${isCompleted ? "disabled" : ""}>Complete</button>
                <button class="deleteTaskBtn">Delete</button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

function attachTasksDelegation() {
    const tbody = document.getElementById("tasksBody");
    if (!tbody) return;

    tbody.addEventListener("click", async (event) => {
        const target = event.target;
        const row = target.closest("tr");
        if (!row) return;

        const taskName = row.dataset.taskName;
        if (!taskName || !currentProjectCode) return;

        if (target.classList.contains("completeTaskBtn")) {
            await apiRequest("/project/update-task-status", "PUT", {
                project_code: currentProjectCode,
                task_name: taskName,
                status: "Completed"
            });
            await refreshCurrentProject();
        } else if (target.classList.contains("deleteTaskBtn")) {
            if (!confirm(`Delete task "${taskName}"?`)) return;

            await apiRequest("/project/delete-task", "DELETE", {
                project_code: currentProjectCode,
                task_name: taskName
            });
            await refreshCurrentProject();
        }
    });
}

function attachAddTaskButton() {
    const addTaskBtn = document.getElementById("addTaskBtn");
    if (!addTaskBtn) return;

    addTaskBtn.addEventListener("click", async () => {
        const taskNameInput = document.getElementById("taskNameInput");
        const taskDeadlineInput = document.getElementById("taskDeadlineInput");

        const taskName = taskNameInput.value.trim();
        const deadline = taskDeadlineInput.value;

        if (!taskName) {
            alert("Task name is required.");
            return;
        }

        if (!deadline) {
            alert("Task deadline is required.");
            return;
        }

        if (!currentProjectCode) return;

        const result = await apiRequest("/project/add-task", "POST", {
            project_code: currentProjectCode,
            task_name: taskName,
            deadline: deadline
        });

        if (!result) return;

        taskNameInput.value = "";
        taskDeadlineInput.value = "";

        await refreshCurrentProject();
    });
}

function attachUpdateProjectStatusButton() {

    const updateBtn = document.getElementById("updateProjectStatusBtn");
    if (!updateBtn) return;

    updateBtn.addEventListener("click", async () => {

        if (!currentProjectCode) return;

        const status = document.getElementById("projectStatus").value;

        const result = await apiRequest("/project/update-status", "PUT", {
            project_code: currentProjectCode,
            status: status
        });

        if (!result) return;

        alert(result.message);

        await refreshCurrentProject();
        await loadDashboard();
    });
}

// ------------------------------------------------------------
// Engineers
// ------------------------------------------------------------
function renderEngineers(engineers) {
    const tbody = document.getElementById("engineersBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!engineers || engineers.length === 0) {
        const emptyRow = document.createElement("tr");
        emptyRow.innerHTML = `<td colspan="2">No engineers invited yet.</td>`;
        tbody.appendChild(emptyRow);
        return;
    }

    engineers.forEach(engineer => {
        const email = typeof engineer === "string" ? engineer : (engineer.email || "");
        const status = typeof engineer === "string" ? "Invited" : (engineer.status || "Invited");

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${escapeHtml(email)}</td>
            <td>${escapeHtml(status)}</td>
        `;
        tbody.appendChild(row);
    });
}

function attachInviteEngineerButton() {
    const inviteBtn = document.getElementById("inviteEngineerBtn");
    if (!inviteBtn) return;

    inviteBtn.addEventListener("click", async () => {
        const emailInput = document.getElementById("engineerEmail");
        const email = emailInput.value.trim();

        if (!email) {
            alert("Engineer email is required.");
            return;
        }

        if (!isValidEmail(email)) {
            alert("Please enter a valid email address.");
            return;
        }

        if (!currentProjectCode) return;

        const result = await apiRequest("/project/invite-engineer", "POST", {
            project_code: currentProjectCode,
            email: email
        });

        if (!result) return;

        emailInput.value = "";
        await refreshCurrentProject();
    });
}

// ------------------------------------------------------------
// Clients
// ------------------------------------------------------------
function renderClients(clients) {
    const tbody = document.getElementById("clientsBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!clients || clients.length === 0) {
        const emptyRow = document.createElement("tr");
        emptyRow.innerHTML = `<td colspan="2">No clients invited yet.</td>`;
        tbody.appendChild(emptyRow);
        return;
    }

    clients.forEach(client => {
        const email = typeof client === "string" ? client : (client.email || "");
        const status = typeof client === "string" ? "Invited" : (client.status || "Invited");

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${escapeHtml(email)}</td>
            <td>${escapeHtml(status)}</td>
        `;
        tbody.appendChild(row);
    });
}

function attachInviteClientButton() {
    const inviteBtn = document.getElementById("inviteClientBtn");
    if (!inviteBtn) return;

    inviteBtn.addEventListener("click", async () => {
        const emailInput = document.getElementById("clientEmail");
        const email = emailInput.value.trim();

        if (!email) {
            alert("Client email is required.");
            return;
        }

        if (!isValidEmail(email)) {
            alert("Please enter a valid email address.");
            return;
        }

        if (!currentProjectCode) return;

        const result = await apiRequest("/project/invite-client", "POST", {
            project_code: currentProjectCode,
            email: email
        });

        if (!result) return;

        emailInput.value = "";
        await refreshCurrentProject();
    });
}

// ------------------------------------------------------------
// Navigation Wiring
// ------------------------------------------------------------
function attachNavigation() {
    const dashboardBtn = document.getElementById("dashboardBtn");
    const createProjectBtn = document.getElementById("createProjectBtn");
    const browseProjectsBtn = document.getElementById("browseProjectsBtn");
    const backBtn = document.getElementById("backBtn");
    const logoutBtn = document.getElementById("logoutBtn");

    if (dashboardBtn) {
        dashboardBtn.addEventListener("click", showDashboard);
    }

    if (createProjectBtn) {
        createProjectBtn.addEventListener("click", showCreateProject);
    }

    if (browseProjectsBtn) {
        browseProjectsBtn.addEventListener("click", showBrowseProjects);
    }

    if (backBtn) {
        backBtn.addEventListener("click", goBackFromProject);
    }

    logoutBtn.addEventListener("click", () => {

    const confirmLogout = confirm("Are you sure you want to logout?");

    if (!confirmLogout) {
        return;
    }

    localStorage.removeItem("token");

    localStorage.removeItem("selectedProject");

    window.location.replace("auth.html");

});

    const overviewBtn = document.getElementById("overviewBtn");
    const tasksBtn = document.getElementById("tasksBtn");
    const engineersBtn = document.getElementById("engineersBtn");
    const clientsBtn = document.getElementById("clientsBtn");

    if (overviewBtn) overviewBtn.addEventListener("click", () => showProjectTab("overview"));
    if (tasksBtn) tasksBtn.addEventListener("click", () => showProjectTab("tasks"));
    if (engineersBtn) engineersBtn.addEventListener("click", () => showProjectTab("engineers"));
    if (clientsBtn) clientsBtn.addEventListener("click", () => showProjectTab("clients"));
}

function attachSearch() {
    const searchInput = document.getElementById("searchProject");
    if (!searchInput) return;

    searchInput.addEventListener("input", (event) => {
        filterBrowseProjects(event.target.value);
    });
}

// ------------------------------------------------------------
// Utility
// ------------------------------------------------------------
function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function isValidEmail(email) {
    // Simple sanity check, not full RFC validation.
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ------------------------------------------------------------
// Init
// ------------------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
    const token = requireAuthOrRedirect();
    if (!token) return;

    attachNavigation();
    attachProjectTableDelegation();
    attachCreateProjectForm();
    attachTasksDelegation();
    attachAddTaskButton();
    attachUpdateProjectStatusButton();
    attachInviteEngineerButton();
    attachInviteClientButton();
    attachSearch();

    await showDashboard();
});