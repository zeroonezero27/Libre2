console.log('start2');

const schedule = require('node-schedule');
const rule = new schedule.RecurrenceRule();
rule.hour = 9;
rule.minute = 0;
rule.tz = 'Europe/Moscow';

const job = schedule.scheduleJob(rule, function(){
  console.log('start sched');

  const dayjs = require('dayjs');
  const uuid = require('uuid');
  const colors = require('colors');
  const prompt = require('prompt');
  const fs = require('fs');
  require('dotenv').config({ path: __dirname + '/../config.env' });
  
  const libre = require('./functions/libre');
  const nightscout = require('./functions/nightscout');
  
  const CONFIG_NAME = 'config.json';
  const DEFAULT_CONFIG = {
  };
  
  if (!fs.existsSync(CONFIG_NAME)) {
    fs.writeFileSync(CONFIG_NAME, JSON.stringify(DEFAULT_CONFIG));
  }
  
  const rawConfig = fs.readFileSync(CONFIG_NAME);
  let config = JSON.parse(rawConfig);
  
  
  
    config = Object.assign({}, config, {
      nightscoutUrl: config.nightscoutUrl,
      nightscoutToken: config.nightscoutToken,
      libreUsername: config.libreUsername,
      librePassword: config.librePassword,
      libreDevice: config.libreDevice
    });
  
    fs.writeFileSync(CONFIG_NAME, JSON.stringify(config));
    config = Object.assign({}, config, {
      nightscoutUrl: config.nightscoutUrl,
      nightscoutToken: config.nightscoutToken,
      libreUsername: config.libreUsername,
      librePassword: config.librePassword,
      libreDevice: config.libreDevice
    });
  
    (async () => {
     // const fromDate = dayjs(`${result.year}-${result.month}-01`).format('YYYY-MM-DD');
    //  const toDate = dayjs(`${result.year}-${result.month + 1}-01`).format('YYYY-MM-DD');
  var datetime = new Date();
  var yesterday = new Date(datetime.getTime());
  yesterday.setDate(datetime.getDate() - 1);
    
    //var yesterday =Date.parse("2024-05-03")
    //var datetime = Date.parse("2024-05-08")
    
    
    const fromDate =formatDate(yesterday);
    const toDate =formatDate(datetime);
      console.log('transfer time span', fromDate.gray, toDate.gray);
  
  
  const glucoseEntries = await nightscout.getNightscoutGlucoseEntries(config.nightscoutUrl, config.nightscoutToken, fromDate, toDate);
      
  const foodEntries = await nightscout.getNightscoutFoodEntries(config.nightscoutUrl, config.nightscoutToken, fromDate, toDate);
  const insulinEntries = await nightscout.getNightscoutInsulinEntries(config.nightscoutUrl, config.nightscoutToken, fromDate, toDate);
  
  //console.log(glucoseEntries);
  
  
      if (glucoseEntries.length > 0 || foodEntries.length > 0 || insulinEntries.length > 0) {
       const auth = await libre.authLibreView(config.libreUsername, config.librePassword, config.libreDevice, false);
        if (!!!auth) {
          console.log('libre auth failed!'.red);
  
          return;
        }
  
       await libre.transferLibreView(config.libreDevice, auth, glucoseEntries, foodEntries, insulinEntries);
      }
    })();
  
  
  function onErr(err) {
    console.log(err);
    return 1;
  }
  function formatDate(date) {
      var d = new Date(date),
          month = '' + (d.getMonth() + 1),
          day = '' + d.getDate(),
          year = d.getFullYear();
  
      if (month.length < 2) 
          month = '0' + month;
      if (day.length < 2) 
          day = '0' + day;
  
      return [year, month, day].join('-');
  }
    
});



 
