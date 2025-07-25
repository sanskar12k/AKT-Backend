const express = require('express');
const app = express();
const mongoose = require('mongoose');
const session  = require('express-session');
const user = require('./routes/user');
const sale = require('./routes/sale');
const store = require('./routes/store');
  app.use(function(req, res, next) {
  //  res.header('Access-Control-Allow-Origin', 'https://akt-frontend.vercel.app');
   res.header('Access-Control-Allow-Origin', 'http://localhost:3000')
    res.header('Access-Control-Allow-Credentials', true);
      res.header(
      'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    next();
});
const mongoSanitize = require('express-mongo-sanitize');
const cors = require('cors')
app.use(cors({
      origin:['https://akt-frontend.vercel.app', 'https://akt-frontend.web.app'],
      
    //  origin:'http://localhost:3000',
    // origin: '*',
      credentials: true,
}));

if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config();
}

mongoose.connect(process.env.MONGO_D,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
  .then(()=>console.log('Connected to DB'))
  .catch((e)=> console.log(e))


app.use(express.urlencoded({extended: true}));
app.use(express.json());

// app.use(bodyParser.urlencoded({extended: true})) 
// app.use(bodyParser.json()) 

app.use(
    mongoSanitize({
      replaceWith: '_',
    }),
  );

// const schedule = require('node-schedule');

app.get('/', (req, res)=>{
    console.log(req.session)
    res.send('Test api successfully')
})

app.use('/user', user);
app.use('/sale', sale);
app.use('/store', store);

// app.listen(8800, ()=>{
//     console.log("Connected")
// })

module.exports = app;
