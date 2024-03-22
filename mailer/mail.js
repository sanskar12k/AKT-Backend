// const sgMail = require('@sendgrid/mail')
// if(process.env.NODE_ENV !== 'production'){
//     require('dotenv').config();
// }
// sgMail.setApiKey(process.env.SENDGRID_API_KEY)
// const msg = {
//   to: 'sanskarmodanwal8@gmail.com', // Change to your recipient
//   from: 'infoataktraders@gmail.com', // Change to your verified sender
//   subject: 'Sending with SendGrid is Fun',
//   text: 'and easy to do anywhere, even with Node.js',
//   html: '<strong>and easy to do anywhere, even with Node.js</strong>',
// }
// sgMail
//   .send(msg)
//   .then(() => {
//     console.log('Email sent')
//   })
//   .catch((error) => {
//     console.error(error)
//   })


const nodemailer = require('nodemailer');
if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config();
}

transporter = nodemailer.createTransport({
  service:'gmail',
  host:'smtp.gmail.com',
  port:587,
  secure:false,
  auth:{
    user:process.env.USER,
    pass:process.env.NODEMAILER_PASSWORD
  },
})

const sendMail = async(mailOptions) =>{
   try{
    await transporter.sendMail(mailOptions);
   }
   catch(error){
    console.log(error);
   }
}

module.exports.mail = async (emailList, subject, html) => {
  try {
      const mailOption = {
          from: {
              name: 'AKT Reporting',
              address: process.env.USER
          },
          to: emailList,
          subject: subject,
          html: html
      };
      await sendMail(mailOption);
  } catch (error) {
      console.log(error);
  }
};
