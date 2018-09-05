/**
 * Webpack configuration file
 */
const path = require('path');

const webpackStream = require('webpack-stream');
const webpack = webpackStream.webpack;

const config = require('./config.json');
const mode = require('./mode.js');

const SRC = path.join(config.root.devDir, config.js.devDir);

module.exports = {
  output: {
    publicPath: '/js/'
  },
  mode: mode.isDevelopment ? 'development' : 'production',
  devtool: mode.isDevelopment ? 'cheap-module-inline-source-map' : false,
  watch: mode.isDevelopment,

  module: {
    rules: [{
      test: /\.js$/,
      include: path.join(__dirname, '..', '..', SRC),
      loader: 'babel-loader'
    }]
  },
  plugins: [
    new webpack.NoEmitOnErrorsPlugin()
  ]
}