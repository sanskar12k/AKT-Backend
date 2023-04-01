const express = require('express');
const User = require('../models/user');
const Sale = require('../models/sale');
const { isAuthorized, authenticateToken } = require('../authentication/authenticate');
const { validateSaleSchema } = require('../schemas/joi');
const router = express.Router();


router.patch('/:id/edit',  async(req, res) => {
    try {
        const {id} = req.params;
        const { sale, customer, paytm, hdfc, created, store } = req.body;
        if (!sale || !customer || !created) {
            return res.status(422).json({
                "message": "Incomplete Data"
            })
        }
        const result = Sale.findOneAndUpdate({_id:id}, {
            sale:req.body.sale,
            customer:req.body.customer,
            paytm:req.body.paytm,
            hdfc:req.body.hdfc, 
            created:req.body.created, 
            store:req.body.store
         },{
            new:true,
            runValidators:true
        })
        // // const data = await report.save();
        console.log(result)
        res.status(200).json({
            "message": "Report Updated",
            // result
        })
        // console.log(result)
    } catch (error) {
        console.log(error)
    }
})

module.exports = router;