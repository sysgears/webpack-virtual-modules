## Webpack Overlay Modules

[![Build Status](https://travis-ci.org/sysgears/webpack-overlay-modules.svg?branch=master)](https://travis-ci.org/sysgears/webpack-overlay-modules)
[![Greenkeeper badge](https://badges.greenkeeper.io/sysgears/webpack-overlay-modules.svg)](https://greenkeeper.io/)

Webpack Plugin that allows dynamical generation of in-memory virtual modules.

## Installation

```bash
npm install --save-dev webpack-overlay-modules
```

## Usage

### Static overlay modules generation

Sample Webpack config:

```js
var OverlayModulesPlugin = require("webpack-overlay-modules");

var overlayModules = new OverlayModulesPlugin({
  'node_modules/module-foo.js': 'module.exports = { foo: function() { return 'foo'; } };'
  'node_modules/module-bar.js': 'module.exports = { bar: function() { return 'bar'; } };'
});

module.exports = {
    // ...
    plugins: [
      overlayModules
    ]
};
```

Somewhere in the source code:

```js
var moduleFoo = require('module-foo');
// Outputs 'foo'
console.log(moduleFoo.foo());
```

### Dynamic overlay modules generation

```js
var webpack = require("webpack");
var OverlayModulesPlugin = require("webpack-overlay-modules");

var overlayModules = new OverlayModulesPlugin();

var compiler = webpack({
    // ...
    plugins: [
      overlayModules
    ]
});

compiler.plugin('watch', function(callback) {
  overlayModules.writeModule('node_modules/module-foo.js', 'module.exports = {};');
  callback();
});

compiler.plugin('done', function() {
  overlayModules.writeModule('node_modules/module-foo.js', 'module.exports = { foo: function() { return 'foo'; } };');
  // After this write the webpack will "see" that file module-foo.js has been changed and will restart compilation.
});

compiler.watch();
```

If `writeModule` happens after `seal` phase, but before `after-seal` phase the module contents will be replaced as is,
without using loaders. This is supported to let one update dynamic module contents when compilation has been finished 
already.

## Inspiration
This project is inspired by: https://github.com/rmarscher/virtual-module-webpack-plugin

## License
Copyright © 2017 [SysGears INC]. This source code is licensed under the [MIT] license.

[MIT]: LICENSE
[SysGears INC]: http://sysgears.com
