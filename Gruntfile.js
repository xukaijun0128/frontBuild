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
                resourceFiles = [],
                tasks = grunt.config();

            if (target === 'js') {
                hasThis = _.filter(pkg.resources, function(value, key) {
                    return _.size(_.filter(value.javascript, function(v) {
                        return filepath.indexOf(v) !== -1;
                    })) > 0;
                });
                if (_.isEmpty(hasThis)) {
                    return;
                }
                _.each(hasThis, function(resource) {
                    var dest = resource.dest,
                        javascript;

                    if (typeof dest.javascript !== 'undefined' && dest.javascript !== null) {
                        javascript = basePath + dest.javascript;
                    }
                    _.each(_getFilesWithAbsolutePath(resource.javascript), function(jsFile) {
                        resourceFiles.push(jsFile);
                    });
                });

                _.each(resourceFiles, function(jsFile) {
                    tempResourceMap[jsFile] = buildDirectory.javascript + 'dest/' + jsFile.replace(basePath, '');
                    tasks.copy.watchTask.files.push({
                        expand: true,
                        src: [jsFile],
                        dest: buildDirectory.javascript + 'dest/',
                        filter: 'isFile'
                    });
                    tasks.uglify.watchTask.files[buildDirectory.javascript + 'dest/' + jsFile.replace(basePath, '')] = [jsFile];
                });
                _.each(hasThis, function(resource) {
                    var dest = resource.dest, javascript;

                    if (typeof dest.javascript !== 'undefined' && dest.javascript !== null) {
                        javascript = basePath + dest.javascript;
                        tasks.concat.watchTask.files[javascript] = _.map(
                            _getFilesWithAbsolutePath(resource.javascript),
                            function(js) {
                                return tempResourceMap[js];
                            }
                        );
                    }
                });
                grunt.initConfig(tasks);
                grunt.task.run(['copy:watchTask', 'uglify:watchTask', 'concat:watchTask', 'clean']);
            } else {
                sassConfig = infoInstance.listSass();
                filepath = filepath.split('/public/')[1].replace(/\.scss|\.css/, '');
                _.each(sassConfig, function(value, key) {
                    if (value.indexOf(filepath) !== -1) {
                        resourceFiles.push(
                            {
                                "expand": true,
                                "cwd": basePath + "rbuild/scss",
                                "src": [key.split('rbuild/scss/')[1]],
                                "dest": basePath + "public/build",
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
            ['copy', 'uglify', 'concat', 'sass', 'clean']
        );

};
