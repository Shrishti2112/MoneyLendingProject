const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
require("./db/config");

const User = require("./db/user");

const app = express();
const jwtKey = "money-Lending";

app.use(express.json());
app.use(cors());

app.post("/register", async (req, res) => {
  try {
    const userData = req.body;
    console.log("User data:", userData);

    if (userData.dateofRegistration) {
      userData.dateofRegistration = new Date(userData.dateofRegistration);
    }

    const birthDate = new Date(userData.dob);
    const salary = Number(userData.monthlySalary);

    const currentDate = new Date();
    let age = currentDate.getFullYear() - birthDate.getFullYear();
    const monthDifference = currentDate.getMonth() - birthDate.getMonth();
    if (
      monthDifference < 0 ||
      (monthDifference === 0 && currentDate.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    console.log("Parsed birthdate:", birthDate);
    console.log("Calculated age:", age);
    console.log("Parsed salary:", salary);

    if (age <= 20) {
      return res
        .status(400)
        .send({ error: "User must be above 20 years old." });
    }

    if (salary < 25000) {
      return res
        .status(400)
        .send({ error: "User's monthly salary must be at least 25,000." });
    }

    let user = new User(userData);
    let result = await user.save();
    result = result.toObject();
    delete result.password;

    jwt.sign({ result }, jwtKey, (err, token) => {
      if (err) {
        return res.status(500).send({ error: "Error in generating token" });
      } else {
        return res.send({ result, auth: token });
      }
    });
  } catch (error) {
    res.status(500).send("Error registering user: " + error.message);
  }
});

app.post("/login", async (req, res) => {
  if (req.body.email && req.body.password) {
    let user = await User.findOne(req.body).select("-password");

    if (user) {
      jwt.sign({ user }, jwtKey, (err, token) => {
        res.send({ user, auth: token });
      });
    } else {
      res.send("No User Found!!");
    }
  } else {
    res.send("No user found");
  }
});

app.get("/user", async (req, res) => {
  try {
    const data = await User.find(
      {},
      "powerAmount phoneNumber email dateofRegistration dob monthlySalary"
    );
    if (data.length > 0) {
      res.send(data);
    } else {
      res.status(404).send("No data found!!!");
    }
  } catch (error) {
    res.status(500).send("Error fetching data: " + error.message);
  }
});

app.post("/borrow", async (req, res) => {
  try {
    const { email, borrowAmount, tenureMonths } = req.body;

    if (!email || !borrowAmount || !tenureMonths) {
      return res.status(400).send({
        error: "Please provide email, borrow amount, and tenure months.",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }

    user.powerAmount = Number(user.powerAmount) || 0;

    const principal = Number(borrowAmount);
    const months = Number(tenureMonths);

    if (isNaN(principal) || isNaN(months)) {
      return res
        .status(400)
        .send({ error: "Invalid borrow amount or tenure months." });
    }

    const interestRate = 0.08;
    const monthlyInterestRate = interestRate / 12;
    const monthlyRepayment =
      (principal * monthlyInterestRate) /
      (1 - Math.pow(1 + monthlyInterestRate, -months));

    user.powerAmount += principal;
    await user.save();

    res.send({
      updatedPowerAmount: user.powerAmount.toFixed(2),
      monthlyRepayment: monthlyRepayment.toFixed(2),
    });
  } catch (error) {
    res.status(500).send("Error processing loan request: " + error.message);
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
