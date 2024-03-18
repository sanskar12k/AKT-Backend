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

router.get("/sales/:store/:limit/:strt/:end", authenticateToken, isAuthorized, async (req, res, next) => {
    try {
        const from = new Date(new Date(Date.parse(req.params.strt)).getTime() - 86400000);
        const to = new Date(new Date(Date.parse(req.params.end)).getTime());
        const dateDiff = to.getTime() - from.getTime(); // Difference in milliseconds
        // Calculate two additional dates with the same difference
        const dateBeforeFrom = new Date(from.getTime() - dateDiff);
        const dateBeforeTo = new Date(to.getTime() - dateDiff);
        console.log(dateBeforeFrom, "from", dateBeforeTo, "to");
        let limit = parseInt(req.params.limit);
        const store = req.params.store;
        const monthsAgo = new Date();
        monthsAgo.setMonth(monthsAgo.getMonth() - limit + 1);
        monthsAgo.setDate(1)
        monthsAgo.setUTCHours(0);
        monthsAgo.setUTCMinutes(0);
        monthsAgo.setUTCSeconds(0);
        const prevSummaryDate = new Date();
        prevSummaryDate.setMonth(prevSummaryDate.getMonth() - 2 * limit + 1);
        //Report to be shown in table
        const reportOld = await Sale.find({ 'store': store, 'created': { $lte: to + 1, $gte: from } }).sort({ created: -1 }).populate('added');
        //Summary for current month and previous month
        const summary = await Sale.aggregate([
            {
                $match: {
                    $expr: {
                        $and: [
                            // { $gte: ['$created', monthsAgo]},
                            { $gte: ['$created', from] },
                            { $lt: ['$created', to] },
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
                            { $gte: ['$created', dateBeforeFrom ]},
                            { $lt: ['$created',  dateBeforeTo] },
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
        console.log("summary", summary);
        console.log("prev summary", prevSummary);
        return res.status(200).json({ reportOld, summary, prevSummary })
    } catch (error) {
        next(error)
    }
})

module.exports = router;