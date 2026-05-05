const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const nodemailer = require("nodemailer");
const cors = require("cors");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");

// MODELS
const User = require("./models/usermodel"); 
const Doctor = require("./models/doctormodel"); 
const Appointment = require("./models/appointmentmodel");

const app = express();

// ================= CORS =================
app.use(cors({
  origin: [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "https://YOUR-FRONTEND.github.io"
  ],
  credentials: true
}));

// ================= MIDDLEWARE =================
app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================= EMAIL =================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
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

// ================= DB =================
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("DB connected"))
.catch(err => console.log("DB error", err));


// ================= SIGNUP =================
app.post("/signup", async (req, res) => {
  let { name, email, password } = req.body;

  try {
    email = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.json({ success: true, message: "Signup Successful" });

  } catch (err) {
    res.status(500).json({ success: false, message: "Error" });
  }
});


// ================= LOGIN =================
app.post("/login", async (req, res) => {
  let { email, password } = req.body;

  try {
    email = email.trim().toLowerCase();

    if (email === "admin@gmail.com" && password === "admin123") {
      return res.json({
        success: true,
        role: "admin",
        email,
        message: "Admin Login Successful"
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({ success: false, message: "Invalid Credentials" });
    }

    res.json({
      success: true,
      role: "user",
      email: user.email,
      name: user.name,
      message: "Login Successful"
    });

  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// ================= RESET =================
app.post("/reset-password", async (req, res) => {
  try {
    let { email, password } = req.body;

    email = email.trim().toLowerCase();

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;

    await user.save();

    res.json({ success: true, message: "Password updated successfully" });

  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
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
    res.status(500).json({ message: "Error saving doctor" });
  }
});


// ================= REMOVE DOCTOR =================
app.post("/remove-doctor", async (req, res) => {
  try {
    const { email, user } = req.body;

    if (!user || user.role !== "admin") {
      return res.status(403).json("Unauthorized");
    }

    await Doctor.deleteOne({ email });

    res.json("Doctor removed successfully");

  } catch (err) {
    res.status(500).json("Error removing doctor");
  }
});


// ================= BOOK =================
app.post("/book", async (req, res) => {
  try {
    const { patientName, patientEmail, doctorEmail, date, time, age } = req.body;

    const doctor = await Doctor.findOne({ email: doctorEmail });

    const appointment = new Appointment({
      patientName,
      patientEmail,
      doctorEmail,
      doctorName: doctor ? doctor.name : "Unknown",
      speciality: doctor ? doctor.speciality : "General",
      age,
      date,
      time,
      status: "pending"
    });

    await appointment.save();

    res.json("Appointment Booked Successfully");

  } catch (err) {
    res.json("Error booking appointment");
  }
});


// ================= DOCTOR LOGIN =================
app.post("/doctor-login", async (req, res) => {
  const doctor = await Doctor.findOne(req.body);
  if (!doctor) return res.json({ message: "Invalid credentials" });

  res.json({
    message: "Login Successful",
    role: "doctor",
    email: doctor.email,
    name: doctor.name
  });
});


// ================= DOCTOR APPOINTMENTS =================
app.get("/doctor-appointments/:email", async (req, res) => {
  const data = await Appointment.find({ doctorEmail: req.params.email });
  res.json(data);
});


// ================= APPROVE =================
app.post("/approve-appointment", async (req, res) => {
  const appointment = await Appointment.findByIdAndUpdate(
    req.body.id,
    { status: "approved" },
    { new: true }
  );

  transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: appointment.patientEmail,
    subject: "Appointment Approved",
    text: `Hello ${appointment.patientName}, your appointment is approved`
  }).catch(() => {});

  res.json({ message: "Appointment Approved" });
});


// ================= REJECT =================
app.post("/reject-appointment", async (req, res) => {
  const appointment = await Appointment.findByIdAndUpdate(
    req.body.id,
    { status: "rejected" },
    { new: true }
  );

  transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: appointment.patientEmail,
    subject: "Appointment Rejected",
    text: `Hello ${appointment.patientName}, your appointment is rejected`
  }).catch(() => {});

  res.json({ message: "Appointment Rejected" });
});


// ================= PATIENT =================
app.get("/patient-appointments/:email", async (req, res) => {
  const data = await Appointment.find({ patientEmail: req.params.email });
  res.json(data);
});


// ================= ADMIN =================
app.get("/admin-stats", async (req, res) => {
  const totalDoctors = await Doctor.countDocuments();
  const totalAppointments = await Appointment.countDocuments();
  const uniquePatients = await Appointment.distinct("patientEmail");

  const today = new Date().toISOString().split("T")[0];

  const todayAppointments = await Appointment.countDocuments({ date: today });

  res.json({
    totalDoctors,
    totalAppointments,
    totalPatients: uniquePatients.length,
    todayAppointments
  });
});

app.get("/recent-appointments", async (req, res) => {
  const data = await Appointment.find().sort({ _id: -1 }).limit(5);
  res.json(data);
});

app.get("/appointments", async (req, res) => {
  const data = await Appointment.find();
  res.json(data);
});


// ================= SERVER =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});