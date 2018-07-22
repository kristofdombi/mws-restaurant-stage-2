const gulp = require("gulp");
const browserSync = require("browser-sync").create();
const imagemin = require("gulp-imagemin");
const imageminPngquant = require("imagemin-pngquant");
const uglify = require("gulp-uglify-es").default;
const webserver = require("gulp-webserver");
const cleanCSS = require("gulp-clean-css");

gulp.task(
  "default",
  ["cpHtml", "styles", "cpImages", "cpManifest", "cpScripts"],
  function() {
    gulp.watch("js/**/*.js");
    gulp.watch("/*.html", ["cpHtml"]);
    gulp.watch("./dist/*.html").on("change", browserSync.reload);

    browserSync.init({
      server: "./dist"
    });
  }
);

gulp.task("dist", [
  "cpHtml",
  "cpManifest",
  "imagesProcess",
  "scriptsDist",
  "styles"
]);

gulp.task("styles", function() {
  gulp
    .src(["css/**/*"])
    .pipe(cleanCSS({ compatibility: "ie8" }))
    .pipe(gulp.dest("dist/css"));
});

gulp.task("cpScripts", function() {
  gulp.src("js/**/*.js").pipe(gulp.dest("dist/js"));
  gulp.src("sw.js").pipe(gulp.dest("dist/"));
});

gulp.task("scriptsDist", function() {
  gulp
    .src("js/**/*.js")
    .pipe(uglify())
    .pipe(gulp.dest("dist/js"));
  gulp
    .src("sw.js")
    .pipe(gulp.dest("dist/"));
});

gulp.task("cpHtml", function() {
  gulp.src("./*.html").pipe(gulp.dest("./dist"));
});

gulp.task("cpImages", function() {
  gulp.src("img/*").pipe(gulp.dest("dist/img"));
});

gulp.task("cpManifest", function() {
  gulp.src("./manifest.json").pipe(gulp.dest("./dist"));
});

gulp.task("imagesProcess", function() {
  return gulp
    .src("img/*")
    .pipe(
      imagemin({
        progressive: true,
        use: [imageminPngquant()],
        speed: 5
      })
    )
    .pipe(gulp.dest("dist/img"));
});

gulp.task("test", ["dist"]);

gulp.task("webserver", function() {
  gulp.src("dist").pipe(
    webserver({
      host: "localhost",
      port: 1234,
      livereload: true,
      open: true
    })
  );
});
