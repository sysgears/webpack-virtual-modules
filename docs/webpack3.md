# Using Webpack Virtual Modules with Webpack 3

## Installation

Use NPM or Yarn to install Webpack Virtual Modules as a development dependency:

```bash
# with NPM
npm install webpack-virtual-modules --save-dev

# with Yarm
yarn add webpack-virtual-modules --dev
```

## Usage

You can use Webpack Virtual Modules with webpack 3 and 4. The examples below show the usage with webpack 3. If you want 
to use our plugin with webpack 4, check out a dedicated section in `README.md`:

* [Webpack Virtual Modules with Webpack 4]

### Generating static virtual modules

Require the plugin in the webpack configuration file, then create and add virtual modules in the `plugins` array in the
webpack configuration object:

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

You can now import your virtual modules anywhere in the application and use them:

```js
var moduleFoo = require('module-foo');
// You can now use moduleFoo in other file
console.log(moduleFoo.foo);
```

### Generating dynamic virtual modules

You can generate virtual modules **_dynamically_** with Webpack Virtual Modules. 

Here's an example of dynamic generation of a module. All you need to do is create new virtual modules using the plugin 
and add them to the `plugins` array. After that, you need to add a webpack hook. For using hooks, consult [webpack 
compiler hook documentation].

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
  virtualModules.writeModule('node_modules/module-foo.js', '');
  callback();
});

compiler.watch();
```

In other module or a Webpack plugin, you can write to the module `module-foo` whatever you need. After this write, 
webpack will "see" that `module-foo.js` has changed and will restart compilation.

```js
virtualModules.writeModule(
  'node_modules/module-foo.js',
  'module.exports = { foo: "foo" };'
);
```

## Examples

  - [Swagger JSDoc Example with Webpack 3]
  - [Swagger JSDoc Example with Webpack 4]
  
[webpack virtual modules with webpack 4]: https://github.com/sysgears/webpack-virtual-modules/blob/master/README.md#usage-with-webpack-4 
[swagger jsdoc example with webpack 3]: https://github.com/sysgears/webpack-virtual-modules/tree/master/examples/swagger-webpack3
[swagger jsdoc example with webpack 4]: https://github.com/sysgears/webpack-virtual-modules/tree/master/examples/swagger-webpack4
