const User = require("../models/user")
const dev = process.env.NODE_ENV !== "production"
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
exports.COOKIE_OPTIONS = {
  httpOnly: true,
  // Since localhost is not having https protocol,
  // secure cookies do not work correctly (in postman)
  secure: !dev,
  signed: true,
  maxAge: eval(60*60*24*30) * 1000,
  sameSite: "none",
}

exports.getToken = user => {
  return jwt.sign(user, process.env.JWT_SECRET, {
    expiresIn: eval(60*15),
  })
}

exports.getRefreshToken = user => {
  const refreshToken = jwt.sign(user, process.env.JWT_SECRET, {
    expiresIn: eval(60*60*24*30),
  })
  return refreshToken
}


exports.verifyUser = async(req,res,next)=>{
  try{
    const token = req.body.tkn;
    console.log(token);
    next();
    // else return res.status(401).json({"message": "Unathorised access"});
}catch(e){
    console.log(e);
    return res.status(401).json({"message": "Unathorised access"});
}
}

exports.authenticateToken = (req, res, next) =>{
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split('token=')[1];
  if (token == null) return res.sendStatus(401);
  if(!token){
    return res.status(403).send({
    })
};
 console.log(token)
  jwt.verify(token, process.env.SECKEY, (err, user) => {
    if (err) return res.status(403).json({"msg":"Failed authentication"});
    req.user = user
    next()
  })
}


exports.isAuthorized = async(req, res, next) =>{
  try {
    if(!req.user){
      throw new Error('Not Authorized')
    }
    const user = await User.findById(req.user._id);
    if(user.role !== 'Owner' && user.role !== 'Manager'){
      throw new Error('Not Authorized')
    }
    next();
  } catch (error) {
    return res.status(403).json({
      message:error
    })
  }
}
 
  exports.isAuthorizedForAddingSale = async(req, res, next) =>{
    try {
      if(!req.user){
        throw new Error('Not Authorized')
      }
      const user = await User.findById(req.user._id);
      if(user.role !== 'Owner' && user.role !== 'Manager' && user.role !== 'CompOper' && user.role !== 'Billing Associate'){
        throw new Error('Not Authorized')
      }
      next();
    } catch (error) {
      return res.status(403).json({
        message:error
      })
    }
}

module.exports.register = async(req, res, next) => {
  const {fname, lname, role, number, username, password} = req.body;
      
      if ( !fname || !role || !password || !username ){
         res.status(422).send({error: 'Please fill all the columns'});
          }
      try{
          const userExist = await  User.findOne({username:username});

          if(userExist) {
             res.status(422).json({error: "User already existed"});
            
          } 
          else{
            const user = new User({fname, username, lname, role, phone, password});
           
            //Saves data to db
            await user.save();
   
            res.status(201).json({message: "Registartion Successful!!"});
            return;
         } 
          }
         
      catch(err) {
          console.log(err);
      }
}

module.exports.authentication = async(req, res) => {
  const {username, password} = req.body;
    if(!username || !password){
        req.status(400).json({err: "Please fill all the columns"});
    }

    //Check for email existence 
    try{
       const userEmail = await User.findOne({username});
       if (userEmail){
    
       const userPassword = await bcrypt.compare(password, userEmail.hash);
        if(userPassword){
          const token = await userEmail.generateAuthToken();
          res.cookie('jwtoken', token, {
              expires: new Date(Date.now() + 1296000000 ), //1296000000ms = 15days
          })
            res.json({message:"Login Successful"});
        }else(res.status(400).json({err:"Invalid Credential"}))
       
       }else {
        res.status(400).json({err:"Invalid Credential mail "});
       }
    }
    catch(err){
       console.log(err);
        }
} 
