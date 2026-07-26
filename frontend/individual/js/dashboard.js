// ============================================================
// Individual Dashboard
// Part 1
// ============================================================

// ------------------------------------------------------------
// Global State
// ------------------------------------------------------------
let currentProjectCode = null;
let allProjectsCache = [];
let aiChatOpen = false;

// ------------------------------------------------------------
// Auth
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
// API Helper
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

        }

        catch {

            data = null;

        }

        if (!response.ok) {

            const message = (data && (data.detail || data.message))
                ? (data.detail || data.message)
                : `Request failed with status ${response.status}`;

            throw new Error(message);

        }

        return data;

    }

    catch (error) {

        console.error(error);

        alert(error.message);

        return null;

    }

}

function openAIChat() {

    document
        .getElementById("aiChat")
        .classList.remove("hidden");

    aiChatOpen = true;
}

function closeAIChat() {

    document
        .getElementById("aiChat")
        .classList.add("hidden");

    aiChatOpen = false;
}

function addChatMessage(sender, message) {

    const messages = document.getElementById("chatMessages");

    const div = document.createElement("div");

    div.className = sender;

    div.innerText = message;

    messages.appendChild(div);

    messages.scrollTop = messages.scrollHeight;
}

async function sendAIQuestion() {

    const input = document.getElementById("aiQuestion");

    const question = input.value.trim();

    if (!question) return;

    addChatMessage("userMessage", question);

    input.value = "";

    const sendButton = document.getElementById("sendQuestion");

    sendButton.disabled = true;

    const result = await apiRequest(

        "/ai/ask",

        "POST",

        {

            context: allProjectsCache,

            question: question

        }

    );

    if (!result) {

        addChatMessage(

            "aiMessage",

            "Sorry, I couldn't process your request."

        );

        sendButton.disabled = false;

        return;

    }

    addChatMessage(

        "aiMessage",

        result.answer

    );

    sendButton.disabled = false;
}

function attachAI() {

    document
        .getElementById("aiButton")
        .addEventListener(
            "click",
            openAIChat
        );

    document
        .getElementById("closeAi")
        .addEventListener(
            "click",
            closeAIChat
        );

    document
        .getElementById("sendQuestion")
        .addEventListener(
            "click",
            sendAIQuestion
        );

    document
        .getElementById("aiQuestion")
        .addEventListener(

            "keypress",

            function(event){

                if(event.key==="Enter"){

                    sendAIQuestion();

                }

            }

        );

}

// ------------------------------------------------------------
// Section Visibility
// ------------------------------------------------------------
function hideAllSections() {

    document.getElementById("dashboardSection").classList.add("hidden");
    document.getElementById("projectSection").classList.add("hidden");

}

async function showDashboard() {

    hideAllSections();

    document.getElementById("dashboardSection").classList.remove("hidden");

    await loadProjects();

}

async function showProject(projectCode) {

    hideAllSections();

    document.getElementById("projectSection").classList.remove("hidden");

    currentProjectCode = projectCode;

    await loadProject(projectCode);

    showProjectTab("overview");

}

async function goBackFromProject() {

    await showDashboard();

}

// ------------------------------------------------------------
// Project Tabs
// ------------------------------------------------------------
function showProjectTab(tabName) {

    const tabs = {

        overview: {
            btn: "overviewBtn",
            div: "overviewDiv"
        },

        tasks: {
            btn: "tasksBtn",
            div: "tasksDiv"
        },

        engineers: {
            btn: "engineersBtn",
            div: "engineersDiv"
        },

        clients: {
            btn: "clientsBtn",
            div: "clientsDiv"
        }

    };

    Object.keys(tabs).forEach(key => {

        const btn = document.getElementById(tabs[key].btn);
        const div = document.getElementById(tabs[key].div);

        if (key === tabName) {

            btn.classList.add("active");
            div.classList.remove("hidden");

        }

        else {

            btn.classList.remove("active");
            div.classList.add("hidden");

        }

    });

}

// ------------------------------------------------------------
// Join Project
// ------------------------------------------------------------
async function joinProject() {

    const projectCode = document.getElementById("projectCodeInput").value.trim();

    if (!projectCode) {

        alert("Enter Project Code.");
        return;

    }

    const result = await apiRequest("/individual/join-project", "PUT", {

        project_code: projectCode

    });

    if (!result) return;

    alert(result.message);

    document.getElementById("projectCodeInput").value = "";

    await loadProjects();

}

// ------------------------------------------------------------
// Browse Projects
// ------------------------------------------------------------
async function loadProjects() {

    const projects = await apiRequest("/individual/projects", "GET");

    if (!projects) return;

    allProjectsCache = projects;

    renderProjectsTable(projects);

}

