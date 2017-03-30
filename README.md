## Webpack Virtual Modules

[![Build Status](https://travis-ci.org/sysgears/webpack-virtual-modules.svg?branch=master)](https://travis-ci.org/sysgears/webpack-virtual-modules)
[![Greenkeeper badge](https://badges.greenkeeper.io/sysgears/webpack-virtual-modules.svg)](https://greenkeeper.io/)

Webpack Plugin that allows dynamical generation of in-memory virtual modules.

## Installation

```bash
npm install --save-dev webpack-virtual-modules
```

## Usage

### Static virtual modules generation

Sample Webpack config:

```js
var VirtualModulesPlugin = require("webpack-virtual-modules");

var virtualModules = new VirtualModulesPlugin({
  'node_modules/module-foo.js': 'module.exports = { foo: function() { return "foo"; } };'
  'node_modules/module-bar.js': 'module.exports = { bar: function() { return "bar"; } };'
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
console.log(moduleFoo.foo());
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

compiler.plugin('watch', function(callback) {
  virtualModules.writeModule('node_modules/module-foo.js', 'module.exports = {};');
  callback();
});

compiler.plugin('done', function() {
  virtualModules.writeModule('node_modules/module-foo.js', 'module.exports = { foo: function() { return "foo"; } };');
  // After this write the webpack will "see" that file module-foo.js has been changed and will restart compilation.
});

compiler.watch();
```

## Inspiration
This project is inspired by: https://github.com/rmarscher/virtual-module-webpack-plugin

## License
Copyright © 2017 [SysGears INC]. This source code is licensed under the [MIT] license.

[MIT]: LICENSE
[SysGears INC]: http://sysgears.com
