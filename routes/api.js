const express = require("express");
const router = express.Router();
const Internship = require("../models/internship");
const Student = require("../models/student");
const Employer = require("../models/employer");
const Application = require("../models/applications");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET =
  "sdjkfh8923yhjdksbfma@#*(&@*!^#&@bhjb2qiuhesdbhjdsfg839ujkdhfjk";

// INTERNSHIPS

// get all internships
router.get("/internships", function (req, res, next) {
  Internship.find({})
    .then(function (internships) {
      res.send(internships);
    })
    .catch(next);
});

// post an internship
router.post("/internships", function (req, res, next) {
  Internship.create(req.body)
    .then(function (internship) {
      res.send(internship);
    })
    .catch(next);
});

// get one internship
router.get("/internships/:id", function (req, res, next) {
  Internship.findOne({ _id: req.params.id })
    .then(function (internship) {
      res.send(internship);
    })
    .catch(next);
});

// update internship
router.put("/internships/:id", function (req, res, next) {
  Internship.findByIdAndUpdate({ _id: req.params.id }, req.body)
    .then(function () {
      Internship.findOne({ _id: req.params.id }).then(function (internship) {
        res.send(internship);
      });
    })
    .catch(next);
});

// delete internship
router.delete("/internships/:id", async function (req, res, next) {
  try {
    await Internship.findByIdAndRemove({ _id: req.params.id }).then((data) => {
      console.log(data)
    })
    await Application.deleteMany({ jobId: req.params.id}).then((data) => {
      console.log(data)
    });
    res.status(200).send();
  }catch(error) {
    res.status(500).send();
  }
});

// EMPLOYERS

// create an employer
router.post("/employer/register", async (req, res) => {
  const { name, password: plainTextPassword, email } = req.body;

  if (!name || typeof name !== "string") {
    return res.json({ status: "error", error: "Invalid username" });
  }

  if (!plainTextPassword || typeof plainTextPassword !== "string") {
    return res.json({ status: "error", error: "Invalid password" });
  }

  if (plainTextPassword.length < 5) {
    return res.json({
      status: "error",
      error: "Password too small. Should be atleast 6 characters",
    });
  }

  if (!email || typeof email !== "string") {
    return res.json({ status: "error", error: "Invalid email" });
  }

  const password = await bcrypt.hash(plainTextPassword, 10);

  try {
    const response = await Employer.create({
      name,
      password,
      email,
    });
    console.log("Employer created successfully: ", response);
  } catch (error) {
    if (error.code === 11000) {
      // duplicate key
      return res.json({ status: "error", error: "Username already in use" });
    }
    throw error;
  }

  res.json({ status: "ok" });
});

// Sign In Employer
router.post("/employer/login", async (req, res, next) => {
  try {
    let employer = await Employer.findOne({ where: { email: req.body.email } });
    if (!employer) {
      return res.status(401).json({
        status: failed,
        message: "Authentication Failed: User with email address not found.",
      });
    }
    bcrypt.compare(req.body.password, employer.password).then((response) => {
      if (!response) {
        return res.status(401).json({
          status: false,
          message: "Authentication Failed: Incorrect password.",
        });
      }
      let authToken = jwt.sign(
        { email: employer.email, id: employer._id, name: employer.name, type: "employer" },
        JWT_SECRET
      );
      return res.status(200).json({
        status: true,
        message: "User authentication successful",
        user: { name: employer.name, email: employer.email, id: employer._id, type: "employer" },
        token: authToken,
        expiresIn: 3600,
      });
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Oopss! Something is wrong...",
    });
  }
});

// get all employers
router.get("/employers", function (req, res, next) {
  Employer.find({})
    .then(function (employers) {
      res.send(employers);
    })
    .catch(next);
});

// update employer details
router.put("/employer/:id", function (req, res, next) {
  Employer.findByIdAndUpdate({ _id: req.params.id }, req.body)
    .then(function () {
      Employer.findOne({ _id: req.params.id }).then(function (employer) {
        let authToken = jwt.sign(
          { email: employer.email, id: employer._id, name: employer.name, type: "employer" },
          JWT_SECRET
        );
        return res.status(200).json({
          user: { name: employer.name, email: employer.email, id: employer._id, type: "employer" },
          token: authToken,
          expiresIn: 3600,
        });
      });
    })
    .catch(next);
});

// STUDENTS

// create a student
router.post("/student/register", async (req, res) => {
  const { name, password: plainTextPassword, email, resumeLink } = req.body;

  if (resumeLink == '' || typeof resumeLink !== "string") {
    return res.json({ status: "error", error: "No Resume Link Found" });
  }
  if (!name || typeof name !== "string") {
    return res.json({ status: "error", error: "Invalid username" });
  }

  if (!plainTextPassword || typeof plainTextPassword !== "string") {
    return res.json({ status: "error", error: "Invalid password" });
  }

  if (plainTextPassword.length < 5) {
    return res.json({
      status: "error",
      error: "Password too small. Should be atleast 6 characters",
    });
  }

  if (!email || typeof email !== "string") {
    return res.json({ status: "error", error: "Invalid email" });
  }

  const password = await bcrypt.hash(plainTextPassword, 10);

  try {
    const response = await Student.create({
      name,
      password,
      email,
      resumeLink
    });
    console.log("Student created successfully: ", response);
  } catch (error) {
    if (error.code === 11000) {
      // duplicate key
      return res.json({ status: "error", error: "Username already in use" });
    }
    throw error;
  }

  res.json({ status: "ok" });
});

