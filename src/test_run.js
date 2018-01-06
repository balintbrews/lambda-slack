const fs = require('fs');
const { handler } = require('./index.js');
const path = require('path');

const payloadFilePath = path.join(process.cwd(), process.argv[2]);
console.log(`Using payload from file: ${payloadFilePath}`);

const event = JSON.parse(fs.readFileSync(payloadFilePath, 'utf8'));
const callback = function callback() {
  console.log('Function run has been finished.');
};

handler(event, {}, callback);
