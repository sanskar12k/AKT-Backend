const express = require('express');
const User = require('../models/user');
const Sale = require('../models/sale')
const router = express.Router();
const { authenticateToken, isAuthorized, isAuthorizedForAddingSale, authenticate } = require('../authentication/authenticate');
const jwt = require('jsonwebtoken');
const { userSchema, validateSaleSchema } = require('../schemas/joi');
const bcrypt = require("bcrypt");
const { sendOtp, sendReport } = require('../mailer/sms');

const validateUserSchema = (req, res, next) => {
    const { error } = userSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        next(msg)
    }
    else {
        next();
    }
}

//Creating new user
router.post('/create', validateUserSchema, async (req, res, next) => {
    const { fname, lname, role, number, username, password, store, dob } = req.body;
    //Checking for all required data
    if (!fname || !role || !password || !username) {
        res.status(422).send({ error: 'Please fill all the columns' });
    }
    try {
        const userExist = await User.findOne({ username: username });
        //Checking if user exist
        if (userExist) {
            res.status(422).json({ error: "User already exists" });

        }
        else {
            //Creating new user
            const user = new User({ fname, username, lname, role, number, store, hash: password, dob });
            //Saves data to db
            await user.save();
            res.status(201).json({ message: "User created", user });
            return;
        }
    }

    catch (err) {
        console.log(err);
    }
})

//Logging in user
router.post('/login', async (req, res) => {
    console.log(req.body)
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            req.status(400).json({ err: "Please fill all the columns" });
        }
        //Check for email existence 
        const userEmail = await User.findOne({ username });
        if (userEmail) {
            //Verifying password
            const userPassword = await bcrypt.compare(password, userEmail.hash);
            if (userPassword) {
                //generating auth token
                const token = await userEmail.genToken();
                res.status(200).json({ message: "Login Successful", userEmail, token });
            }
            else {
                // When password doesn't match we return with invalid credential
                res.status(400).json({ err: "Invalid Credential" });
            }

        } else {
            res.status(400).json({ err: "User doesn't exist " });
        }
    }
    catch (err) {
        console.log(err);
        res.status(400).json({ err: "Something went wrong!" });
    }
})



router.post('/logout', (req, res) => {
    res.clearCookie('jwtoken');
    console.log("kn")
    res.status(200).json({
        "message": "Logged out"
    })


})

// /user/userPro - Provides the detail of user logged in
router.get('/userPro', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.status(200).json({
            user: user
        })
    }
    catch (e) {
        console.log(e)
    }
})


// /user/profile/:id - Provides the information about user which we are looking for
router.get(`/profile/:id`, async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await User.findById(id);
        if (result) {
            console.log(result)
            res.status(200).json({
                "profile": result
            })
        }
        else {
            res.status(400).json({
                "msg": "User not found"
            })
        }
    } catch (error) {
        console.log(error);
        res.status(400).json({
            "error": error
        })
    }
})

// /user/alluser - Provides detail of all the current employee
router.get('/alluser', authenticateToken, isAuthorized, async (req, res) => {
    try {
        console.log(req.user.role, 'user role')
        if (req.user.role === 'Owner') {
            const data = await User.find({ role: { $nin: ['Owner'] } });
            // console.log(data)
            res.status(200).json({
                "users": data
            })
        }
        else {
            const data = await User.find({ role: { $nin: ['Owner', 'Manager'] } });
            res.status(200).json({
                "users": data
            })
        }
    } catch (error) {
        console.log(error)
        res.status(404).json({
            "error": "Cannot serve the request"
        })
    }
})

router.patch("/:id/edit", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const response = await User.findOneAndUpdate({ _id: id }, {
            fname: req.body.fname,
            lname: req.body.lname,
            number: req.body.number,
            username: req.body.username,
            role: req.body.role
        }, {
            new: true,
            runValidators: true
        }
        );
        console.log(response)
        res.status(200).json({
            "res": response,
            "msg": "Updated Successfully"
        })
        // res.json({msg:"Done"})
    }
    catch (e) {
        console.log(e)
        res.status(400).json({ msg: e })
    }
})


router.delete("/:id/delete", authenticateToken, isAuthorized, async (req, res, next) => {
    try {
        console.log("dsih")
        const response = await User.findByIdAndDelete(req.params.id);
        console.log(response)
        res.status(200).json({
            "res": response,
            "msg": "Deleted Successfully"
        })
    }
    catch (e) {
        console.log(e)
        res.status(401).send({
            "error": e
        })
        next(e)
    }
})

