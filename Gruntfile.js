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
        },

        browserify: {
          dist: {
            files: {
              'dist/main.js': ['js/busfinder.js'] //changed to busfinder.js just for testing
            },
            options: {
              transform: ['node-underscorify'],
              debug: true,
            }
          }
        },

        watch: {
          scripts: {
            files: ['js/**/*.js'],
            tasks: ['browserify'],
            options: {
              spawn: false,
              livereload: true
            }
          },
          styles: {
            files: ['css/**/*.js'],
            tasks: ['browserify'],
            options: {
              spawn: false,
              livereload: true
            }
          },
          markup: {
            files: ['index.html'],
            tasks: ['browserify'],
            options: {
              spawn: false,
              livereload: true
            }
          }
        }

    });

    // 3. Where we tell Grunt we plan to use this plug-in.
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-open');

    // 4. Where we tell Grunt what to do when we type "grunt" into the terminal.
    grunt.registerTask('default', ['browserify','connect', 'open:dev', 'watch']);

};
