const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const jwt = require('jsonwebtoken') 
// const passportLocalMongoose = require('passport-local-mongoose')
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
        enum: ['Owner', 'Manager', 'CompOper', "Staff", "Store Associate", "Billing Associate", "Senior Store Associate", "Store Associate"],
        required: "Please specify correct role."
    },
    number:{
        type:String
    },
    phoneVerify:{
      type: Boolean,
      default:false
    },
    mailVerify:{
      type: Boolean,
      default:false
    },
    store:{
      type: String,
      enum:['AKT Old', 'AKT New']
    },
    
    username:{
      type:String,
      unique: true,
      required:true
    },
    hash:{
      type:String,
      required:true
    },
    dob:{
      type:Date,
    },
    pwChange:{
        type:String
    }
})

userSchema.pre('save' , async function(next) {
  if(this.isModified('hash')){
      this.hash = await bcrypt.hash(this.hash, 12);
  }
  next();
});

 
userSchema.methods.genToken = async function(){
  try{
    const tkn = jwt.sign({_id: this._id, fnme: this.fname, role:this.role, number:this.number}, process.env.SECKEY);
    return tkn;
  }catch(e){
    console.log(e);
  }
}

module.exports = mongoose.model('User', userSchema);