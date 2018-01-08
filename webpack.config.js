const path = require('path');
const ZipPlugin = require('zip-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.join(__dirname, './dist'),
    filename: 'bundle.js',
    libraryTarget: 'commonjs2',
  },
  target: 'node',
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
  plugins: [
    new ZipPlugin({}),
  ],
  // Workaround for https://github.com/sindresorhus/got/issues/345.
  externals: {
    electron: 'electron',
  },
};
