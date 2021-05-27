const {src, dest, series, parallel} = require('gulp');
const browsersync = require('browser-sync');
const autoprefixer = require('gulp-autoprefixer');
const concat = require('gulp-concat');
const htmlReplace = require('gulp-html-replace');
const cleanCss = require('gulp-clean-css');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');

function browserSync() {
  return browsersync.init({
    server: {
      baseDir: "./dist"
    },
    port: 3000,
  });
}

function html() {
  return src('src/*.html')
  .pipe(
    htmlReplace({
      css: 'css/all-style.css',
      js: 'js/bundle.js',
    })
  )
  .pipe(dest('dist/'));
}

function styles() {
  return src('src/styles/*.css')
  .pipe(sourcemaps.init())
  .pipe(autoprefixer())
  .pipe(concat('all-style.css'))
  .pipe(cleanCss())
  .pipe(sourcemaps.write())
  .pipe(dest('dist/css/'));
}

function scripts() {
  return src('src/scripts/*.js')
  .pipe(sourcemaps.init())
  .pipe(concat('bundle.js'))
  .pipe(uglify())
  .pipe(sourcemaps.write())
  .pipe(dest('dist/js/'));
}

function images() {
  return src('src/images/*').pipe(dest('dist/images'));
}

exports.watch = browserSync;
exports.default = series(html, styles, scripts, images);