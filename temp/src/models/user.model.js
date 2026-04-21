import mongoose, { Schema } from "mongoose";
const userSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
   username: {                // ✅ ADD THIS
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  token: { type: String },
});

const User = mongoose.model("User", userSchema);
export { User };