function filterProjects(query) {

    query = query.trim().toLowerCase();

    if (!query) {

        renderProjectsTable(allProjectsCache);
        return;

    }

    const filtered = allProjectsCache.filter(project => {

        return (

            project.project_name.toLowerCase().includes(query) ||

            project.project_code.toLowerCase().includes(query) ||

            project.location.toLowerCase().includes(query) ||

            project.status.toLowerCase().includes(query) ||

            project.role.toLowerCase().includes(query)

        );

    });

    renderProjectsTable(filtered);

}

function renderProjectsTable(projects) {

    const tbody = document.getElementById("browseProjectsBody");

    tbody.innerHTML = "";

    if (projects.length === 0) {

        tbody.innerHTML = `

            <tr>

                <td colspan="5">
                    No Projects Found
                </td>

            </tr>

        `;

        return;

    }

    projects.forEach(project => {

        const row = document.createElement("tr");

        row.dataset.projectCode = project.project_code;

        row.innerHTML = `

            <td>${escapeHtml(project.project_name)}</td>

            <td>${escapeHtml(project.project_code)}</td>

            <td>${escapeHtml(project.status)}</td>

            <td>${escapeHtml(project.role)}</td>

            <td>

                <button class="openProjectBtn">
                    Open
                </button>

            </td>

        `;

        tbody.appendChild(row);

    });

}

function attachProjectTableDelegation() {

    const tbody = document.getElementById("browseProjectsBody");

    tbody.addEventListener("click", async (event) => {

        if (!event.target.classList.contains("openProjectBtn")) return;

        const row = event.target.closest("tr");

        await showProject(row.dataset.projectCode);

    });

}

function attachSearch() {

    document.getElementById("searchProject")
        .addEventListener("input", (e) => {

            filterProjects(e.target.value);

        });

}

// ------------------------------------------------------------
// Project Details
// ------------------------------------------------------------
async function loadProject(projectCode) {

    const response = await apiRequest(`/individual/project/${projectCode}`, "GET");

    if (!response) return;

    const project = response.project;

    currentProjectCode = project.project_code;

    document.getElementById("projectName").innerText = project.project_name || "";

    document.getElementById("projectCode").innerText = project.project_code || "";

    document.getElementById("projectLocation").innerText = project.location || "";

    document.getElementById("projectStatus").value = project.status || "Active";

    const progressBar = document.getElementById("progressBar");

    const progressValue = typeof project.progress === "number"
        ? project.progress
        : 0;

    progressBar.style.width = `${progressValue}%`;

    progressBar.innerText = `${progressValue}%`;

    renderOverview(project.tasks || []);

    renderTasks(project.tasks || []);

    renderEngineers(project.engineers || []);

    renderClients(project.clients || []);

}

async function refreshCurrentProject() {

    if (!currentProjectCode) return;

    await loadProject(currentProjectCode);

}

// ------------------------------------------------------------
// Overview
// ------------------------------------------------------------
function renderOverview(tasks) {

    const total = tasks.length;

    const completed = tasks.filter(
        t => (t.status || "").toLowerCase() === "completed"
    ).length;

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

    tbody.innerHTML = "";

    if (tasks.length === 0) {

        tbody.innerHTML = `

            <tr>

                <td colspan="4">
                    No Tasks Yet
                </td>

            </tr>

        `;

        return;

    }

    tasks.forEach(task => {

        const completed =
            (task.status || "").toLowerCase() === "completed";

        const row = document.createElement("tr");

        row.dataset.taskName = task.task_name;

        row.innerHTML = `

            <td>${escapeHtml(task.task_name)}</td>

            <td>${escapeHtml(task.deadline)}</td>

            <td>${escapeHtml(task.status)}</td>

            <td>

                <button
                    class="completeTaskBtn"
                    ${completed ? "disabled" : ""}
                >
                    Complete
                </button>

                <button class="deleteTaskBtn">
                    Delete
                </button>

            </td>

        `;

        tbody.appendChild(row);

    });

}

function attachTasksDelegation() {

    document.getElementById("tasksBody")
        .addEventListener("click", async (event) => {

            const row = event.target.closest("tr");

            if (!row) return;

            const taskName = row.dataset.taskName;

            if (event.target.classList.contains("completeTaskBtn")) {

                await apiRequest("/project/update-task-status", "PUT", {

                    project_code: currentProjectCode,

                    task_name: taskName,

                    status: "Completed"

                });

                await refreshCurrentProject();

            }

            else if (event.target.classList.contains("deleteTaskBtn")) {

                if (!confirm(`Delete "${taskName}"?`)) return;

                await apiRequest("/project/delete-task", "DELETE", {

                    project_code: currentProjectCode,

                    task_name: taskName

                });

                await refreshCurrentProject();

            }

        });

}

