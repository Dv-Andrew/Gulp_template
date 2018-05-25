var gulp        = require('gulp'),
    browserSync = require('browser-sync'),
    plumber     = require('gulp-plumber'),
    htmlmin     = require('gulp-htmlmin'),
    sass        = require('gulp-sass'),
    postcss     = require('gulp-postcss'), //need for autoprefixer
    autoprefixer= require('autoprefixer'),
    cleanCss    = require('gulp-clean-css'), //minify css
    imagemin    = require('gulp-imagemin'),
    concat      = require('gulp-concat'),
    rename      = require('gulp-rename'),
    del         = require('del');

//дефолтный таск
gulp.task('default', ['watch']);

// таск для отображения процесса разработки в браузере
gulp.task('browser-sync', function() {
    browserSync.init({
        server: {
            baseDir: "src"
        },
        notify: false
    });
});

//таск для компиляции sass в css
gulp.task('generateCss', function() {
    //в style.sass|scss записываем импорты, из них компилируется один style.css файл
    return gulp.src('src/sass/**/style.+(sass|scss)')
    .pipe(plumber())
    .pipe(sass())
    .pipe(postcss([autoprefixer({ //автоматически добавляем вендорные префиксы
        grid: true //поддержка гридов для IE
    })]))
    .pipe(gulp.dest('src/css'))
    .pipe(cleanCss())
    .pipe(rename({
        suffix: ".min"
    }))
    .pipe(gulp.dest('build/css'));
});

// таск для отслеживания изменений в файлах
gulp.task('watch', ['browser-sync'], function() {
    //при сохранении любого sass/scss файла в рабочей директории выполняем таск 'generateCss'
    gulp.watch('src/sass/**/*.+(sass|scss)', ['generateCss']);
    // следим за файлами в продакшн директории и при их изменении обновляем браузер
    gulp.watch('build/**/*.html', browserSync.reload);
    gulp.watch('build/css/**/*.css', browserSync.reload);
    gulp.watch('build/js/**/*.js', browserSync.reload);
});

//таск для очистки директории продакшена
gulp.task('clean-build', function() {
    return del.sync('build/*');
});

// таск для компиляции, минификации и сборки всего проекта для продакшена
gulp.task('build', ['clean-build'], function() {
    
    //перенос и минификация разметки
    var buildHtml = gulp.src(['src/**/*.html'])
    .pipe(htmlmin({
        collapseWhitespace: true
    }))
    .pipe(gulp.dest('build'));

    //перенос и минификация стилей
    var buildCss = gulp.src(['src/css/**/style.css'])
    .pipe(cleanCss())
    .pipe(gulp.dest('build/css'));

    //перенос скриптов
    var buildJs = gulp.src(['src/js/**/*.js'])
    .pipe(gulp.dest('build/js'));

    //перенос шрифтов
    var buildFonts = gulp.src(['src/fonts/**/*'])
    .pipe(gulp.dest('build/fonts'));
    
    //перенос и минификация изображений
    var buildJpg = gulp.src(['src/img/**/*.jpg'])
    .pipe(imagemin([
        imagemin.jpegtran({
            progressive: true
        })
    ]))
    .pipe(gulp.dest('build/img'));

    var buildPng = gulp.src(['src/img/**/*.png'])
    .pipe(imagemin())
    .pipe(gulp.dest('build/img'));

    var buildSvg = gulp.src(['src/img/**/*.svg'])
    .pipe(imagemin([
        imagemin.svgo({
            plugins: [
                {removeViewBox: true},
                {cleanupIDs: false}
            ]
        })
    ]))
    .pipe(gulp.dest('build/img'));
});