const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const jwt = require('jsonwebtoken') 
const passportLocalMongoose = require('passport-local-mongoose')
const bcrypt = require('bcrypt');
// const Session = new Schema({
//     refreshToken: {
//       type: String,
//       default: "",
//     },
//   })

const userSchema = new Schema({
    fname:{
        type:String,
        required:true
    },
    lname:{
        type:String,
    },
    role:{
        type:String,
        enum: ['Owner', 'Manager', 'CompOper', 'Staff'],
        required: "Please specify correct role."
    },
    number:{
        type:String
    },
    username:{
      type:String,
      unique: true,
      required:true
    },
    hash:{
      type:String,
      required:true
    }
})

// userSchema.set("toJSON", {
//     transform: function (doc, ret, options) {
//       delete ret.refreshToken
//       return ret
//     },
// })

userSchema.pre('save' , async function(next) {
  if(this.isModified('hash')){
      this.hash = await bcrypt.hash(this.hash, 12);
      // this.cpassword = await bcrypt.hash(this.cpassword, 12);
  }
  next();
});


userSchema.methods.genToken = async function(){
  try{
    console.log(this._id, 'dkmk')
    const tkrn = jwt.sign({_id: this._id, fnme: this.fname, role:this.role}, process.env.SECKEY);
    return tkrn;
  }catch(e){
    console.log(e);
  }
}

// userSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model('User', userSchema);