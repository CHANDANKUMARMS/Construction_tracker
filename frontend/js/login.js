const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

const BASE_URL = "http://127.0.0.1:8000";

function showLogin() {

    loginTab.classList.add("active");
    signupTab.classList.remove("active");

    loginForm.classList.add("active-form");
    signupForm.classList.remove("active-form");
}

function showSignup() {

    signupTab.classList.add("active");
    loginTab.classList.remove("active");

    signupForm.classList.add("active-form");
    loginForm.classList.remove("active-form");
}

loginTab.addEventListener("click", showLogin);
signupTab.addEventListener("click", showSignup);


// ----------------------
// Login
// ----------------------

loginForm.addEventListener("submit", async function (e) {

    e.preventDefault();

    const username =
        loginForm.querySelector('input[type="text"]').value.trim();

    const password =
        loginForm.querySelector('input[type="password"]').value;

    const button = loginForm.querySelector("button");

    button.disabled = true;

    try {

        const response = await fetch(`${BASE_URL}/login`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                username,
                password
            })

        });

        const data = await response.json();

        if (response.ok) {

            alert(data.message);

            loginForm.reset();

            // Later when JWT is added:
            // localStorage.setItem("token", data.access_token);
            // window.location.href = "dashboard.html";

        } else {

            alert(data.detail || "Login failed.");

        }

    } catch (error) {

        console.error(error);

        alert("Unable to connect to server.");

    } finally {

        button.disabled = false;

    }

});


// ----------------------
// Signup
// ----------------------

signupForm.addEventListener("submit", async function (e) {

    e.preventDefault();

    const name =
        signupForm.querySelectorAll('input[type="text"]')[0].value.trim();

    const email =
        signupForm.querySelector('input[type="email"]').value.trim();

    const username =
        signupForm.querySelectorAll('input[type="text"]')[1].value.trim();

    const password =
        signupForm.querySelector('input[type="password"]').value;

    const button = signupForm.querySelector("button");

    button.disabled = true;

    try {

        const response = await fetch(`${BASE_URL}/signup`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                name,
                email,
                username,
                password

            })

        });

        const data = await response.json();

        if (response.ok) {

            alert(data.message);

            signupForm.reset();

            showLogin();

        } else {

            alert(data.detail || "Signup failed.");

        }

    } catch (error) {

        console.error(error);

        alert("Unable to connect to server.");

    } finally {

        button.disabled = false;

    }

});