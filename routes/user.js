const express = require('express');
const User = require('../models/user');
const Sale = require('../models/sale')
const router = express.Router();
const passport = require('passport');
const { getToken, getRefreshToken, COOKIE_OPTIONS, verifyUser, authenticateToken, isAuthorized, authenticate } = require('../authentication/authenticate');
const jwt = require('jsonwebtoken');
const { userSchema, validateSaleSchema } = require('../schemas/joi');
const bcrypt = require("bcrypt");
const otp = require('otp-generator')
const validateUserSchema = (req, res, next) =>{
    const { error } = userSchema.validate(req.body);
    if(error){
        const msg = error.details.map(el => el.message).join(',')
        next(msg)
    }
    else{
        next();
    }
}


router.post('/create', validateUserSchema, async (req, res, next) => {
    // try {
    //     const { fname, lname, username, password, number, role } = req.body;

    //     if (!fname || !username || !password|| !role) {
    //         return res.status(422).json({
    //             "message": "Form incomplete"
    //         })
    //     }
    //     const user = new User({ fname, lname, username, number, role });
    //     const regUser = await User.register(user, password);
    //     console.log(regUser)
    //     return res.status(200).json({
    //         "message": "User created",
    //         "user": regUser
    //     })
    // }
    // catch (e) {
    //     return res.status(200).json({
    //         "message": e
    //     })
    // }
    const {fname, lname, role, number, username, password, store, dob} = req.body;
      
      if ( !fname || !role || !password || !username ){
         res.status(422).send({error: 'Please fill all the columns'});
          }
      try{
          const userExist = await  User.findOne({username:username});

          if(userExist) {
             res.status(422).json({error: "User already existed"});
            
          } 
          else{
            const user = new User({fname, username, lname, role, number, store, hash:password, dob});
            //Saves data to db
            await user.save();
            res.status(201).json({message: "User created", user});
            return;
         } 
          }
         
      catch(err) {
          console.log(err);
      }
    })
    router.post('/login', async (req, res) => {
        console.log(req.body)
// router.post('/login', passport.authenticate('local'), async (req, res) => {
    try {
        const {username, password} = req.body;
        if(!username || !password){
            req.status(400).json({err: "Please fill all the columns"});
        }
        //Check for email existence 
           const userEmail = await User.findOne({username});
           console.log(userEmail,'fell')
           if (userEmail){
            // console.log('fell')
           const userPassword = await bcrypt.compare(password, userEmail.hash);
            if(userPassword){
              const token = await userEmail.genToken();
              res.cookie('jwtoken', token, {
                  expires: new Date(Date.now() + 1296000000 ), //1296000000ms = 15days
              })
                res.status(200).json({message:"Login Successful", userEmail});
            }else(res.status(400).json({err:"Invalid Credential"}))
           
           }else {
            res.status(400).json({err:"Invalid Credential mail "});
           }
        }
        catch(err){
           console.log(err);
            }
    // try{
    //     const customerExist = req.user;
    //     console.log(customerExist)
    //     const tkn = jwt.sign({ _id: customerExist._id, fnme: customerExist.fname, role:customerExist.role }, process.env.SECKEY);
    //     console.log("token:", tkn)

    //     let options = {
    //         secret:"thisisasecret",
    //         expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    //         maxAge: 1000 * 60 * 60 * 24 * 7,
    //         httpOnly: true,
    //         signed: true // Indicates if the cookie should be signed
    //     }
    //     res.cookie('tokens', tkn, options)
    //     console.log(res.cookie)
    //     return res.status(200).json({
    //         message: "success",
    //         user: {
    //             fname: req.user.fname,
    //             lname: req.user.lname,
    //             role: req.user.role,
    //             id: req.user._id
    //         },
    //         token: tkn
    //     })
    // } catch (e) {
    //     console.log(e);
    //     res.status(500).json({
    //         "message": "Server error"
    //     })
    // }
})



router.post('/logout', (req, res) => {
    // req.logout(function (err) {
    //     if (err) {
    //         return next(err);
    //     }
    // })
    res.clearCookie('jwtoken');
    console.log("kn")
    res.status(200).json({
        "message": "Logged out"
    })


})


