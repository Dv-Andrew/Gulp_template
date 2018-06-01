var gulp        = require('gulp'),
    run         = require('run-sequence'),
    browserSync = require('browser-sync'),
    plumber     = require('gulp-plumber'),
    posthtml    = require('gulp-posthtml'),
    include     = require('posthtml-include'),
    htmlmin     = require('gulp-htmlmin'),
    sass        = require('gulp-sass'),
    postcss     = require('gulp-postcss'), //need for autoprefixer
    autoprefixer= require('autoprefixer'),
    cleanCss    = require('gulp-clean-css'), //minify css
    imagemin    = require('gulp-imagemin'),
    webp        = require('gulp-webp'),
    svgstore    = require('gulp-svgstore'),
    file        = require('gulp-file'),
    concat      = require('gulp-concat'),
    rename      = require('gulp-rename'),
    del         = require('del'),
    merge       = require('merge-stream');

//дефолтный таск
gulp.task('default', ['watch']);

//таск для создания директорий проекта
gulp.task('createDirectories', function() {
    return gulp.src("*.*", {read: false})
    .pipe(gulp.dest('./build'))
    .pipe(gulp.dest('./src/css'))
    .pipe(gulp.dest('./src/fonts'))
    .pipe(gulp.dest('./src/img'))
    .pipe(gulp.dest('./src/img/svg'))
    .pipe(gulp.dest('./src/img/svg/sprite'))
    .pipe(gulp.dest('./src/js'))
    .pipe(gulp.dest('./src/sass'));
});

//таск для создания начальных файлов проекта
gulp.task('createFiles', function() {
    var html = file('index.html', '', { src: true })
    .pipe(gulp.dest('./src'));

    var css = file('style.css', '', { src: true })
    .pipe(gulp.dest('./src/css'));

    var scss = file('style.scss', '', { src: true })
    .pipe(gulp.dest('./src/sass'));

    return merge(html, css, scss);
});

// таск для отображения процесса разработки в браузере
gulp.task('browser-sync', function() {
    browserSync.init({
        server: {
            baseDir: "build"
        },
        notify: false
    });
});

//таск для генерации html
gulp.task('generateHtml', function() {
    return gulp.src('src/**/*.html')
    .pipe(posthtml([
        include()
    ]))
    .pipe(htmlmin({
        collapseWhitespace: true
    }))
    .pipe(gulp.dest('build'));
});

//таск для генерации css
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

//таск для минификации изображений
gulp.task('minifyImg', function() {
    return gulp.src('src/img/**/*.{png,jpg,svg}')
    .pipe(imagemin([
        imagemin.optipng({optimizationLevel: 3}),
        imagemin.jpegtran({progressive: true}),
        imagemin.svgo()
    ]))
    .pipe(gulp.dest('build/img'));
});

//таск для конвертации изображений в webp
gulp.task('convertToWebp', function() {
    return gulp.src('src/img/**/*.{png,jpg}')
    .pipe(webp({
        quality: 90
    }))
    .pipe(gulp.dest('build/img/webp/'));
});

//таск для создания спрайтов на основе svg
gulp.task('createSprite', function() {
    return gulp.src('build/img/svg/sprite/*.svg') //работаю сразу с папкой продакшена, т.к. подразумевается, что предварительно svg были оптимизированный таском minifyImg
    .pipe(svgstore({
        inlineSvg: true
    }))
    .pipe(rename('sprite.svg'))
    .pipe(gulp.dest('build/img/svg'));
});

//таск для копирования файлов в build
gulp.task('copyFiles', function() {
    return gulp.src([
        'src/fonts/**/*.{woff,woff2}'
    ]) 
    .pipe(gulp.dest('build/fonts/'));
});

//таск для очистки директории продакшена
gulp.task('clean-build', function() {
    return del.sync('build/*');
});

// таск для компиляции, минификации и сборки всего проекта для продакшена
gulp.task('build', ['clean-build'], function(done) {
    run(
        'clean-build',
        'minifyImg',
        'convertToWebp',
        'createSprite',
        'generateHtml',
        'generateCss',
        'copyFiles',
        done
    );
});

//таск для создания первичной структуры проекта
gulp.task('startNewProject', function(done) {
    run(
        'createDirectories',
        'createFiles',
        'build',
        done
    );
});

// таск для отслеживания изменений в файлах
gulp.task('watch', ['browser-sync'], function() {
    //при сохранении любого sass/scss, html файла в рабочей директории выполняем соответствующий таск
    gulp.watch('src/**/*.html', ['generateHtml']);
    gulp.watch('src/sass/**/*.+(sass|scss)', ['generateCss']);
    // следим за файлами в продакшн директории и при их изменении обновляем браузер
    gulp.watch('build/**/*.html', browserSync.reload);
    gulp.watch('build/css/**/*.css', browserSync.reload);
    gulp.watch('build/js/**/*.js', browserSync.reload);
});
