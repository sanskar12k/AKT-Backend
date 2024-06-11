const mongoose = require('mongoose');
const user = require('./user');
const Schema = mongoose.Schema
// const passportLocalMongoose = require('passport-local-mongoose')

const saleSchema = new Schema({
    sale:{
        type:Number,
        require:true
    },
    store:{
        type:String,
        enum:['AKT Old', 'AKT Cosmetics', 'Bakery', 'Maa Mansha Cold Drinks'],
        require:true
    },
    customer:{
        type:Number,
        require:true
    },
    paytm:{
        type:Number,
    },
    hdfc:{
        type:Number
    },
    createdOn:{
        type:Date,
        default:Date.now()
    },
    created:{
        type:Date,
        require:true
    },
    added:{
        type:Schema.Types.ObjectId,
        ref: user
    },
    addedName:{
        type:String,
        required:true
    },
    
})

// userSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model('Sale', saleSchema);