router.get("/sales/:limit", authenticateToken, isAuthorized, async (req, res, next) => {
    try {
        const limit = req.params.limit || 30;
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth());
        sixMonthsAgo.setDate(0)
        const reportOld = await Sale.find({ 'store': 'AKT Old', 'created': { $gte: sixMonthsAgo } }).sort({ created: -1 }).populate('added');
        const reportNew = await Sale.find({ 'store': 'AKT New', 'created': { $gte: sixMonthsAgo } }).sort({ created: -1 }).populate('added');
        const curDate = new Date();
        const curMonth = curDate.getUTCMonth();
        const curYear = curDate.getUTCFullYear();
        const summary = await Sale.aggregate([
            {
                $match: {
                    $expr: {

                        $and: [
                            { $lte: [{ $year: '$createdOn' }, curYear] },
                            {
                                $gte: [{ $month: '$createdOn' }, { $subtract: [curMonth, limit] }]
                            },
                            { $lte: [{ $month: '$createdOn' }, curMonth] }
                        ],
                    },
                },
            },
            {
                $group: {
                    _id: '$store',
                    totalSales: { $sum: "$sale" },
                    totalCustomers: { $sum: '$customer' },
                    totalOnlinePayment: { $sum: '$paytm' },
                    count: { $sum: 1 },
                }
            }
        ]);
        console.log(summary);
        return res.status(200).json({ reportOld, reportNew, summary })
    } catch (error) {
        next(error)
    }
})


router.post('/addSale', authenticateToken, isAuthorizedForAddingSale, validateSaleSchema, async (req, res, next) => {
    try {
        const { sale, customer, paytm, hdfc, created, added, store, addedName } = req.body;
        if (!sale || !customer || !added) {
            return res.status(422).json({
                "message": "Incomplete Data"
            })
        }
        const report = new Sale({ sale, customer, paytm, hdfc, created, added, store, addedName });

        const data = await report.save();
        

        res.status(200).json({
            "message": "Report Added Successfully"
        })
        console.log(data)
    }
    catch (e) {
        console.log(e);
        next(e);
    }
})



router.get('/sendOtp', authenticateToken, async (req, res) => {
    try {
        const num = '+91' + req.user.number;

        // const num = +91782830128;
        var otp = (Math.floor(Math.random() * 10000) + 10000).toString().substring(1);
        console.log(otp, req.user);
        const user = await User.findById(req.user._id);
        user.pwChange = otp;
        await user.save();
        sendOtp(otp, num, "Pasword Change");
        res.status(200).json({
            "message": "OTP sent successfully"
        })
    } catch (error) {
        console.log(error)
    }
})

router.patch('/changePassword', authenticateToken, async (req, res) => {
    try {
        const password = req.body.password;
        const otp = req.body.otp;
        const user = await User.findById(req.user._id);
        console.log(user)
        if (otp === user.pwChange) {
            user.hash = password;
            user.pwChange = '';
            await user.save();
            res.status(200).json({
                "message": "Password changed successfully"
            })
        }
        else {
            res.status(401).json({
                "message": "Failed to change password"
            })
        }
    } catch (error) {
        res.status(400).json({
            "message": error
        })
    }
})

router.patch('/verifyPhone', authenticateToken, async (req, res) => {
    try {
        const password = req.body.password;
        const otp = req.body.otp;
        const user = await User.findById(req.user._id);
        console.log(user)
        if (otp === user.pwChange) {
            user.phoneVerify = 1;
            await user.save();
            res.status(200).json({
                "message": "Your contact number has been verified."
            })
        }
        else {
            res.status(401).json({
                "message": "Failed to verify your contact number"
            })
        }
    } catch (error) {
        res.status(400).json({
            "message": error
        })
    }
})

router.get('/sendOtpForNumVerify', authenticateToken, async (req, res) => {
    try {
        const num = '+91' + req.user.number;
        //const num = +91782830128;
        var otp = (Math.floor(Math.random() * 10000) + 10000).toString().substring(1);
        console.log(otp);
        const user = await User.findById(req.user._id);
        user.pwChange = otp;
        await user.save();
        sendOtp(otp, num, "Phone number verification");
        res.status(200).json({
            "message": "OTP sent successfully"
        })
    } catch (error) {
        console.log(error)
    }
})

module.exports = router;