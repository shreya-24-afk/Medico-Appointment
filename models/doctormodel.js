const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  qualification: String,
  speciality: String,
  experience: Number,
  contactNo: String,
  image: String
});

module.exports = mongoose.model("Doctor", doctorSchema);