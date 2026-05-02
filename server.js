console.log("🔥 CORRECT SERVER FILE RUNNING");

const express = require("express");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const cors = require("cors");
const bcrypt = require("bcrypt");
const multer = require("multer");

const User = require("./models/usermodel");
const Doctor = require("./models/doctormodel");
const Appointment = require("./models/appointmentmodel");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));


// ================= EMAIL SETUP =================
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "shreyast024@gmail.com",      // 🔥 PUT YOUR EMAIL
        pass: "tbtvyiyzrprbctna"          // 🔥 PUT APP PASSWORD (no spaces)
    }
});


// ================= MULTER =================
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });


// ================= DB CONNECTION =================
mongoose.connect("mongodb://127.0.0.1:27017/medico")
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));


// ================= SIGNUP =================
app.post("/signup", async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.json("User already exists");

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            password: hashedPassword
        });

        await user.save();
        res.json("Signup Successful");

    } catch (err) {
        res.json("Error");
    }
});


// ================= LOGIN =================
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        if (email === "admin@gmail.com" && password === "admin123") {
            return res.json({ role: "admin", message: "Admin Login Successful" });
        }

        const user = await User.findOne({ email });
        if (!user) return res.json({ role: "user", message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            res.json({ role: "user", message: "Login Successful" });
        } else {
            res.json({ role: "user", message: "Invalid Credentials" });
        }

    } catch (err) {
        res.json({ message: "Error" });
    }
});


// ================= RESET =================
app.post("/reset", async (req, res) => {
    const { email, newPassword } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await User.updateOne(
            { email },
            { password: hashedPassword }
        );

        res.json("Password Reset Successful");

    } catch (err) {
        res.json("Error");
    }
});


// ================= DOCTORS =================
app.get("/doctors", async (req, res) => {
    const doctors = await Doctor.find();
    res.json(doctors);
});


// ================= ADD DOCTOR =================
app.post("/add-doctor", upload.single("image"), async (req, res) => {
  try {
    const { name, email, password, qualification, speciality, experience, contactNo } = req.body;

    const newDoctor = new Doctor({
      name,
      email,
      password,
      qualification,
      speciality,
      experience,
      contactNo,
      image: req.file ? req.file.filename : ""
    });

    await newDoctor.save();

    res.json({ message: "Doctor saved in database" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error saving doctor" });
  }
});

//remove doc
app.post("/remove-doctor", async (req, res) => {
     console.log("REMOVE ROUTE HIT");
     
    try {
        const { email, user } = req.body;

        // 🔐 Admin check
        if (!user || user.role !== "admin") {
            return res.status(403).json("Unauthorized");
        }

        await Doctor.deleteOne({ email });

        res.json("Doctor removed successfully");

    } catch (err) {
        console.log(err);
        res.status(500).json("Error removing doctor");
    }
});


// ================= BOOK APPOINTMENT =================
app.post("/book", async (req, res) => {
    try {
        const { patientName, patientEmail, doctorEmail, date, time, age } = req.body;

        const doctor = await Doctor.findOne({ email: doctorEmail });

        const appointment = new Appointment({
            patientName,
            patientEmail,
            doctorEmail,
            doctorName: doctor ? doctor.name : "Unknown Doctor",
            speciality: doctor ? doctor.speciality : "General",
            age,
            date,
            time,
            status: "pending"
        });

        await appointment.save();

        res.json("Appointment Booked Successfully");

    } catch (err) {
        console.log(err);
        res.json("Error booking appointment");
    }
});


// ================= DOCTOR LOGIN =================
app.post("/doctor-login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const doctor = await Doctor.findOne({ email, password });

        if (!doctor) {
            return res.json({ message: "Invalid credentials" });
        }

        res.json({
            message: "Login Successful",
            role: "doctor",
            email: doctor.email,
            name: doctor.name
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server error" });
    }
});


// ================= DOCTOR APPOINTMENTS =================
app.get("/doctor-appointments/:email", async (req, res) => {
    try {
        const doctorEmail = req.params.email;
        const data = await Appointment.find({ doctorEmail });
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: "Error fetching appointments" });
    }
});


// ================= APPROVE =================
app.post("/approve-appointment", async (req, res) => {
    try {
        const { id } = req.body;

        const appointment = await Appointment.findByIdAndUpdate(
            id,
            { status: "approved" },
            { new: true }
        );

        await transporter.sendMail({
            to: appointment.patientEmail,
            subject: "Appointment Approved",
            text: `Hello ${appointment.patientName},
Your appointment on ${appointment.date} at ${appointment.time} has been APPROVED.`
        });

        res.json("Approved & Email Sent");

    } catch (err) {
        console.log(err);
        res.json("Error approving");
    }
});


// ================= REJECT =================
app.post("/reject-appointment", async (req, res) => {
    try {
        const { id } = req.body;

        const appointment = await Appointment.findByIdAndUpdate(
            id,
            { status: "rejected" },
            { new: true }
        );

        await transporter.sendMail({
            to: appointment.patientEmail,
            subject: "Appointment Rejected",
            text: `Hello ${appointment.patientName},
Your appointment on ${appointment.date} at ${appointment.time} has been REJECTED.`
        });

        res.json("Rejected & Email Sent");

    } catch (err) {
        console.log(err);
        res.json("Error rejecting");
    }
});

//patient dashboard//
// ================= PATIENT APPOINTMENTS =================
app.get("/patient-appointments/:email", async (req, res) => {
    try {
        const patientEmail = req.params.email;

        console.log("Patient dashboard for:", patientEmail); // debug

        const data = await Appointment.find({ patientEmail });

        console.log("Patient appointments:", data); // debug

        res.json(data);

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error fetching patient appointments" });
    }
});


// ================= ADMIN STATS =================
app.get("/admin-stats", async (req, res) => {
    console.log("🔥 ADMIN STATS HIT");

    try {
        const totalDoctors = await Doctor.countDocuments();
        const totalAppointments = await Appointment.countDocuments();

        const uniquePatients = await Appointment.distinct("patientEmail");

        const today = new Date().toISOString().split("T")[0];

        const todayAppointments = await Appointment.countDocuments({
            date: today
        });

        res.json({
            totalDoctors,
            totalAppointments,
            totalPatients: uniquePatients.length,
            todayAppointments
        });

    } catch (err) {
        console.log(err);
        res.status(500).json("Error loading stats");
    }
});


// ================= RECENT APPOINTMENTS =================
app.get("/recent-appointments", async (req, res) => {
    console.log("🔥 RECENT APPOINTMENTS HIT");

    try {
        const data = await Appointment.find()
            .sort({ _id: -1 })
            .limit(5);

        res.json(data);

    } catch (err) {
        console.log(err);
        res.status(500).json("Error fetching appointments");
    }
});

// ================= view ALL APPOINTMENTS =================
app.get("/appointments", async (req, res) => {
    console.log("🔥 ALL APPOINTMENTS HIT");

    try {
        const data = await Appointment.find();
        res.json(data);

    } catch (err) {
        console.log(err);
        res.status(500).json("Error fetching appointments");
    }
});

// ================= SERVER =================
app.listen(5000, () => {
    console.log("Server running on port 5000");
});