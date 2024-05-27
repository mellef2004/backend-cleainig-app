const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/user");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const multer = require("multer");

// app config

const app = express();
const port = process.env.PORT;
app.listen(port, () => console.log("SERVER CONNECTION EASTABLISHED"));
app.use(bodyParser.json());
// END APP CONFIG

//MONGO DB CONNECTION
mongoose
  .connect(process.env.MONGO_URI, {})
  .then(() => console.log("DATABASE ESTABLISHED"))
  .catch((err) => console.error(err));

// END MONGO DB CONNECTION

// OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Email Service COnfig
const transporter = nodemailer.createTransport({
  service: "outlook",
  auth: {
    user: process.env.EMAIL,
    pass:  process.env.PASSWORD,
  },
});

async function sendOTPEmail(email, otp) {
  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "Verify Your Email Adress",
    text: `Your one-time Password (OTP) is ${otp}`,
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log("OTP email Sendt Successfully Check the spam");
  } catch (err) {
    console.error("Error sending OTP email:", err);
  }
}

// END OTP

// *******************************ROUTES************************************

{
  /* CREATE NEW USER URI*/
}

app.post("/api/add/users", async (req, res) => {
  try {
    console.log(req.body); // Add this line
    const newUser = new User(req.body);
    const SavedUser = await newUser.save();
    res.json(SavedUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

{
  /*
USER UPDATE
*/
}

app.put("/api/update/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedUser = await User.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!updatedUser) {
      return res.status(404).json({ message: "User Not found" });
    }
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

{
  /*
    PROFILE IMAGE UPDATE
*/
}

app.patch("/api/update/profileimg/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    //UPDATE PROFILE IMAGE
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { ProfileImageUrl: updates.ProfileImageUrl },
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

{
  /* To be tested with frontend */
}
const upload = multer({
  dest: "upload/", // Destination folder for uploaded files
});
// Profile Pic update
app.post(
  "/upload-profile-image",
  upload.single("profileImage"),
  async (req, res) => {
    if (req.file) {
      const userId = req.body.userId; // Assuming user ID from request body

      // Read the image file content
      const imageData = fs.readFileSync(req.file.path, "base64"); // Read as Base64

      try {
        const user = await User.findByIdAndUpdate(
          userId,
          {
            profileImage: `data:${req.file.mimetype};base64,${imageData}`, // Construct Base64 string
          },
          { new: true }
        ); // Return updated user

        if (user) {
          res.json({ message: "Image uploaded successfully!", user });
        } else {
          res.status(404).json({ message: "User not found!" });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error uploading image!" });
      } finally {
        // Clean up temporary file (if using)
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
      }
    } else {
      res.status(400).json({ message: "Failed to upload image!" });
    }
  }
);

{
  /* DELETE USER */
}
app.delete("/api/delete/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await User.findOneAndDelete(id);
    if (!deletedUser) {
      return res.status(400).json({ message: "USer not found" });
    }
    res.json({ message: "User Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

{
  /*  
GET ALL THE USERS
*/
}
app.get("/api/get/users/", async (req, res) => {
  try {
    const Users = await User.find();
    res.json(Users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

{
  /*
OTP REQUEST ROUTE
*/
}

app.post("/api/otp/request/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // FIND the user by email
    const user = await User.findById(id);

    if (!user) {
      // USER not found
      return res.status(404).json({ message: "User Not found" });
    }
    const email = user.Email;
    // GENERATE THE OTP
    if (!user.otp || Date.now() > user.otp.expiresAt) {
      const otp = generateOTP();
      user.otp = otp;
    }
    await user.save();
    await sendOTPEmail(email, user.otp);
    res.json({ message: "OTP sent scuessfully , please check your email" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// LOGIN ROUTER
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status
        .apply(401)
        .json({ message: "invalide email or password" });
    }

    //Compare hashed passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Login Successful
    res.json({ message: "Login successful" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "server error" });
  }
});

// SIGNUP ROUTER
app.post("api/signup", async (req, res) => {
  try {
    const { FullName, UserName, Email, Password, Phone } = req.body;
    //Check existence
    const existingUser = await User.findOne({ $or: [{ UserName }, { Email }] });
    if (existingUser) {
      return res.status(400).json({ FullName, UserName, Email, Phone });
    }

    const newUser = new User([FullName, UserName, Email]);
    //Hash the password
    const salt = await bcrypt.genSalt(10);
    newUser.password = await bcrypt.hash(newUser.password, salt);
    await newUser.save();
    res.json({ message: "Signup sucessful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

//LOGOUt ROUTER
app.get("/api/logout", (req, res) => {
  //LOGOUT
});

app.get("/", (req, res) => {
  res.send("CONNECTION DONE");
});
