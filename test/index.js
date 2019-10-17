"use strict";

var MemoryFileSystem = require("memory-fs");
var webpack = require("webpack");
var assert = require("chai").assert;
var path = require("path");

var Plugin = require("../index");

describe("webpack-virtual-modules", function() {
  it("should fail if not applied as plugin", function() {
    var plugin = new Plugin();

    assert.throws(function() {
      plugin.writeModule("example.js", "");
    });
  });

  it("should NOT fail if applied as plugin", function() {
    var plugin = new Plugin();

    webpack({
      plugins: [plugin],
      entry: './entry.js'
    });

    assert.doesNotThrow(function() {
      plugin.writeModule("example.js", "");
    });
  });

  it("should write static modules to fs", function(done) {
    var options = {'static_module1.js': 'var foo;'};
    options[path.resolve('static_module2.js')] = 'var bar;';
    var plugin = new Plugin(options);

    webpack({
      plugins: [plugin],
      entry: './entry.js'
    }).run(function(err, stats) {
      var fs = stats.compilation.inputFileSystem;
      assert.equal(fs.readFileSync(path.resolve('static_module1.js')).toString(), 'var foo;');
      assert.equal(fs.readFileSync(path.resolve('static_module2.js')).toString(), 'var bar;');
      done();
    });
  });

  it("static modules should survive fs purge", function(done) {
    var plugin = new Plugin({
      'static_module.js': 'var foo;'
    });

    webpack({
      plugins: [plugin],
      entry: './entry.js'
    }).run(function(err, stats) {
      var fs = stats.compilation.inputFileSystem;
      fs.purge();
      assert.equal(fs.readFileSync(path.resolve('static_module.js')).toString(), 'var foo;');
      done();
    });
  });

  it("purge should work when no virtual files exist", function(done) {
    var plugin = new Plugin();

    webpack({
      plugins: [plugin],
      entry: './entry.js'
    }).run(function(err, stats) {
      assert.doesNotThrow(function() {
        var fs = stats.compilation.inputFileSystem;
        fs.purge();
      });
      done();
    });
  });

  it("two instances of plugin should have no conflicts", function(done) {
    var plugin1 = new Plugin({'static_module1.js': 'var foo;'});
    var plugin2 = new Plugin({'static_module2.js': 'var bar;'});

    var compiler = webpack({
      plugins: [plugin1, plugin2],
      entry: './entry.js'
    });

    compiler.run(function(err, stats) {
      var fs = stats.compilation.inputFileSystem;
      assert.equal(fs.readFileSync(path.resolve('static_module1.js')).toString(), 'var foo;');
      assert.equal(fs.readFileSync(path.resolve('static_module2.js')).toString(), 'var bar;');
      done();
    });
  });

  it("should write dynamic modules to fs", function(done) {
    var plugin = new Plugin();

    var compiler = webpack({
      plugins: [plugin],
      entry: './entry.js'
    });
    var watcher = compiler.watch(null, function(err, stats) {
      plugin.writeModule('dynamic_module.js', 'var baz;');
      var fs = stats.compilation.inputFileSystem;
      fs.purge();
      assert.equal(fs.readFileSync(path.resolve('dynamic_module.js')).toString(), 'var baz;');
      watcher.close(done);
    });
  });

  it("should invalidate bundle on dynamic module write", function(done) {
    var plugin = new Plugin({
      'entry.js': 'require("./dynamic_module.js");',
      'dynamic_module.js': ''
    });
    var compiler = webpack({
      plugins: [plugin],
      entry: { bundle: './entry.js' }
    });
    compiler.outputFileSystem = new MemoryFileSystem();
    var count = 0;

    var waiter = function(callback) {
      if (!Object.keys(compiler.watchFileSystem.watcher.fileWatchers).length) {
        setTimeout(function() { waiter(callback); }, 50);
      } else {
        callback();
      }
    };

    var watcher = compiler.watch(null, function(err, stats) {
      if (count === 0) {
        waiter(function() {
          plugin.writeModule('dynamic_module.js', 'var baz;');
          var fs = stats.compilation.inputFileSystem;
          fs.purge();
          assert.equal(fs.readFileSync(path.resolve('dynamic_module.js')).toString(), 'var baz;');
          count++;
        });
      } else {
        watcher.close(done);
      }
    });
  });

  it('should work with path which parent dir not exists', function (done) {
    var plugin = new Plugin({
      'entry.js': 'const a = require("a").default; const b = require("b").default; export default a + b;',
      'node_modules/a.js': 'export default 1;',
      'node_modules/b.js': 'export default 2;'
    });
    var compiler = webpack({
      context: __dirname,
      plugins: [plugin],
      entry: './entry.js',
      output: {
        path: path.resolve(__dirname),
        filename: 'bundle.js',
        library: 'test',
        libraryTarget: 'umd'
      },
      target: 'node'
    });
    const fileSystem = new MemoryFileSystem();
    compiler.outputFileSystem = fileSystem;
    compiler.run(function(err, stats) {
      assert(!err);
      assert(!stats.hasErrors(), stats.toJson().errors[0]);
      const outputPath = path.resolve(__dirname, 'bundle.js');
      const outputFile = fileSystem.readFileSync(outputPath).toString();
      const output = eval(outputFile + ' module.exports;').default;
      assert.equal(output, 3);
      done();
    });
  });
});
