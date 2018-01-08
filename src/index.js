const lamdbaSlack = require('./lib/lambda-slack');

exports.handler = (event, context, callback) => {
  lamdbaSlack(event, callback);
};
