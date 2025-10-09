const gulp = require("gulp");
const htmlmin = require("gulp-html-minifier-terser");
const csso = require("gulp-csso");
const terser = require("gulp-terser");

const paths = {
  input: {
    assets: "src/public/**/*",
    html: "src/public/**/*.html",
    css: "src/public/**/*.css",
    js: "src/public/**/*.js",
    json: "src/*.json",
  },
  output: "dist",
};

const { input, output } = paths;
const { series, parallel } = gulp;

function copyAssets() {
  return gulp.src(input.assets).pipe(gulp.dest(`${output}/public`));
}

function copyJson() {
  return gulp.src(input.json).pipe(gulp.dest(output));
}

function minHtml() {
  return gulp
    .src(input.html)
    .pipe(
      htmlmin({
        collapseWhitespace: true,
        removeComments: true,
        minifyCSS: true,
        minifyJS: true,
      })
    )
    .pipe(gulp.dest(`${output}/public`));
}

function minCss() {
  return gulp.src(input.css).pipe(csso()).pipe(gulp.dest(`${output}/public`));
}

function minJs() {
  return gulp.src(input.js).pipe(terser()).pipe(gulp.dest(`${output}/public`));
}

exports.build = series(copyJson, copyAssets, parallel(minHtml, minCss, minJs));
