const Sale = require('../models/sale');
const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://dbUser:sanskar12@cluster0.lyou7.mongodb.net/aktraders?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log("Connected2"))
    .catch((e) => console.log(e))

// app.use(method('method'))
if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config();
}
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);
const number = ['+917296806351', '+917852830128']
module.exports.sms = async() =>{
    try{
        const d1 = await Sale.find({'store':'AKT Old', 'created':{$lte: new Date()}}).sort({ created: -1 }).limit(1);
        const d2 = await Sale.find({'store':'AKT New', 'created':{$lte: new Date()}}).sort({ created: -1 }).limit(1);
        console.log(d1);
        let msg ='\n';
        if(d1.length > 0)
        { msg += 
             
             `Report of AKT Old:
              Today's Sale: ₹${d1[0].sale}
              No. of customers: ${d1[0].customer}
              Paytm: ₹${d1[0].paytm}
              HDFC: ₹${d1[0].hdfc}`;}
        else{
            msg += `No report added today for AKT Old`
        }
        if(d2.length > 0){ msg +=     
            `

             Report of AKT New:
             Today's Sale: ₹${d2[0].sale}
             No. of customers: ${d2[0].customer}
             Paytm: ₹${d2[0].paytm}
             HDFC: ₹${d2[0].hdfc}`;}
       else{
           msg += `
           No report added today for AKT New`
       }
    console.log(msg);
    for(num of number)
    {client.messages
      .create({body: msg, from: '+17208217190', to: num})
      .then(message => console.log(message.sid))
      .catch(err => console.log(err))
    }
    }
        catch (error) {
        console.log(error)
    }
    
       
}
// sms();
// const schedule = require('node-schedule')
// const job = schedule.scheduleJob('14 22 * * *', function(){
//     sms();
// });
