const express = require('express');
const User = require('../models/user');
const Sale = require('../models/sale');
const Store = require('../models/store');
const { isAuthorized, authenticateToken } = require('../authentication/authenticate');
const router = express.Router();


router.get("/allStores",authenticateToken, async(req, res)=>{
    try{
        const data = await Store.find();
        res.status(200).json({
            "stores": data
        })
    }
    catch(err){
        console.log(err);
    }
})

router.post("/addStores", async(req, res) =>{
    try{
        const {name} = req.body;
        const result = new Store({name});
        await result.save();
        res.status(201).json({ message: "User created", result});
        return;
    }
    catch(err){
        console.log(err);
    }
})

module.exports = router;