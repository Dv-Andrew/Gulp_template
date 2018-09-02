/**
 * Вывод сообщения с действующим значением переменной NODE_ENV
 */
const gulp = require('gulp');

gulp.task('getCurrentEnvironment', function(callback) {
  console.log('--------------------------------------------');
  console.log(`Current environment: ${process.env.NODE_ENV}`);
  console.log('If you want to change environment use:\n\"set NODE_ENV=production/development\"');
  console.log('--------------------------------------------');
  callback();
});