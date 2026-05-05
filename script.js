// ================= BASE URL =================
const BASE_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : "https://medico-appointment.onrender.com";



// ================= FORM SWITCH =================
function showForm(formId) {
    var forms = document.querySelectorAll(".form-box");
    for (var i = 0; i < forms.length; i++) {
        forms[i].classList.remove("active");
    }
    var target = document.getElementById(formId);
    if (target) target.classList.add("active");
}


// ================= FORGOT PASSWORD =================
function goToReset() {
    const email = document.getElementById("forgotEmail").value;

    if (!email) {
        alert("Please enter email");
        return;
    }

    const cleanEmail = email.trim().toLowerCase();
    localStorage.setItem("resetEmail", cleanEmail);

    showForm("reset");
}


// ================= NAVBAR =================
function loadNavbar() {
    var nav = document.getElementById("navItems");
    if (!nav) return;

    var user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
        nav.innerHTML = `
            <li class="nav_item">
                <a href="index.html" class="nav_link">Home</a>
                <a href="about.html" class="nav_link">About</a>
                <a href="login.html" class="nav_link">Login</a>
            </li>
        `;
        return;
    }

    if (user.role === "user") {
        nav.innerHTML = `
            <li class="nav_item">
                <a href="index.html">Home</a>
                <a href="about.html">About</a>
                <a href="doctors-card.html">Doctors</a>
                <a href="patient.html">Dashboard</a>
                <a href="#" onclick="logout()">Logout</a>
            </li>
        `;
    } 
    else if (user.role === "doctor") {
        nav.innerHTML = `
            <li class="nav_item">
                <a href="index.html">Home</a>
                <a href="doctor-approval.html">Dashboard</a>
                <a href="#" onclick="logout()">Logout</a>
            </li>
        `;
    } 
    else if (user.role === "admin") {
        nav.innerHTML = `
            <li class="nav_item">
                <a href="index.html">Home</a>
                <a href="about.html">About</a>
                <a href="doctors-card.html">Doctors</a>
                <a href="admin.html">Dashboard</a>
                <a href="#" onclick="logout()">Logout</a>
            </li>
        `;
    }
}


// ================= LOGOUT =================
function logout() {
    localStorage.removeItem("user");
    window.location.href = "login.html";
}


// ================= SIGNUP =================
async function signup() {
    var name = document.getElementById("signupName").value;
    var email = document.getElementById("signupEmail").value.trim().toLowerCase();
    var password = document.getElementById("signupPassword").value;

    try {
        var res = await fetch(BASE_URL + "/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password })
        });

        var data = await res.json();
        alert(data.message || "Signup successful");
        showForm("user");

    } catch (err) {
        alert("Server error");
    }
}


// ================= USER LOGIN =================
async function userLogin() {
    var email = document.getElementById("userEmail").value.trim().toLowerCase();
    var password = document.getElementById("userPassword").value;

    try {
        var res = await fetch(BASE_URL + "/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        var data = await res.json();

        if (data.success) {
            localStorage.setItem("user", JSON.stringify({
                email: data.email,
                role: data.role,
                name: data.name
            }));

            if (data.role === "admin") {
                window.location.href = "admin.html";
            } 
            else if (data.role === "doctor") {
                window.location.href = "doctor-approval.html";
            } 
            else {
                window.location.href = "doctors-card.html";
            }

        } else {
            alert(data.message);
        }

    } catch (err) {
        alert("Server error");
    }
}


// ================= RESET PASSWORD =================
async function resetPassword() {
    const password = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (!password || !confirmPassword) {
        alert("Please fill all fields");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match");
        return;
    }

    const email = localStorage.getItem("resetEmail");

    if (!email) {
        alert("Email not found. Please try again.");
        return;
    }

    try {
        const res = await fetch(BASE_URL + "/reset-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
            alert("Password updated successfully");

            localStorage.removeItem("resetEmail");
            showForm("user");

        } else {
            alert(data.message);
        }

    } catch (err) {
        alert("Server error");
    }
}


// ================= LOAD DOCTORS =================
async function loadDoctorDropdown() {
    try {
        var res = await fetch(BASE_URL + "/doctors");
        var doctors = await res.json();

        var select = document.getElementById("doctorSelect");
        if (!select) return;

        select.innerHTML = `<option value="">-- Choose Doctor --</option>`;

        doctors.forEach(doc => {
            select.innerHTML += `
                <option value="${doc.email}">
                    ${doc.name}
                </option>
            `;
        });

    } catch (err) {
        console.log("Error loading doctors");
    }
}


// ================= DOCTOR LOGIN =================
async function doctorLogin() {
    var email = document.getElementById("doctorEmail").value.trim();
    var password = document.getElementById("doctorPassword").value.trim();

    try {
        var res = await fetch(BASE_URL + "/doctor-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        var data = await res.json();
        alert(data.message);

        if (data.role === "doctor") {
            localStorage.setItem("user", JSON.stringify({
                email: data.email,
                role: "doctor",
                name: data.name
            }));

            window.location.href = "doctor-approval.html";
        }

    } catch (err) {
        alert("Server error");
    }
}


// ================= AUTO LOAD =================
document.addEventListener("DOMContentLoaded", function () {
    loadNavbar();
    loadDoctorDropdown();
});