const crypto = require('crypto');
const axios = require('axios');
const dayjs = require('dayjs');
const colors = require('colors');

const randomInt = function (min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min)
};

const selectData = function (entries) {
  // Group dates by day
  const groups = entries.reduce((acc, singleEntry) => {
    const day = dayjs(singleEntry.timestamp).date();

    if (!acc[day]) {
      acc[day] = [];
    }

    acc[day].push(singleEntry);

    return acc;
  }, {});

  const result = [];

  for (const day of Object.values(groups)) {
    const dayEntries = day.filter(singleEntry => {
      const hour = dayjs(singleEntry.timestamp).hour();

      return hour >= 7 && hour < 21;
    });

    const selectionSize = randomInt(8, 10);

    if (dayEntries.length < selectionSize) {
      result.push(...dayEntries);
    } else {
      // Select 8 dates evenly distributed over the 7am-9pm range
      const slots = Array.from({ length: selectionSize }, (_, i) => i);
      const slotSize = Math.floor(dayEntries.length / selectionSize);
      const slotPositions = slots.map(slot => slot * slotSize);
      for (const pos of slotPositions) {
        const slotDates = dayEntries.slice(pos, pos + slotSize);
        result.push(slotDates[Math.floor(Math.random() * slotDates.length)]);
      }
    }
  }

  return result;
};

const authLibreView = async function (username, password, device, setDevice) {
  console.log('authLibreView'.blue);

  const data = {
    DeviceId: device,
    GatewayType: "FSLibreLink.iOS",
    SetDevice: setDevice,
    UserName: username,
    Domain: "Libreview",
    Password: password
  };

  const response = await axios.default.post('https://api.libreview.ru/lsl/api/nisperson/getauthentication', data, {
    headers: {
      'Content-Type': 'application/json'
    }
  });

  console.log('authLibreView, response', response.data);

  if (response.data.status !== 0) {
    return;
  }

  return response.data.result.UserToken;
}

const transferLibreView = async function (device, token, glucoseEntries, foodEntries, insulinEntries) {
  console.log('transferLibreView'.blue);

  console.log('glucose entries', (glucoseEntries || []).length.toString().gray);
  console.log('food entries', (foodEntries || []).length.toString().gray);
  console.log('insulin entries', (insulinEntries || []).length.toString().gray);

  const glucoseSelection = selectData(glucoseEntries);

  const data = {
    UserToken: token,
    GatewayType: "FSLibreLink.iOS",
    DeviceData: {
      header: {
        device: {
          hardwareDescriptor: "iPhone14,2",
          osVersion: "15.4.1",
          modelName: "com.freestylelibre.app.ru",
          osType: "iOS",
          uniqueIdentifier: device,
          hardwareName: "iPhone"
        }
      },
      measurementLog: {
        capabilities: [
          "scheduledContinuousGlucose",
          "unscheduledContinuousGlucose",
          "bloodGlucose",
          "insulin",
          "food",
          "generic-com.abbottdiabetescare.informatics.exercise",
          "generic-com.abbottdiabetescare.informatics.customnote",
          "generic-com.abbottdiabetescare.informatics.ondemandalarm.low",
          "generic-com.abbottdiabetescare.informatics.ondemandalarm.high",
          "generic-com.abbottdiabetescare.informatics.ondemandalarm.projectedlow",
          "generic-com.abbottdiabetescare.informatics.ondemandalarm.projectedhigh",
          "generic-com.abbottdiabetescare.informatics.sensorstart",
          "generic-com.abbottdiabetescare.informatics.error",
          "generic-com.abbottdiabetescare.informatics.isfGlucoseAlarm",
          "generic-com.abbottdiabetescare.informatics.alarmSetting"
        ],
        bloodGlucoseEntries: [],
        genericEntries: [],
        scheduledContinuousGlucoseEntries: glucoseEntries || [],
        insulinEntries: insulinEntries || [],
        foodEntries: foodEntries || [],
        unscheduledContinuousGlucoseEntries: glucoseSelection || []
      }
    },
    Domain: "Libreview"
  };

  const response = await axios.default.post('https://api.libreview.ru/lsl/api/measurements', data, {
    headers: {
      'Content-Type': 'application/json'
    }
  });

  console.log('transferLibreView, response', response.data);
};

exports.authLibreView = authLibreView;
exports.transferLibreView = transferLibreView;