const fs = require('fs');
const { handler } = require('./index.js');
const path = require('path');

if (process.argv.length !== 3) {
  console.error(`Please provide sample payload file's path as an argument. Usage: node ${process.argv[1]} path-to-payload.json`);
  return;
}

const payloadFilePath = path.join(process.cwd(), process.argv[2]);
console.log(`Using payload from file: ${payloadFilePath}`);

const event = JSON.parse(fs.readFileSync(payloadFilePath, 'utf8'));
const callback = function callback() {
  console.log('Function run has been finished.');
};

handler(event, {}, callback);
