## Webpack Virtual Modules

[![Build Status](https://travis-ci.org/sysgears/webpack-virtual-modules.svg?branch=master)](https://travis-ci.org/sysgears/webpack-virtual-modules)
[![Twitter Follow](https://img.shields.io/twitter/follow/sysgears.svg?style=social)](https://twitter.com/sysgears)

Webpack Plugin that allows dynamical generation of in-memory virtual modules. Watch mode is supported. Any write to virtual module will be seen by Webpack as if the corresponding file was changed.

## Installation

```bash
npm install --save-dev webpack-virtual-modules
```

## Usage

For usage with Webpack 3, please see [Webpack 3 Usage](docs/webpack3.md)

## Usage with Webpack 4

### Static virtual modules generation

Sample Webpack config:

```js
var VirtualModulesPlugin = require("webpack-virtual-modules");

var virtualModules = new VirtualModulesPlugin({
  'node_modules/module-foo.js': 'module.exports = { foo: "foo" };'
  'node_modules/module-bar.js': 'module.exports = { bar: "bar" };'
});

module.exports = {
    // ...
    plugins: [
      virtualModules
    ]
};
```

Somewhere in the source code:

```js
var moduleFoo = require('module-foo');
// Outputs 'foo'
console.log(moduleFoo.foo);
```

### Dynamic virtual modules generation

```js
var webpack = require("webpack");
var VirtualModulesPlugin = require("webpack-virtual-modules");

var virtualModules = new VirtualModulesPlugin();

var compiler = webpack({
    // ...
    plugins: [
      virtualModules
    ]
});

compiler.hooks.compilation.tap('MyPlugin', function(compilation) {
  virtualModules.writeModule('node_modules/module-foo.js', '');
});

compiler.watch();
```


```js
// Later in some other code, perhaps in other Webpack plugin:
virtualModules.writeModule('node_modules/module-foo.js',
    'module.exports = { foo: "foo" };');

// After this write the webpack will "see" that module-foo.js
// has been changed and restarts compilation
```

## Examples

  - [Swagger JSDoc Example with Webpack 3](examples/swagger-webpack3)
  - [Swagger JSDoc Example with Webpack 4](examples/swagger-webpack4)

## Inspiration
This project is inspired by: https://github.com/rmarscher/virtual-module-webpack-plugin

## License
Copyright © 2017 [SysGears INC]. This source code is licensed under the [MIT] license.

[MIT]: LICENSE
[SysGears INC]: http://sysgears.com
