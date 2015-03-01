module.exports = function(grunt) {

    grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),
      connect: {
        server: {
          options: {
            keepalive: true,
            port: 9001,
            base: './'
          }
        }
      },
      browserify: {
        dist: {
          files: {
            'js/main.js': ['js/modules/*.js'],
          }
        }
      }
    });

    // 3. Where we tell Grunt we plan to use this plug-in.
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-browserify');

    // 4. Where we tell Grunt what to do when we type "grunt" into the terminal.
    grunt.registerTask('default', ['browserify','connect']);

};
