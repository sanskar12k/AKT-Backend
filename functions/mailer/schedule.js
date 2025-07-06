const schedule = require('node-schedule');
const date = new Date(2023, 0, 13, 22, 10, 0);

const job = schedule.scheduleJob(date, function(){
  console.log('The world is going to end today.');
});