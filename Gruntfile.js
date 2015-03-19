module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        connect: {
          server : {
            options : {
              port : 9090,
              keepalive : false,
              livereload : true
            }
          },
        },

        open: {
          dev: {
            // Gets the port from the connect configuration
            path: 'http://localhost:<%= connect.server.options.port%>'
          }
        }

    });

    // 3. Where we tell Grunt we plan to use this plug-in.
    grunt.loadNpmTasks('grunt-contrib-connect');
    // grunt.loadNpmTasks('grunt-contrib-watch');
    // grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-open');

    // 4. Where we tell Grunt what to do when we type "grunt" into the terminal.
    grunt.registerTask('default', ['connect', 'open:dev']);

};
