const token = localStorage.getItem("token");

if (!token) {

    window.location.href = "auth.html";

}



const projectsContainer = document.getElementById("projectsContainer");

const joinProjectBtn = document.getElementById("joinProjectBtn");

const logoutBtn = document.getElementById("logoutBtn");



async function loadProjects() {

    try {

        const response = await fetch(`${API_BASE_URL}/individual/projects`, {

            method: "GET",

            headers: {

                "Authorization": `Bearer ${token}`

            }

        });

        const projects = await response.json();

        projectsContainer.innerHTML = "";

        if (!response.ok) {

            alert(projects.detail || "Failed to load projects.");

            return;

        }

        if (projects.length === 0) {

            projectsContainer.innerHTML = `
                <div class="no-projects">
                    No projects joined yet.
                </div>
            `;

            return;

        }

        projects.forEach(project => {

            const card = document.createElement("div");

            card.className = "project-card";

            card.innerHTML = `

                <h4>${project.project_name}</h4>

                <div class="project-info">

                    <p><strong>Code:</strong> ${project.project_code}</p>

                    <p><strong>Status:</strong> ${project.status}</p>

                    <p><strong>Role:</strong> ${project.role}</p>

                </div>

                <button onclick="openProject('${project.project_code}')">
                    Open Project
                </button>

            `;

            projectsContainer.appendChild(card);

        });

    }

    catch (error) {

        console.error(error);

        alert("Unable to connect to server.");

    }

}



async function joinProject() {

    const projectCode = document.getElementById("projectCode").value.trim();

    if (!projectCode) {

        alert("Enter Project Code.");

        return;

    }

    try {

        const response = await fetch(`${API_BASE_URL}/individual/join-project`, {

            method: "PUT",

            headers: {

                "Content-Type": "application/json",

                "Authorization": `Bearer ${token}`

            },

            body: JSON.stringify({

                project_code: projectCode

            })

        });

        const result = await response.json();

        if (!response.ok) {

            alert(result.detail || "Unable to join project.");

            return;

        }

        alert(result.message);

        document.getElementById("projectCode").value = "";

        loadProjects();

    }

    catch (error) {

        console.error(error);

        alert("Unable to connect to server.");

    }

}



function openProject(projectCode) {

    localStorage.setItem("selectedProject", projectCode);

    window.location.href = "project.html";

}


logoutBtn.addEventListener("click", () => {

    const confirmLogout = confirm("Are you sure you want to logout?");

    if (!confirmLogout) {
        return;
    }

    localStorage.removeItem("token");

    localStorage.removeItem("selectedProject");

    window.location.href = "auth.html";

});



joinProjectBtn.addEventListener("click", joinProject);



loadProjects();