// Sign In Student
router.post("/student/login", async (req, res, next) => {
  try {
    let student = await Student.findOne({ where: { email: req.body.email } });
    if (!student) {
      return res.status(401).json({
        status: false,
        message: "Authentication Failed: User with email address not found.",
      });
    }
    bcrypt.compare(req.body.password, student.password).then((response) => {
      if (!response) {
        return res.status(401).json({
          status: false,
          message: "Authentication Failed: Incorrect password.",
        });
      }
      let authToken = jwt.sign(
        { email: student.email, id: student._id, name: student.name, type: "student", resumeLink: student.resumeLink },
        JWT_SECRET
      );
      return res.status(200).json({
        status: true,
        message: "User authentication successful",
        user: { name: student.name, email: student.email, id: student._id, type: "student", resumeLink: student.resumeLink },
        token: authToken,
        expiresIn: 3600,
      });
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Oopss! Something is wrong...",
    });
  }
});

// get all students
router.get("/students", function (req, res, next) {
  Student.find({})
    .then(function (students) {
      res.send(students);
    })
    .catch(next);
});

// update student details
router.put("/student/:id", function (req, res, next) {
  Student.findByIdAndUpdate({ _id: req.params.id }, req.body)
    .then(function () {
      Student.findOne({ _id: req.params.id }).then(function (student) {
        let authToken = jwt.sign(
          { email: student.email, id: student._id, name: student.name, type: "student", resumeLink: student.resumeLink },
          JWT_SECRET
        );
        res.send({
            user: { name: student.name, email: student.email, id: student._id, type: "student", resumeLink: student.resumeLink },
            token: authToken,
            expiresIn: 3600,
          });
      });
    })
    .catch(next);
});

// APPLICATIONS

// create an application
router.post("/createApplication", async (req, res) => {
  const {  name, email, employerId, jobId, studentId, resumeLink } = req.body;

  if (!employerId || typeof employerId !== "string") {
    return res.json({ status: "error", error: "Invalid employerId" });
  }

  if (!jobId || typeof jobId !== "string") {
    return res.json({ status: "error", error: "Invalid jobId" });
  }

  if (!studentId || typeof studentId !== "string") {
    return res.json({ status: "error", error: "Invalid studentId" });
  }

  if (!resumeLink || typeof resumeLink !== "string") {
    return res.json({ status: "error", error: "No Resume Link Found" });
  }
  if (!name || typeof name !== "string") {
    return res.json({ status: "error", error: "Invalid username" });
  }

  if (!email || typeof email !== "string") {
    return res.json({ status: "error", error: "Invalid email" });
  }


  try {
    const response = await Application.create({
      name, email, employerId, jobId, studentId, resumeLink
    });
    console.log("You have applied successfully!", response);
  } catch (error) {
    if (error.code === 11000) {
      // duplicate key
      return res.status(400).json({ status: "error", error: "Application already in use" });
    }
    throw error;
  }

  res.status(200).json({ status: "ok" });
});

// view all applications
router.get("/applications", function (req, res, next) {
  Application.find({})
    .then(function (applications) {
      res.send(applications);
    })
    .catch(next);
});

// update applicant's status
router.put("/applications/:id", function (req, res, next) {
  Application.updateOne({ _id: req.params.id }, {status:req.body.status})
    .then(function () {
      Application.findOne({ studentId: req.params.id }).then(function (application) {
        res.send(application);
      });
    })
    .catch(next);
});

// delete application
router.delete("/applications/:id", function (req, res, next) {
  console.log("I am here")
  Application.deleteOne({ _id: req.params.id })
    .then(function (data) {
      console.log("delte", data)
      res.status(200).send();
    })
    .catch(next);
});

// get particular employer's applications
router.get("/employerApplicants/:id", function (req, res, next) {
  Application.where({ employerId: req.params.id})
    .then(function (application) {
      res.send(application);
    })
    .catch(next);
});

// get particular student's applications
router.get("/studentApplicants/:id", function (req, res, next) {
  Application.where({ studentId : req.params.id})
    .then(function (application) {
      res.send(application);
    })
    .catch(next);
});

router.get("/application/:id", (req, res, next) => {
  Application.find({ _id : req.params.id})
  .then(function (application) {
    res.send(application);
  })
  .catch(next);
})

// get all internship for an employer
router.get("/employer/job/:id", async (req, res) => {
  try {
    const apps = await Internship.find({ employerId: req.params.id });
    if (apps){ res.status(200).send(apps)}
    else { res.status(200).send([])}
  }catch(err){
    res.status(500);
  }
})

router.get("/employer/job/view/:jobid", async (req, res) => {
  try {
    const job = await Internship.find({ _id: req.params.jobid });
    const apps = await Application.find({ jobId: req.params.jobid });
    if (apps && job){ res.status(200).send({ "job": job, "applications": apps })}
    else { res.status(200).send({ "job": [], "applications": [] })}
  }catch(err){
    res.status(500);
  }
})


module.exports = router;
