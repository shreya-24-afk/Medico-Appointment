// ================= FORM SWITCH =================
function showForm(formId) {
    document.querySelectorAll(".form-box").forEach(form => {
        form.classList.remove("active");
    });
    document.getElementById(formId).classList.add("active");
}

function loadNavbar() {
    const nav = document.getElementById("navItems");
    if (!nav) return;

    const user = JSON.parse(localStorage.getItem("user"));

    // 🔴 NOT LOGGED IN
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

    // 👤 USER NAVBAR
    if (user.role === "user") {
        nav.innerHTML = `
            <li class="nav_item">
                <a href="index.html" class="nav_link">Home</a>
                <a href="about.html" class="nav_link">About</a>
                <a href="doctors-card.html" class="nav_link">Doctors</a>
                <a href="patient.html" class="nav_link">Patient Dashboard</a>
                <a href="#" onclick="logout()" class="nav_link">Logout</a>
            </li>
        `;
    }

    // 🧑‍⚕️ DOCTOR NAVBAR
    else if (user.role === "doctor") {
        nav.innerHTML = `
            <li class="nav_item">
                <a href="index.html" class="nav_link">Home</a>
                <a href="doctor-approval.html" class="nav_link">Doctor Dashboard</a>
                <a href="#" onclick="logout()" class="nav_link">Logout</a>
            </li>
        `;
    }

    // 🛠️ ADMIN NAVBAR
    else if (user.role === "admin") {
        nav.innerHTML = `
            <li class="nav_item">
                <a href="index.html" class="nav_link">Home</a>
                <a href="about.html" class="nav_link">About</a>
                <a href="doctors-card.html" class="nav_link">Doctors</a>
                <a href="admin.html" class="nav_link">Admin Dashboard</a>
                <a href="#" onclick="logout()" class="nav_link">Logout</a>
            </li>
        `;
    }
}

// 🔓 LOGOUT
function logout() {
    localStorage.removeItem("user");
    window.location.href = "login.html";
}



// ================= SIGNUP =================
async function signup() {
    const name = document.getElementById("signupName").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;

    try {
        const res = await fetch("http://localhost:5000/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password })
        });

        const data = await res.json();
        alert(data);
        showForm("user");

    } catch (err) {
        alert("Server error");
    }
}


// ================= USER LOGIN =================
async function userLogin() {
    const email = document.getElementById("userEmail").value;
    const password = document.getElementById("userPassword").value;

    try {
        const res = await fetch("http://localhost:5000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        alert(data.message);

        if (data.message.includes("Successful")) {

            // ✅ STORE USER + ROLE (VERY IMPORTANT)
            localStorage.setItem("user", JSON.stringify({
                email: data.email || email,
                role: data.role
            }));

            // 🔀 REDIRECT BASED ON ROLE
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


// ================= BOOK DOCTOR =================
// function bookDoctor(email) {
//     localStorage.setItem("doctorEmail", email);
//     window.location.href = "book.html";
// }


// ================= BOOK APPOINTMENT =================

//booking doctordropdown
async function loadDoctorDropdown() {
    const res = await fetch("http://localhost:5000/doctors");
    const doctors = await res.json();

    const select = document.getElementById("doctorSelect");
    if (!select) return;

    select.innerHTML = `<option value="">-- Choose Doctor --</option>`;

    doctors.forEach(doc => {
        select.innerHTML += `
            <option value="${doc.email}">${doc.name}</option>
        `;
    });
}



//doctor login
async function doctorLogin() {
   const email = document.getElementById("doctorEmail").value.trim();
const password = document.getElementById("doctorPassword").value.trim();

    try {
        const res = await fetch("http://localhost:5000/doctor-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
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

