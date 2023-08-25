const express = require('express');
const User = require('../models/user');
const Sale = require('../models/sale');
const { isAuthorized, authenticateToken } = require('../authentication/authenticate');
const { validateSaleSchema } = require('../schemas/joi');
const router = express.Router();


router.patch('/:id/edit',  async(req, res) => {
    try {
        const {id} = req.params;
        const { sale, customer, paytm, hdfc, store } = req.body;
        if (!sale || !customer) {
            return res.status(422).json({
                "message": "Incomplete Data"
            })
        }
        const result = await Sale.findOneAndUpdate({_id:id}, {
            sale:req.body.sale,
            customer:req.body.customer,
            paytm:req.body.paytm,
            hdfc:req.body.hdfc, 
            store:req.body.store
         },{
            runValidators:true
        })
        // // const data = await report.save();
        console.log(result)
        res.status(200).json({
            "message": "Report Updated",
            // "result":result,
            // result
        })
        // console.log(result)
    } catch (error) {
        console.log(error)
    }
})

module.exports = router;