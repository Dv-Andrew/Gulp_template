'use strict'

const gulp = require('gulp');
const requireDir = require('require-dir');

requireDir('./gulp/tasks', { recurse: true });

/**
 * Building project
 */
gulp.task('build',
  gulp.series(
    'getCurrentEnvironment',
    'clean',
    'fonts',
    'createSprite',
    'img',
    'convertToWebp',
    gulp.parallel(
      'html',
      'css',
      'webpack')
  ));

/**
 * Creating a structure for a new project
 */
gulp.task('startNewProject',
  gulp.series(
    'createDirectories',
    'createFiles',
    'build'
  )
);

/**
 * Run development environment
 */
gulp.task('dev',
  gulp.series(
    'build',
    gulp.parallel(
      'watch',
      'server'
    )
  )
);