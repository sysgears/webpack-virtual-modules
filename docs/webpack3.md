## Installation

```bash
npm install --save-dev webpack-virtual-modules
```

## Usage with Webpack 3

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

compiler.plugin('watch', function(callback) {
  virtualModules.writeModule('node_modules/module-foo.js', '');
  callback();
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

