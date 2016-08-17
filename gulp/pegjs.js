var gulp = require('gulp');
var pegjs = require('gulp-peg');

var paths = {
    build : 'build',
    method: 'src/llst-method.pegjs',
    image : 'src/llst-image.pegjs'
}

gulp.task('pegjs', ['pegjs-method', 'pegjs-image'])
 
gulp.task('pegjs-method', function() {
    gulp
      .src(paths.method)
      .pipe(
          pegjs({allowedStartRules: [
              'method',
              'block',
              'expression',
              'string',
              'symbol',
              'number',
              'literalArray',
              'character',
              'pseudoVariable'
          ]}).on('error', console.log)
      )
      .pipe(
          gulp.dest(paths.build)
      )
})

gulp.task('pegjs-image', function() {
    gulp
      .src(paths.image)
      .pipe(
          pegjs().on('error', console.log)
      )
      .pipe(
          gulp.dest(paths.build)
      )
})
