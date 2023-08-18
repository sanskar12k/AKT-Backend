const express = require('express');
const User = require('../models/user');
const Sale = require('../models/sale')
const router = express.Router();
const { getToken, getRefreshToken, COOKIE_OPTIONS, verifyUser, authenticateToken, isAuthorized, isAuthorizedForAddingSale, authenticate } = require('../authentication/authenticate');
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


router.post('/create', validateUserSchema, async (req, res, next) => {
    const { fname, lname, role, number, username, password, store, dob } = req.body;

    if (!fname || !role || !password || !username) {
        res.status(422).send({ error: 'Please fill all the columns' });
    }
    try {
        const userExist = await User.findOne({ username: username });

        if (userExist) {
            res.status(422).json({ error: "User already existed" });

        }
        else {
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
router.post('/login', async (req, res) => {
    console.log(req.body)
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            req.status(400).json({ err: "Please fill all the columns" });
        }
        //Check for email existence 
        const userEmail = await User.findOne({ username });
        console.log(userEmail, 'fell')
        if (userEmail) {
            // console.log('fell')
            const userPassword = await bcrypt.compare(password, userEmail.hash);
            if (userPassword) {
                const token = await userEmail.genToken();
                //   res.cookie('jwtoken', token, {
                //       expires: new Date(Date.now() + 1296000000 ), //1296000000ms = 15days
                //   })
                res.status(200).json({ message: "Login Successful", userEmail, token });
            }
            else {
                res.status(400).json({ err: "Invalid Credential" });
            }

        } else {
            res.status(400).json({ err: "User doesn't exist " });
        }
    }
    catch (err) {
        console.log(err);
    }
})



router.post('/logout', (req, res) => {
    res.clearCookie('jwtoken');
    console.log("kn")
    res.status(200).json({
        "message": "Logged out"
    })


})


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

router.get("/sale", authenticateToken, isAuthorized, async (req, res, next) => {
    try {
        const reportOld = await Sale.find({ 'store': 'AKT Old' }).sort({ created: -1 }).limit(30).populate('added');
        // const reportOld = await Sale.find({}).sort({ created: -1 }).limit(30).populate('added');
        const reportNew = await Sale.find({ 'store': 'AKT New' }).sort({ created: -1 }).limit(30).populate('added');
        return res.status(200).json({ reportOld, reportNew })
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
        sendReport(data)
        res.status(200).json({
            "message": "Report Added Successfully"
        })
        console.log(data)
    }
    catch (e) {
        next(e);
    }
})



router.get('/sendOtp', authenticateToken, async (req, res) => {
    try {
        const num = '+91' +  req.user.number;

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
                "message":"Your contact number has been verified."
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
        const num = '+91' +  req.user.number;
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