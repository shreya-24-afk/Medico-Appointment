const mongoose = require("mongoose");

const AppointmentSchema = new mongoose.Schema({
    patientEmail: String,
    doctorEmail: String,
    doctorName: String,   
    speciality: String,
    patientName: String,
    age: Number,
    date: String,
    time: String,
    status: { type: String, default: "pending" }
});

module.exports = mongoose.model("Appointment", AppointmentSchema);