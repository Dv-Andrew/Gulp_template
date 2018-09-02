'use strict'

const requireDir = require('require-dir');

requireDir('./tasks', { recurse: true });

const gulp = require('gulp'),
  path = require('path'),
  del = require('del'),
  gulplog = require('gulplog'),
  sourcemaps = require('gulp-sourcemaps'),
  gulpIf = require('gulp-if'),
  newer = require('gulp-newer'),
  notify = require('gulp-notify'),
  plumber = require('gulp-plumber'),
  sass = require('gulp-sass'),
  postcss = require('gulp-postcss'),
  autoprefixer = require('autoprefixer'),
  cleanCss = require('gulp-clean-css'),
  uglify = require('gulp-uglify'),
  imagemin = require('gulp-imagemin'),
  webp = require('gulp-webp'),
  svgstore = require('gulp-svgstore'),
  rename = require('gulp-rename');

const webpackStream = require('webpack-stream');
const webpack = webpackStream.webpack;
const named = require('vinyl-named');

// таск для генерации CSS
gulp.task('generateCSS', function() {
  //в style.sass|scss записываем импорты, из них компилируется один style.css файл
  return gulp.src('src/sass/**/style.+(sass|scss)')
    .pipe(plumber({
      errorHandler: notify.onError(function(err) {
        return {
          title: 'Error in Styles',
          message: err.message
        };
      })
    }))
    .pipe(newer('build/css'))
    .pipe(gulpIf(isDevelopment, sourcemaps.init()))
    .pipe(sass())
    .pipe(postcss([autoprefixer({ //автоматически добавляем вендорные префиксы
    })]))
    .pipe(gulp.dest('src/css'))
    .pipe(gulpIf(!isDevelopment, cleanCss()))
    .pipe(gulpIf(isDevelopment, sourcemaps.write()))
    .pipe(gulpIf(isDevelopment, gulp.dest('build/css')))
    .pipe(gulpIf(!isDevelopment, gulp.dest('docs/css')));
});

// таск для генерации JavaScript посредством Webpack
gulp.task('webpack', function(callback) {
  let firstBuildReady = false;

  function done(err, stats) {
    firstBuildReady = true;

    if (err) { // hard error, see https://webpack.github.io/docs/node.js-api.html#error-handling
      return; // emit('error', err) in webpack-stream
    }

    gulplog[stats.hasErrors() ? 'error' : 'info'](stats.toString({
      colors: true
    }));
  }

  let webpackConfig = {
    output: {
      publicPath: '/js/'
    },
    mode: isDevelopment ? 'development' : 'production',
    devtool: isDevelopment ? 'cheap-module-inline-source-map' : false,
    watch: isDevelopment,

    module: {
      rules: [{
        test: /\.js$/,
        include: path.join(__dirname, "src"),
        loader: 'babel-loader'
      }]
    },
    plugins: [
      new webpack.NoEmitOnErrorsPlugin()
    ]
  }

  return gulp.src('src/js/*.js')
    .pipe(plumber({
      errorHandler: notify.onError(function(err) {
        return {
          title: 'Error in JS (Webpack task)',
          message: err.message
        };
      })
    }))
    .pipe(named())
    .pipe(webpackStream(
      webpackConfig,
      null,
      done
    ))
    .pipe(gulpIf(!isDevelopment, uglify()))
    .pipe(gulpIf(isDevelopment, gulp.dest('build/js')))
    .pipe(gulpIf(!isDevelopment, gulp.dest('docs/js')))
    .on('data', function() {
      if (firstBuildReady) {
        callback();
      }
    });
});

// таск для минификации изображений
gulp.task('minifyImg', function() {
  return gulp.src('src/img/**/*.{png,jpg,svg}', { since: gulp.lastRun('minifyImg') })
    .pipe(newer('build/img'))
    .pipe(imagemin([
      imagemin.optipng({ optimizationLevel: 3 }),
      imagemin.jpegtran({ progressive: true }),
      imagemin.svgo()
    ]))
    .pipe(gulpIf(isDevelopment, gulp.dest('build/img')))
    .pipe(gulpIf(!isDevelopment, gulp.dest('docs/img')));
});

// таск для конвертации изображений в webp
gulp.task('convertToWebp', function() {
  return gulp.src('src/img/**/*.{png,jpg}')
    .pipe(newer('build/img/webp'))
    .pipe(webp({
      quality: 90
    }))
    .pipe(gulpIf(isDevelopment, gulp.dest('build/img/webp/')))
    .pipe(gulpIf(!isDevelopment, gulp.dest('docs/img/webp/')));
});

// таск для создания спрайтов на основе svg
gulp.task('createSprite', function() {
  return gulp.src('build/img/svg/sprite/*.svg') //работаю сразу с папкой продакшена, т.о. подразумевается, что предварительно svg были оптимизированны и перемещены таском minifyImg
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(rename('sprite.svg'))
    .pipe(gulpIf(isDevelopment, gulp.dest('build/img/svg')))
    .pipe(gulpIf(!isDevelopment, gulp.dest('docs/img/svg')));
});

// таск для копирования файлов в build
gulp.task('copyFiles', function() {
  return gulp.src([
      'src/fonts/**/*.{woff,woff2}' // пока только шрифты
    ])
    .pipe(gulpIf(isDevelopment, gulp.dest('build/fonts/')))
    .pipe(gulpIf(!isDevelopment, gulp.dest('docs/fonts/')));
});

// таск для очистки директории билда
gulp.task('clean-build', function(callback) {
  if (isDevelopment) { // лол, даже не знаю законно ли использовать такие условия в gulp'e, но это работает
    del('build/*');
  } else {
    del('build');
    del('docs/*');
  }
  callback();
});
gulp.task('clean-buildSprite', function(callback) {
  if (isDevelopment) {
    del('build/img/svg/sprite');
  } else {
    del('build/img/svg/sprite');
    del('docs/img/svg/sprite');
  }
  callback();
});

// таск для компиляции, минификации и сборки всего проекта для продакшена
gulp.task('build',
  gulp.series(
    'getCurrentEnvironment',
    'clean-build',
    'minifyImg',
    'convertToWebp',
    'createSprite',
    'clean-buildSprite',
    gulp.parallel(
      'html',
      'generateCSS',
      'webpack'),
    'copyFiles'
  ));

// таск для создания первичной структуры проекта
gulp.task('startNewProject',
  gulp.series(

    'createDirectories',
    'createFiles',
    'build'
  )
);

// таск для отслеживания изменений в файлах
gulp.task('watch',
  function() {
    // при сохранении любого sass/scss, html файла в рабочей директории выполняем соответствующий таск
    gulp.watch('src/**/*.html', gulp.series('html'));
    gulp.watch('src/sass/**/*.+(sass|scss)', gulp.series('generateCSS'));
  }
);

gulp.task('dev',
  gulp.series(
    'build',
    gulp.parallel(
      'watch',
      'server'
    )
  )
);