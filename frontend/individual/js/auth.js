const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");


loginTab.addEventListener("click", () => {

    loginTab.classList.add("active");
    signupTab.classList.remove("active");

    loginForm.classList.remove("hidden");
    signupForm.classList.add("hidden");

});


signupTab.addEventListener("click", () => {

    signupTab.classList.add("active");
    loginTab.classList.remove("active");

    signupForm.classList.remove("hidden");
    loginForm.classList.add("hidden");

});


loginForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const user = {

        email: document.getElementById("loginEmail").value,
        password: document.getElementById("loginPassword").value

    };

    try {

        const response = await fetch(`${API_BASE_URL}/individual/login`, {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify(user)

        });

        const data = await response.json();

        if (response.ok) {

        localStorage.setItem("token", data.access_token);

        alert(data.message);

        window.location.href = "dashboard.html";

        }
        else {

            alert(data.detail);

        }

    }
    catch (error) {

        alert("Unable to connect to server.");

    }

});


signupForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const password = document.getElementById("signupPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {

        alert("Passwords do not match.");
        return;

    }

    const user = {

        name: document.getElementById("name").value,
        email: document.getElementById("signupEmail").value,
        password: password

    };

    try {

        const response = await fetch(`${API_BASE_URL}/individual/signup`, {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify(user)

        });

        const data = await response.json();

        console.log(data);

        if (response.ok) {

            alert(data.message);

        }
        else {

            alert(data.detail);

        }

    }
    catch (error) {

        alert("Unable to connect to server.");

    }

});