// const BASE_URL = window.location.hostname === "localhost"
// ? "http://localhost:5000"
// : "https://medico-appointment.onrender.com";


// ================= FORM SWITCH =================
// function showForm(formId) {
//     document.querySelectorAll(".form-box").forEach(form => {
//         form.classList.remove("active");
//     });
//     document.getElementById(formId).classList.add("active");
// }

// ================= BASE URL =================
const BASE_URL = (window.location.hostname === "localhost")
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

// ================= NAVBAR =================
function loadNavbar() {
var nav = document.getElementById("navItems");
if (!nav) return;


var user = JSON.parse(localStorage.getItem("user"));

if (!user) {
    nav.innerHTML =
        <li class="nav_item"> +
        <a href="index.html" class="nav_link">Home</a> +
        <a href="about.html" class="nav_link">About</a> +
        <a href="login.html" class="nav_link">Login</a> +
        </li>
    return;
}

if (user.role === "user") {
    nav.innerHTML =
        <li class="nav_item"> +
        <a href="index.html" class="nav_link">Home</a> +
        <a href="about.html" class="nav_link">About</a>+
        <a href="doctors-card.html" class="nav_link">Doctors</a> +
        <a href="patient.html" class="nav_link">Patient Dashboard</a> +
        <a href="#" onclick="logout()" class="nav_link">Logout</a> +
        </li>
} else if (user.role === "doctor") {
    nav.innerHTML =
        <li class="nav_item">+
        <a href="index.html" class="nav_link">Home</a> +
        <a href="doctor-approval.html" class="nav_link">Doctor Dashboard</a> +
        <a href="#" onclick="logout()" class="nav_link">Logout</a> +
        </li>
} else if (user.role === "admin") {
    nav.innerHTML =
        <li class="nav_item"> +
        <a href="index.html" class="nav_link">Home</a> +
        <a href="about.html" class="nav_link">About</a> +
        <a href="doctors-card.html" class="nav_link">Doctors</a> +
        <a href="admin.html" class="nav_link">Admin Dashboard</a> +
        <a href="#" onclick="logout()" class="nav_link">Logout</a> +
        </li>
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
var email = document.getElementById("signupEmail").value;
var password = document.getElementById("signupPassword").value;


try {
    var res = await fetch(BASE_URL + "/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name, email: email, password: password })
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
var email = document.getElementById("userEmail").value;
var password = document.getElementById("userPassword").value;


try {
    var res = await fetch(BASE_URL + "/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, password: password })
    });

    var data = await res.json();
    alert(data.message);

    if (data.message && data.message.indexOf("Successful") !== -1) {
        localStorage.setItem("user", JSON.stringify({
            email: data.email || email,
            role: data.role
        }));

        if (data.role === "admin") {
            window.location.href = "admin.html";
        } else {
            window.location.href = "doctors-card.html";
        }
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

    select.innerHTML = '<option value="">-- Choose Doctor --</option>';

    for (var i = 0; i < doctors.length; i++) {
        select.innerHTML +=
            <option value="' + doctors[i].email + '"> +
            doctors[i].name +
            </option>
    }

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
        body: JSON.stringify({ email: email, password: password })
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


