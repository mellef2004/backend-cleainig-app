const express = require("express");
const router = express.Router();
const User = require("../models/user");

router.post("/add", async (req, res) => {
  try {
    console.log(req.body); // Add this line
    const newUser = new User(req.body);
    const SavedUser = await newUser.save();
    res.json(SavedUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/update/:id", async (req, res) => {
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

router.patch("/update/profileimg/users/:id", async (req, res) => {
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

router.delete("delete/users/:id", async (req, res) => {
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
