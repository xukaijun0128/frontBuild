# frontBuild

This is a tool make easier to concat and compress the javascript & scss files

## Installing
```shell $ npm install -g frontBuild ```

## Getting started

Create .rbuildrc in your application root directory:

```
{
    "path": {
        "build": {
            "javascript": "build/javascripts",
            "css": "build/stylesheets"
        },
        "components_config": "configs/components.json"
        "resources_config": "configs/resources",
        "static_root": "assets"
    },
    "prefix": {
        "resources_key": "controllers",
        "resources_css": "assets/stylesheets"
        "resources_javascript": "assets/javascripts"
    },
    "sass": {
        "dist": {
            "folders": [
                {
                    "expand": true,
                    "cwd": "configs/scss",
                    "src": ["*.scss"],
                    "dest": "build/stylesheets",
                    "ext": ".css"
                }
            ],
            "dir": "configs/scss"
        }
    }
}

```

## Usage
```shell

  Usage: rbuild [options]

  Options:

    -b, --build     start to build
    -w, --watch  watch which changes and to build
```

