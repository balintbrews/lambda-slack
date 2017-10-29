const path = require('path');
const webpack = require('webpack');


module.exports = {

  entry: './index.js',
  output: {
    path: path.join(__dirname, './dist'),
    filename: 'bundle.js',
    libraryTarget: "commonjs2",
  },
  target: "node",
  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: 'pre',
        use: {
          loader: 'eslint-loader',
          options: {
            emitError: false,
            emitWarning: true,
          },
        },
        exclude: [/node_modules/],
      },
    ],
  },

};
