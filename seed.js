const mongoose = require('mongoose');
const express = require('express')
const app = express();
const User = require('./models/user');
const sale = require('./models/sale');
mongoose.connect('mongodb+srv://dbUser:sanskar12@cluster0.lyou7.mongodb.net/aktraders?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log("Connected"))
    .catch((e) => console.log(e))

// app.use(method('method'))
const seedDB = async () => {

   try{ 
    //    await User.deleteMany({});
    // await sale.deleteMany({});
    // const password = 'sanskar12@';
    // const user = new User({
    //     fname:"Sanskar",
    //     lname:"Gupta",
    //     username:'sankarmodanwal8@gmail.com',
    //     role:'Owner',
    //     number:7852830128
    // })
    // const regUser = await User.register(user, password);
    // const newSale = new sale({ sale: 45000, customer:100, paytm:12000, hdfc:7854, modified:Date.now(), added:regUser._id});
    // await newSale.save();
    const res = await User.updateMany({},{'store':"AKT Old"})
    console.log(res)
    }
    catch(e){
        // next(e)
        console.log(e)
    }
}
seedDB().then(() => {
    mongoose.connection.close();
})