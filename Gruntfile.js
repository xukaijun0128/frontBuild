module.exports = function(grunt) {
    require('time-grunt')(grunt);
    require('load-grunt-tasks')(grunt);
    var fs = require('fs'),
        infoInstance,
        sassConfig,
        _ = require('underscore'),
        getInfo = require('./bin/getInfo'),
        pkg = grunt.file.readJSON(require('os').tmpdir() + '/grunt.json'),
        tempResourceMap = {},
        basePath = pkg.basePath,
        buildDirectory = pkg.buildDirectory;
        grunt.initConfig({
            copy: pkg.copy,
            uglify: pkg.uglify,
            concat: pkg.concat,
            sass: pkg.sass,
            clean: pkg.clean,
            watch: pkg.watch
        });

        infoInstance = new getInfo(basePath + '.rbuildrc');
        _getFilesWithAbsolutePath = function(files) {
            return _.map(files, function(fileName) {
                return basePath + fileName;
            });
        };
        grunt.event.on('watch', function(action, filepath, target) {

            var hasThis = {},
                sassConfig,
                cwd,
                resourceFiles = [],
                tasks = grunt.config();

            if (target === 'css') {
                cwd = pkg.sassDist.folders[0].cwd;
                sassConfig = infoInstance.listSass();
                filepath = filepath.split('/public/')[1].replace(/\.scss|\.css/, '');
                _.each(sassConfig, function(value, key) {
                    if (value.indexOf(filepath) !== -1) {
                        resourceFiles.push(
                            {
                                "expand": true,
                                "cwd": basePath + cwd,
                                "src": [key.split(cwd + '/')[1]],
                                "dest": basePath + pkg.sassDist.folders[0].dest,
                                "ext": ".css"
                            }
                        );
                    }
                })
                if (_.isEmpty(files)) {
                    return;
                }
                tasks.sass.dist.files = resourceFiles;
                grunt.initConfig(tasks);
                grunt.task.run(['sass']);
            }
        });
        grunt.registerTask(
            'build',
            ['copy:main', 'uglify:task', 'concat:task', 'sass', 'clean']
        );
        grunt.registerTask(
            'jsCompress',
            ['copy:main', 'uglify:task', 'concat:task', 'clean']
        );

};