function attachAddTaskButton() {

    document.getElementById("addTaskBtn")
        .addEventListener("click", async () => {

            const taskName =
                document.getElementById("taskNameInput").value.trim();

            const deadline =
                document.getElementById("taskDeadlineInput").value;

            if (!taskName) {

                alert("Task name required.");

                return;

            }

            if (!deadline) {

                alert("Deadline required.");

                return;

            }

            const result = await apiRequest("/project/add-task", "POST", {

                project_code: currentProjectCode,

                task_name: taskName,

                deadline: deadline

            });

            if (!result) return;

            document.getElementById("taskNameInput").value = "";

            document.getElementById("taskDeadlineInput").value = "";

            await refreshCurrentProject();

        });

}

function attachUpdateProjectStatusButton() {

    document.getElementById("updateProjectStatusBtn")
        .addEventListener("click", async () => {

            const status =
                document.getElementById("projectStatus").value;

            const result = await apiRequest("/project/update-status", "PUT", {

                project_code: currentProjectCode,

                status: status

            });

            if (!result) return;

            alert(result.message);

            await refreshCurrentProject();

        });

}

// ------------------------------------------------------------
// Engineers
// ------------------------------------------------------------
function renderEngineers(engineers) {

    const tbody = document.getElementById("engineersBody");

    tbody.innerHTML = "";

    if (engineers.length === 0) {

        tbody.innerHTML = `

            <tr>

                <td colspan="2">
                    No Engineers
                </td>

            </tr>

        `;

        return;

    }

    engineers.forEach(engineer => {

        const email = typeof engineer === "string"
            ? engineer
            : engineer.email;

        const status = typeof engineer === "string"
            ? "Invited"
            : engineer.status;

        const row = document.createElement("tr");

        row.innerHTML = `

            <td>${escapeHtml(email)}</td>

            <td>${escapeHtml(status)}</td>

        `;

        tbody.appendChild(row);

    });

}

function attachInviteEngineerButton() {

    document.getElementById("inviteEngineerBtn")
        .addEventListener("click", async () => {

            const email =
                document.getElementById("engineerEmail").value.trim();

            if (!email) {

                alert("Engineer email required.");

                return;

            }

            const result = await apiRequest("/project/invite-engineer", "POST", {

                project_code: currentProjectCode,

                email: email

            });

            if (!result) return;

            document.getElementById("engineerEmail").value = "";

            await refreshCurrentProject();

        });

}

// ------------------------------------------------------------
// Clients
// ------------------------------------------------------------
function renderClients(clients) {

    const tbody = document.getElementById("clientsBody");

    tbody.innerHTML = "";

    if (clients.length === 0) {

        tbody.innerHTML = `

            <tr>

                <td colspan="2">
                    No Clients
                </td>

            </tr>

        `;

        return;

    }

    clients.forEach(client => {

        const email = typeof client === "string"
            ? client
            : client.email;

        const status = typeof client === "string"
            ? "Invited"
            : client.status;

        const row = document.createElement("tr");

        row.innerHTML = `

            <td>${escapeHtml(email)}</td>

            <td>${escapeHtml(status)}</td>

        `;

        tbody.appendChild(row);

    });

}

function attachInviteClientButton() {

    document.getElementById("inviteClientBtn")
        .addEventListener("click", async () => {

            const email =
                document.getElementById("clientEmail").value.trim();

            if (!email) {

                alert("Client email required.");

                return;

            }

            const result = await apiRequest("/project/invite-client", "POST", {

                project_code: currentProjectCode,

                email: email

            });

            if (!result) return;

            document.getElementById("clientEmail").value = "";

            await refreshCurrentProject();

        });

}

// ------------------------------------------------------------
// Logout
// ------------------------------------------------------------
document.getElementById("logoutBtn")
    .addEventListener("click", () => {

        if (!confirm("Are you sure you want to logout?")) return;

        localStorage.removeItem("token");

        window.location.replace("auth.html");

    });

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

// ------------------------------------------------------------
// Init
// ------------------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {

    const token = requireAuthOrRedirect();

    if (!token) return;

    document
        .getElementById("joinProjectBtn")
        .addEventListener("click", joinProject);

    document
        .getElementById("backBtn")
        .addEventListener("click", goBackFromProject);

    document
        .getElementById("overviewBtn")
        .addEventListener("click", () => showProjectTab("overview"));

    document
        .getElementById("tasksBtn")
        .addEventListener("click", () => showProjectTab("tasks"));

    document
        .getElementById("engineersBtn")
        .addEventListener("click", () => showProjectTab("engineers"));

    document
        .getElementById("clientsBtn")
        .addEventListener("click", () => showProjectTab("clients"));

    attachSearch();

    attachProjectTableDelegation();

    attachTasksDelegation();

    attachAddTaskButton();

    attachUpdateProjectStatusButton();

    attachInviteEngineerButton();

    attachInviteClientButton();

    attachAI();

    await showDashboard();

});