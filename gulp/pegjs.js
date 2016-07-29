var gulp = require('gulp');
var pegjs = require('gulp-peg');

var paths = {
    build: 'build',
    peg: 'src/**/*.pegjs'
}
 
gulp.task('pegjs', function() {
    gulp
      .src(paths.peg)
      .pipe(
          pegjs({allowedStartRules: [
              'method',
              'comments',
              'identifier',
              'className',
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