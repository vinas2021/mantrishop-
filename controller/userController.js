const User = require('../models/userModel')
const Payment = require('../models/paymentModel')
const bcrypt = require('bcrypt')
const { generatetoken, setCookie } = require('../utils/token')
const { registerSchema } = require('../Middlewares/uservalidation')

exports.register = async (req, res) => {

  try {
    const { name, email, phone, password } = req.body

    const { error } = registerSchema.validate(req.body);
    console.log(error);

    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }


    const userExist = await User.findOne({ $or: [{ email }, { phone }] });

    if (userExist) {
      return res.status(400).json({ message: 'user is already exist' })
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const userCount = await User.countDocuments();

    const role = userCount === 0 ? "admin" : "user";

    const user = new User({
      name,
      email,
      phone,
      password: hashPassword,
      role
    })

    await user.save();

    res.status(201).json({ message: 'user created successfully', user })
  } catch (error) {
    return res.status(500).json({ message: 'server error', message: error.message })
  }
}

exports.login = async (req, res) => {
  const { login, password } = req.body;

  try {
    if (!login || !password) {
      return res.status(400).json({ message: 'all fields are required' })
    }

    const user = await User.findOne({ $or: [{ "email": login }, { "phone": login }] })
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: ` incorrect ${login} or password.` })
    }
    const token = generatetoken(user._id);
    console.log(`token ${token}`);


    setCookie(res, token);

    user.logIn = true
    await user.save();

    const activuser = await User.countDocuments({ logIn: true })

    res.status(200).json({ activuser, message: 'user login successfully', user, token })
  } catch (error) {

    res.status(500).json({ message: 'server error', message: error });
  }
}

//  Get All Users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "user" })

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Single User by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//  Update User
exports.updateUser = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updatedUser) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, message: "User updated", data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//  Delete User
exports.deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, message: "User deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};