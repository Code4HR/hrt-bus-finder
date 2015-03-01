module.exports = function(grunt) {

    grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),
      browserify: {
        dist: {
          files: {
            'js/main.js': ['js/modules/*.js'],
          }
        }
      },
      watch: {
        all: {
          files: ['js/*.js'],
          tasks: ['browserify'],
        },
      },
    });

    // 3. Where we tell Grunt we plan to use this plug-in.
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    // 4. Where we tell Grunt what to do when we type "grunt" into the terminal.
    grunt.registerTask('default', ['browserify','watch']);

};
