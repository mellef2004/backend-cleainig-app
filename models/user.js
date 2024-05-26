const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  FullName: {
    type: String,
    required: true,
    trim: true,
  },
  UserName: {
    type: String,
    required: true,
    unique: true,
    trim: false,
  },
  Email: {
    type: String,
    required: true,
  },
  Password: {
    type: String,
    required: true,
  },
  Phone: {
    type: String,
    required: true,
  },
  // To be ADD LATER WITH THE UPDATE , AND BY DEFAULT FALSE OR BLANK

  Verifed: {
    type: Boolean,
    default: false,
  },
  ProfileImageUrl: {
    type: String,
  },

  Adresse: {
    type: String,
  },
  otp: {
    type: String,
    default: null,
    expires: "10ms",
  },
});

module.exports = mongoose.model("User", userSchema);
