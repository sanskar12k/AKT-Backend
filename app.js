const express = require('express');
const app = express();
const mongoose = require('mongoose');
const session  = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const Sale = require('./models/sale')
const user = require('./routes/user');
const sale = require('./routes/sale')
const {sms} = require('./mailer/sms');
  app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', true);
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept'
    );
    next();
});
const mongoSanitize = require('express-mongo-sanitize');
const cors = require('cors')
app.use(cors({credentials: true, origin: 'http://localhost:3001'}));
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
app.use(cookieParser('thisismysecret'));
if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config();
}

// app.use(function(req, res, next) {  
//     res.header('Access-Control-Allow-Origin', req.headers.origin);
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     next();
// });  


const sessionConfig = {
    secret:"thisisasecret",
    //to remove deprecation warning
    resave:false,
    saveUninitialized:true,
    //for cookie
    cookie:{
        expires: Date.now() + 1000*60*60*24*7,
        maxAge: 1000*60*60*24*7,
        httpOnly:true
    }
}

app.use(session(sessionConfig))
mongoose.connect('mongodb+srv://sanskarmodanwal8:UYfFZqrr41BkkN39@cluster0.tcj4zor.mongodb.net/aktraders?retryWrites=true&w=majority',{
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
  .then(()=>console.log('Connected to DB'))
  .catch((e)=> console.log(e))





app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use(bodyParser.urlencoded({extended: true})) 
app.use(bodyParser.json()) 
// app.use(cookieParser(process.env.COOKIE_SECRET))

app.use(
    mongoSanitize({
      replaceWith: '_',
    }),
  );




const schedule = require('node-schedule');
const job = schedule.scheduleJob('00 22 * * *', function(){
    sms();
});
app.get('/', (req, res)=>{
    console.log(req.session)
    res.send('Test api sexfully')
})
//Using for authentication &authentication is added as static method
// passport.use(new LocalStrategy(User.authenticate()));
//for session adding and destroying
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
app.use('/user', user);
app.use('/sale', sale)



app.listen(3000, ()=>{
    console.log("Connected")
})