const express = require ('express');
const router = express.Router();

const {authantication,authorize} = require('../Middlewares/auth')
const userController = require('../controller/userController')
const user = require('../models/userModel')

// user register
router.post('/register',userController.register)

// user login
router.post('/login',userController.login)

// getuser
router.get("/users",authantication,authorize, userController.getUsers);

// get user by id
router.get("/users/:id", userController.getUserById);

// update user
router.put("/update/:id", userController.updateUser);

// delete user
router.delete("/delete/:id", userController.deleteUser);



module.exports = router;
