const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phoneNumber: { type: Number, required: true },
  email: { type: String, required: true },
  dateofRegistration: { type: Date, default: Date.now },
  dob: { type: Date, required: true },
  monthlySalary: { type: Number, required: true },
  password: { type: String, required: true },
  powerAmount: { type: Number, required: true },
});

module.exports = mongoose.model("user", userSchema);
