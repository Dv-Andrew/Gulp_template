// module.exports = {
//   output: {
//     publicPath: '/js/'
//   },
//   mode: isDevelopment ? 'development' : 'production',
//   devtool: isDevelopment ? 'cheap-module-inline-source-map' : false,
//   watch: isDevelopment,

//   module: {
//     rules: [{
//       test: /\.js$/,
//       include: path.join(__dirname, "src"),
//       loader: 'babel-loader'
//     }]
//   },
//   plugins: [
//     new webpack.NoEmitOnErrorsPlugin()
//   ]
// }