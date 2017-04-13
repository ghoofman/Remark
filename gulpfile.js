/* jshint node: true */
'use strict';

var gulp = require('gulp'),
    g = require('gulp-load-plugins')({ lazy: false }),
    noop = g.util.noop,
    rimraf = require('rimraf'),
    lazypipe = require('lazypipe'),
    stylish = require('jshint-stylish');

var htmlminOpts = {
    removeComments: true,
    collapseWhitespace: true,
    removeEmptyAttributes: false,
    collapseBooleanAttributes: true,
    removeRedundantAttributes: true
};

/**
 * JS Hint
 */
gulp.task('jshint', function () {
    return gulp.src([
        './gulpfile.js',
        './js/**/*.js'
    ])
    .pipe(g.cached('jshint'))
    .pipe(jshint('./.jshintrc'));
});

/**
 * CSS
 */
gulp.task('clean-css', function (done) {
    rimraf('./dist/css', done);
});

gulp.task('styles', ['clean-css'], function () {
    return gulp.src([
        './less/**/*.less'
    ])
        .pipe(g.less())
        .pipe(gulp.dest('./tmp/css/'))
        .pipe(g.cached('built-css'));
});

gulp.task('styles-dist', ['styles'], function () {
    return cssFiles().pipe(dist('css', 'remark', {}));
});

gulp.task('csslint', ['styles'], function () {
    return cssFiles()
        .pipe(g.cached('csslint'))
        .pipe(g.csslint('./.csslintrc'))
        .pipe(g.csslint.formatter());
});

/**
 * Scripts
 */
gulp.task('scripts-dist', [], function () {
    return appFiles().pipe(dist('js', 'remark', { ngAnnotate: true }));
});

/**
 * Resources
 */
gulp.task('resources-dist', [], function () {
    return resourceFiles().pipe(copy('remark', { ngAnnotate: true }));
});



/**
 * Index
 */
gulp.task('build-all', ['styles']);


/**
 * Assets
 */
gulp.task('assets', function () {
    return gulp.src('./src/objs/**')
        .pipe(gulp.dest('./dist/assets'));
});

/**
 * Dist
 */
gulp.task('dist', ['assets', 'styles-dist', 'scripts-dist', 'resources-dist']);

/**
 * Default task
 */
gulp.task('default', ['lint', 'build-all']);

/**
 * Lint everything
 */
gulp.task('lint', ['jshint', 'csslint']);

/**
 * All CSS files as a stream
 */
function cssFiles(opt) {
    return gulp.src('./tmp/css/**/*.css', opt);
}

/**
 * All CSS files as a stream
 */
function resourceFiles(opt) {
    return gulp.src([
        './imgs/**/*',
        './fonts/**/*',
        './index.html',
        './manifest.json'
    ], opt);
}

/**
 * All AngularJS application files as a stream
 */
function appFiles() {
    var files = [
        './js/**/*.js'
    ];
    return gulp.src(files);
}

/**
 * Concat, rename, minify
 *
 * @param {String} ext
 * @param {String} name
 * @param {Object} opt
 */
function copy(name, opt) {
    opt = opt || {};
    return lazypipe()
        .pipe(gulp.dest, './dist')();
}

/**
 * Concat, rename, minify
 *
 * @param {String} ext
 * @param {String} name
 * @param {Object} opt
 */
function dist(ext, name, opt) {
    opt = opt || {};
    return lazypipe()
        .pipe(g.concat, name + '.' + ext)
        .pipe(ext === 'js' ? g.uglify : g.minifyCss)
        .pipe(g.rename, name + '.min.' + ext)
        .pipe(gulp.dest, './dist')();
}

/**
 * Jshint with stylish reporter
 */
function jshint(jshintfile) {
    return lazypipe()
        .pipe(g.jshint, jshintfile)
        .pipe(g.jshint.reporter, stylish)();
}
