var components, resources, Info,
    currentDir = process.cwd() + '/',
    _ = require('underscore'),
    Config = require('./config'),
    md5 = require('MD5'),
    fs = require('fs');

Info = function(config) {
    this.config = new Config(config);
    this.config.read();
    this.resources = null;
    this.resourcesBasePath = fs.realpathSync(config + '/../') + '/';
};

Info.prototype.parseComponents = function() {
    var _this = this,
        configs,
        configPath,
        configFiles,
        configInstance,
        globalConfig,
        result;

    configInstance = this.config;
    configPath = configInstance.get('path', 'components_config');
    if (typeof configPath === 'undefined') {
        return null;
    }
    configPath = this.resourcesBasePath + configPath;
    return _this.todoParseCpt(configInstance.getByFile(configPath));
}

Info.prototype.todoParseCpt = function(components) {
    var _this = this,
        component,
        recursionReplace,
        results = {},
        result;

    _.each(components, function(configSet, key) {
        result = {
                javascript: []
            };

        if (typeof configSet.javascript !== 'undefined') {
            result.javascript = _this.replaceRes(
                configSet.javascript, 'javascript', components
            );
        }

        results[key] = result;
    });

    recursionReplace = _.size(
        _.filter(results, function(component, key) {
            var javascript = component.javascript;
            javascript = _.filter(javascript, function(fileName) {
                return fileName.indexOf('res:') === 0;
            });
            return (_.size(javascript) > 0);
        })
    ) > 0;


    if (recursionReplace) {
        return _this.todoParseCpt(results);
    }
    return results;
}

Info.prototype.replaceRes = function(files, type, components) {
    var result = [];

    _.each(files, function(fileName) {
        var component;
        fileName = fileName.replace(/\s/g, '');
        if (fileName.indexOf('res:') === 0) {
            component = components[fileName.replace('res:', '')][type];
            if (typeof component !== 'undefined') {
                result = _.union(result, component);
            }
        } else {
            result = _.union(result, fileName);
        }
    });

    return result;
}

Info.prototype.parseResources = function() {
    var _this = this,
        resources = {},
        configs,
        configInstance,
        prefixConfig,
        buildConfig;

    if (_this.resources === null) {
        configs = _this.getResources();
        if (configs === null) {
            return null;
        }
        components = _this.parseComponents();
        componentsCount = _.size(components);

        configInstance = _this.config;
        prefixConfig = configInstance.get('prefix');
        buildConfig = configInstance.get('path', 'build');

        _.each(configs, function(config, key) {
            var javascript = config.javascript,
                javascriptPathPrefix = prefixConfig['resources_javascript'],
                javascriptDestPrefix = buildConfig['javascript'],
                keyPrefix = prefixConfig['resources_key'],
                destPrefix,
                javascriptPath;

            if (componentsCount > 0) {
                javascript = _this.replaceRes(
                    javascript, 'javascript', components
                );
            }

            if (typeof configs[key]['dest_prefix'] === 'undefined') {
                destPrefix = keyPrefix + '_' + key;
            } else {
                destPrefix = configs[key]['dest_prefix'];
            }

            javascript = _.map(javascript, function(fileName) {
                return javascriptPathPrefix + '/' + fileName;
            });
            if (_.size(javascript) > 0) {
                javascriptPath = javascriptDestPrefix + '/' + destPrefix + '_' +
                    _this._md5Files(javascript) + '.js';
            } else {
                javascriptPath = null;
            }

            resources[keyPrefix + '/' + key] = {
                javascript: javascript,
                dest: {
                    javascript: javascriptPath
                }
            };
        })

        this.resources = resources;
    }

    return _this.resources;
}

Info.prototype._md5Files = function(files) {
    var hash = [],
        basePath = this.resourcesBasePath;

    _.each(files, function(file) {
        file = basePath + file;
        hash.push(md5(file + fs.lstatSync(file).mtime));
    });

    return md5(hash.join('')).substr(0, 32);
};