router.post('/refreshToken', async (req, res, next) => {
    const { signedCookies = {} } = req;
    const { refreshToken } = signedCookies;
    if (refreshToken) {
        try {
            const payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
            const userId = payload._id;
            const user = await User.findOne(userId);
            if (user) {
                const tokenIndex = user.refreshToken.findIndex(
                    item => item.refreshToken === refreshToken
                )
                if (tokenIndex === -1) {
                    res.status(401).send("Unauthorized")
                }
                else {
                    const token = getToken({ _id: userId });
                    const newRefreshToken = getRefreshToken({ _id: userId })
                    user.refreshToken[tokenIndex] = { refreshToken: newRefreshToken }
                    await user.save();
                    res.cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS)
                    res.send({ success: true, token })
                }
            }

        } catch (error) {
            res.status(401).send("Unauthorized");
        }
    }
})

// router.post('/userPro', async (req, res) => {
router.post('/userPro', authenticateToken, async (req, res) => {
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

router.get(`/profile/:id`, async(req, res, next) =>{
    try {
        const {id} = req.params;
        const result = await User.findById(id);
        if(result)
        {
            console.log(result)
        res.status(200).json({
            "profile":result
        })
        }
        else{
            res.status(400).json({
                "msg":"User not found"
             })  
        }
    } catch (error) {
        console.log(error);
        res.status(400).json({
           "error":error
        })
    }
})


router.get('/alluser', authenticateToken, isAuthorized, async(req, res) => {
try {
    console.log(req.user.role, 'user role')
    if(req.user.role === 'Owner'){
        const data = await User.find({role:{$nin : ['Owner']}});
        // console.log(data)
        res.status(200).json({
            "users":data
        })  
    }
    else {
        const data = await User.find({role:{$nin : ['Owner', 'Manager']}});
        // console.log(data)
        res.status(200).json({
            "users":data
        })
    }
} catch (error) {
    console.log(error)
    res.status(404).json({
        "error":"Cannot serve the request"
    })
}
})

router.patch("/:id/edit", authenticateToken, async (req, res) => {
    try {
        const {id} = req.params;
        const response = await User.findOneAndUpdate({_id:id}, {
            fname:req.body.fname,
            lname:req.body.lname,
            number:req.body.number,
            username:req.body.username,
            role:req.body.role
        },{
            new:true,
            runValidators:true
        }
        );
        console.log(response)
        res.status(200).json({
            "res":response,
            "msg":"Updated Successfully"
        })
        // res.json({msg:"Done"})
    }
    catch (e) { 
        // console.log(e)
        // res.status(401).json({
        //     "error":e
        // })
        console.log(e)
        res.status(400).json({msg:e})
        // next(e)
     }
})


router.delete("/:id/delete", authenticateToken, isAuthorized, async (req, res, next) => {
    try {
        console.log("dsih")
        const response = await User.findByIdAndDelete(req.params.id);
        console.log(response)
        res.status(200).json({
            "res":response,
            "msg":"Deleted Successfully"
        })
    }
    catch (e) { 
        console.log(e)
        res.status(401).send({
            "error":e
        })
        next(e)
     }
})

router.get("/sale", authenticateToken, isAuthorized, async (req, res, next) => {
    try {
        const reportOld = await Sale.find({'store':'AKT Old'}).sort({ created: -1 }).limit(30).populate('added');
        // const reportOld = await Sale.find({}).sort({ created: -1 }).limit(30).populate('added');
        const reportNew = await Sale.find({'store':'AKT New'}).sort({ created: -1 }).limit(30).populate('added');
        return res.status(200).json({ reportOld, reportNew })
    } catch (error) {
        next(error)
    }
})


router.post('/addSale', authenticateToken, isAuthorized, validateSaleSchema, async (req, res, next) => {
    try {
        const { sale, customer, paytm, hdfc, created, added, store, addedName } = req.body;
        if (!sale || !customer || !added) {
            return res.status(422).json({
                "message": "Incomplete Data"
            })
        }
        const report = new Sale({ sale, customer, paytm, hdfc, created, added, store, addedName});

        const data = await report.save();
        res.status(200).json({
            "message": "Reported"
        })
        console.log(data)
    }
    catch (e) {
        next(e);
    }
})



// router.get('/sendOtp', authenticateToken, async(req, res) =>{ 
//     try {
//         const contact = req.user.number;

//     } catch (error) {
//         console.log(error)
//     }
// })

module.exports = router;