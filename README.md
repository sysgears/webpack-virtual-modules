# Webpack Virtual Modules

[![Build Status](https://travis-ci.org/sysgears/webpack-virtual-modules.svg?branch=master)](https://travis-ci.org/sysgears/webpack-virtual-modules)
[![Twitter Follow](https://img.shields.io/twitter/follow/sysgears.svg?style=social)](https://twitter.com/sysgears)

**Webpack Virtual Modules** is a plugin that allows for dynamical generation of in-memory virtual modules for builds
created with webpack. This plugin supports the watch mode meaning any write to a virtual module is seen by webpack as if 
a real file stored on the disk was changed.

## Installation

Use NPM or Yarn to install Webpack Virtual Modules as a development dependency:

```bash
# with NPM
npm install webpack-virtual-modules --save-dev

# with Yarm
yarn add webpack-virtual-modules --dev
```

## Usage

For usage with Webpack 3, please see [Webpack 3 Usage](docs/webpack3.md)

## Usage with Webpack 4

### Static virtual modules generation
### Generating of static virtual modules

Require the plugin in the webpack configuration file, then create and add virtual modules in the `plugins` array:

```js
const VirtualModulesPlugin = require("webpack-virtual-modules");

const virtualModules = new VirtualModulesPlugin({
  'node_modules/module-foo.js': 'module.exports = { foo: "foo" };',
  'node_modules/module-bar.js': 'module.exports = { bar: "bar" };'
});

module.exports = {
  // other webpack configurations
  plugins: [
    // other plugins
    virtualModules
  ]
};
```

You can now import your virtual modules anywhere in your application and use the code as you need:

```js
const moduleFoo = require('module-foo');
// You can now use moduleFoo in other file
console.log(moduleFoo.foo);
```

### Dynamic virtual modules generation

You can generate virtual modules dynamically with Webpack Virtual Modules. 

Here's an example of dynamic generation of a module. All you need to do is create new virtual modules using the plugin 
and add it 

```js
const webpack = require('webpack');
const VirtualModulesPlugin = require('webpack-virtual-modules');

// Create an empty set of virtual modules
const virtualModules = new VirtualModulesPlugin();

const compiler = webpack({
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

In other module or a Webpack plugin, you can write to the module `module-foo` whatever you need. After this write, 
webpack will "see" that `module-foo.js` has been changed and will restart the compilation.

```js
virtualModules.writeModule(
  'node_modules/module-foo.js',
  'module.exports = { foo: "foo" };'
);
```

## Examples

  - [Swagger JSDoc Example with Webpack 3](examples/swagger-webpack3)
  - [Swagger JSDoc Example with Webpack 4](examples/swagger-webpack4)

## Inspiration

This project is inspired by [virtual-module-webpack-plugin].

## License

Copyright © 2017 [SysGears INC]. This source code is licensed under the [MIT] license.

[virtual-module-webpack-plugin]: https://github.com/rmarscher/virtual-module-webpack-plugin
[MIT]: LICENSE
[SysGears INC]: http://sysgears.com
