const mongoose = require("mongoose");

const { Schema } = mongoose;

const userSchema = new Schema({
  name: { type: String, required: true },
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = User;
