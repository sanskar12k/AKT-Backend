const express = require('express');
const User = require('../models/user');
const Sale = require('../models/sale');
const { isAuthorized, authenticateToken } = require('../authentication/authenticate');
const { validateSaleSchema } = require('../schemas/joi');
const router = express.Router();


router.patch('/:id/edit', async (req, res) => {
    try {
        const { id } = req.params;
        const { sale, customer, paytm, hdfc, store } = req.body;
        if (!sale || !customer) {
            return res.status(422).json({
                "message": "Incomplete Data"
            })
        }
        const result = await Sale.findOneAndUpdate({ _id: id }, {
            sale: req.body.sale,
            customer: req.body.customer,
            paytm: req.body.paytm,
            hdfc: req.body.hdfc,
            store: req.body.store
        }, {
            runValidators: true
        })
        // // const data = await report.save();
        console.log(result)
        res.status(200).json({
            "message": "Report Updated",
        })
    } catch (error) {
        console.log(error)
    }
})

router.get("/sales/:store/:limit", authenticateToken, isAuthorized, async (req, res, next) => {
    try {
        let limit = parseInt(req.params.limit);
        const store = req.params.store;
        const monthsAgo = new Date();
        monthsAgo.setMonth(monthsAgo.getMonth() - limit + 1);
        // monthsAgo.setDate(1)
        monthsAgo.setUTCHours(0);
        monthsAgo.setUTCMinutes(0);
        monthsAgo.setUTCSeconds(0);
        const prevSummaryDate = new Date();
        prevSummaryDate.setMonth(prevSummaryDate.getMonth() - 2*limit + 1);
        console.log(monthsAgo)
        //Report to be shown in table
        const reportOld = await Sale.find({ 'store': store, 'created': { $gte: monthsAgo } }).sort({ created: -1 }).populate('added');
        //Summary for current month and previous month
        const summary = await Sale.aggregate([
            {
                $match: {
                    $expr: {
                        $and: [
                            { $gte: ['$created', monthsAgo]},
                            { $eq: ['$store', store] },
                        ],
                    },
                },
            },
            {
                $group: {
                    _id: store,
                    totalSales: { $sum: "$sale" },
                    totalCustomers: { $sum: '$customer' },
                    totalOnlinePayment: { $sum: '$paytm' },
                    count: { $sum: 1 },
                },
            },
        ]);

        const prevSummary = await Sale.aggregate([
            {
                $match: {
                    $expr: {
                        $and: [
                            { $gte: ['$created', prevSummaryDate]},
                            { $lt: ['$created', monthsAgo]},
                            { $eq: ['$store', store] },
                        ],
                    },
                },
            },
            {
                $group: {
                    _id: store,
                    totalSales: { $sum: "$sale" },
                    totalCustomers: { $sum: '$customer' },
                    totalOnlinePayment: { $sum: '$paytm' },
                    count: { $sum: 1 },
                },
            },
        ]);
        return res.status(200).json({ reportOld, summary, prevSummary })
    } catch (error) {
        next(error)
    }
})

module.exports = router;