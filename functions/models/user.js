const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const jwt = require('jsonwebtoken') 
const bcrypt = require('bcrypt');

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
        enum: ['Owner', 'Manager', "BillingAssociate", "SeniorStoreAssociate", "StoreAssociate"],
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
      enum:['AKT Old', 'AKT Cosmetics', 'Bakery', 'Maa Mansha Cold Drinks']
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