Info.prototype.getResources = function() {
    var configs,
        configPath,
        configFiles,
        configInstance,
        globalConfig,
        result;

    configInstance = this.config;
    configPath = configInstance.get('path', 'resources_config');
    if (typeof configPath === 'undefined') {
        return null;
    }
    configPath = this.resourcesBasePath + configPath;
    if (fs.lstatSync(configPath).isFile()) {
        configs = configInstance.getByFile(configPath);
    } else {
        configFiles = fs.readdirSync(configPath);
        if (_.size(configFiles) <= 0) {
            return null;
        }
        configs = {};
        _.each(configFiles, function(fileName) {
            var fileConfigs;

            fileName = configPath + '/' + fileName;
            if (fs.lstatSync(fileName).isFile()) {
                fileConfigs = configInstance.getByFile(fileName);
                if (fileConfigs !== null) {
                    _.each(fileConfigs, function(fileConfig, key) {
                        configs[key] = fileConfig;
                    });
                }
            }
        });
    }

    if (_.size(configs) <= 0) {
        return null;
    }
    globalConfig = configs['global'];
    result = {};
    _.each(configs, function(config, key) {
        var globalJavascript,
            javascript;

        if (key === 'global') {
            result[key] = config;
        } else {
            if (config.ignore_global === true || typeof globalConfig === 'undefined') {
                result[key] = config;
            } else {
                globalJavascript = globalConfig.javascript;
                if (typeof globalJavascript !== 'undefined') {
                    javascript = config.javascript;
                    if (typeof javascript === 'undefined') {
                        javascript = globalJavascript;
                    } else {
                        javascript = _.union(globalJavascript, javascript);
                    }
                }

                config.javascript = (typeof javascript !== 'undefined' ? javascript : []);

                result[key] = config;
            }
        }
    });
    return result;
}

Info.prototype.getSassConfig = function() {
    var configInstance = this.config,
        _this = this,
        sass = configInstance.get('sass', 'dist');
        files = [];
    _.each(sass.folders, function(model) {
        model.cwd = _this.resourcesBasePath + model.cwd;
        model.dest = _this.resourcesBasePath + model.dest;
        files.push(model);
    });
    return files;
}

Info.prototype.listSass = function() {
    var configInstance = this.config,
        _this = this,
        configFiles,
        sass = configInstance.get('sass', 'dist'),
        configPath = this.resourcesBasePath + sass.dir;
    configFiles = fs.readdirSync(configPath);
    if (_.size(configFiles) <= 0) {
        return null;
    }
    configs = {};
    _.each(configFiles, function(fileName) {
        var fileConfigs;

        fileName = configPath + '/' + fileName;
        if (fs.lstatSync(fileName).isFile()) {
            fileConfigs = fs.readFileSync(fileName).toString().replace(/\s/g, '');
            configs[fileName] = fileConfigs;
        }
    });

    return configs;
}

Info.prototype.reGetTask = function(resourceFiles, resources, buildDirectory, basePath) {
    var tempResourceMap,
        tasks = {
            copy: {
                main: {
                    files: []
                }
            },
            concat: {
                task: {
                    files: {}
                }
            },
            uglify: {
                task: {
                    files: {}
                }
            },
            sass: {
                dist: {
                    options: {
                        style: 'compressed' //压缩
                    },
                    files: []
                }
            },
            chmod: {
                options: {
                  mode: '666'
                },
                target: {
                  src: []
                }
            },
            watch: {
                js: {
                    files: [],
                    tasks: [],
                    options: {
                      spawn: false,
                    }
                },
                scss: {
                    files: [],
                    tasks: [],
                    options: {
                      spawn: false,
                    }
                }
            },
            clean: {
                files: [],
                options: {
                    force: true
                }
            },
            resources: {

            }
        };
    _.each(resourceFiles, function(jsFile) {
        tempResourceMap[jsFile] = buildDirectory.javascript + 'dest/' + jsFile.replace(basePath, '');
        tasks.copy.main.files.push({
            expand: true,
            src: [jsFile],
            dest: buildDirectory.javascript + 'dest/',
            filter: 'isFile'
        });

        tasks.uglify.task.files[buildDirectory.javascript + 'dest/' + jsFile.replace(basePath, '')] = [jsFile];
    });
    _.each(resources, function(resource) {
        var dest = resource.dest, javascript;

        if (typeof dest.javascript !== 'undefined' && dest.javascript !== null) {
            javascript = basePath + dest.javascript;
            tasks.concat.task.files[javascript] = _.map(
                _this._getFilesWithAbsolutePath(resource.javascript),
                function(js) {
                    return tempResourceMap[js];
                }
            );
        }
    });
    return tasks;
}

Info.prototype.save = function() {
    var resources = this.parseResources(),
        data;
    if (_.size(resources) > 0) {
        data = {};
        _.each(resources, function(resource, key) {
            data[key] = resource['dest']
        });
        data['timestamp'] = new Date().getTime();
        fs.writeFileSync(this.resourcesBasePath + 'rbuild.lock', JSON.stringify(data));
    }
};

module.exports = Info;
