const mongoose = require('mongoose');
const user = require('./user');
const Schema = mongoose.Schema

const storeSchema = new Schema({
    name:{
        type:String,
        require:true
    },
    createdOn:{
        type:Date,
        default:Date.now()
    },
    added:{
        type:Schema.Types.ObjectId,
        ref: user
    },
})


module.exports = mongoose.model('Store', storeSchema);