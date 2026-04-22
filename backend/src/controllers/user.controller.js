import * as bcrypt from "bcrypt";
import crypto from "crypto";
import { Meeting } from "../models/meeting.model.js";
import { User } from "../models/user.model.js";

// ✅ LOGIN
const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Please Provide details" });
  }

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    const token = crypto.randomBytes(20).toString("hex");
    user.token = token;
    await user.save();

    return res.status(200).json({ token });
  } catch (e) {
    console.log("LOGIN ERROR:", e);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ✅ REGISTER
const register = async (req, res) => {
  const { name, username, password } = req.body;

  if (!name || !username || !password) {
    return res.status(400).json({ message: "Please Provide details" });
  }

  try {
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      username,
      password: hashedPassword,
    });

    await newUser.save();

    return res.status(201).json({ message: "New user registered" });
  } catch (e) {
    console.log("REGISTER ERROR:", e);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ✅ GET HISTORY
const getUserHistory = async (req, res) => {
  const { token } = req.query;

  try {
    const user = await User.findOne({ token });

    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const meetings = await Meeting.find({ user_id: user.username });

    return res.json(meetings);
  } catch (e) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ✅ ADD TO HISTORY
const addToHistory = async (req, res) => {
  const { token, meeting_code } = req.body;

  try {
    const user = await User.findOne({ token });

    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const newMeeting = new Meeting({
      user_id: user.username,
      meetingCode: meeting_code,
    });

    await newMeeting.save();

    return res.status(201).json({ message: "Added code to history" });
  } catch (e) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export { addToHistory, getUserHistory, login, register };
