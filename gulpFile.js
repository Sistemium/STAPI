const gulp = require('gulp');
const nodemon = require('gulp-nodemon');
const eslint = require('gulp-eslint');

gulp.task('serve', namedTask('serve'));

gulp.task('lint', () => gulp.src(['src/**/*.js'])
  .pipe(eslint())
  .pipe(eslint.formatEach())
  .pipe(eslint.failAfterError()));

function namedTask(name) {

  return done => {

    const stream = nodemon({
      script: `gulp/${name}`,
      ext: 'js',
      watch: ['server'],
      // tasks: ['lint'],
      restartable: 'rs',
      done,
    });

    stream
      .on('restart', () => console.log('restarted!'))
      .on('crash', () => {
        console.error('Application has crashed!\n');
        // stream.emit('restart', 10)  // restart the server in 10 seconds
      });

  };
}
