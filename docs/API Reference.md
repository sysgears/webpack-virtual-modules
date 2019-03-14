# Webpack Virtual Modules API Reference

There are few methods that you can use with Webpack Virtual Modules. If you've run [the examples] in the 
previous sections, then you've noticed the methods `apply()` and `writeModule()` that you can run on the instance of 
Webpack Virtual Modules.

## `apply`

**Function** Attaches necessary hooks, in particular, `afterEnvironment`, `afterResolvers`, and `watchRun` hools, to 
respective events for the Webpack Virtual Modules plugin to ensure that the virtual files are added dynamically. 

**Parameters**

`compiler` &nbsp;&nbsp;&nbsp; `object` &nbsp;&nbsp;&nbsp; required &nbsp;&nbsp;&nbsp; The webpack compiler object

**Returns**

`void`

Usage example

```js
const virtualModules = new VirtualModulesPlugin({[customPluginFilePath]: JSON.stringify({
    openapi: '3.0.0',
    info: info
})});

// Passing the webpack compiler to the virtual module
virtualModules.apply(compiler);
```

## `writeModule`

**Function** Writes a static or dynamic virtual module to a path.

`writeModule(filePath: string, contents: string):`  

**Parameters**

`filePath` &nbsp;&nbsp;&nbsp; `string` &nbsp;&nbsp;&nbsp; required &nbsp;&nbsp;&nbsp; The path to the generated file 
where the virtual module will be stored

`contents` &nbsp;&nbsp;&nbsp; `string` &nbsp;&nbsp;&nbsp; required &nbsp;&nbsp;&nbsp; The string to be written into the 
file. The string can contain any code or text

**Returns**

`void`

[the usage examples]: https://github.com/sysgears/webpack-virtual-modules/tree/master/examples/swagger-webpack4
