import User from "../models/User.js";
import bcrypt from "bcrypt";
import { createError } from "../utils/error.js";
import jwt from 'jsonwebtoken';


export const register = async (req, res, next) => {
  try {
    
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(req.body.password, salt);

  
    const newUser = new User({
      ...req.body,
      password: hash,
    });

    await newUser.save();
    res.status(201).send("User has been created successfully.");
  } catch (err) {
    next(err);
  }
};


export const login = async (req, res, next) => {
  try {
    
    const user = await User.findOne({ username: req.body.username });
    if (!user) return next(createError(404, "User not found!"));

   
    const isPasswordCorrect = await bcrypt.compare(req.body.password, user.password);
    if (!isPasswordCorrect) return next(createError(400, "Invalid username or password!"));

    
    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT,
      { expiresIn: "1h" }
    );

    
    const { password, ...otherDetails } = user._doc;

    
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 86400000,
    };

    
    res
      .cookie("access_token", token, cookieOptions)
      .status(200)
      .json({ details: { ...otherDetails }, isAdmin: user.isAdmin });
  } catch (err) {
    next(err);
  }
};
