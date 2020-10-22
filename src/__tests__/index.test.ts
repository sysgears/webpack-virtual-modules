import MemoryFileSystem from 'memory-fs';
import webpack from 'webpack';
import path from 'path';
import Plugin from '../index';
import { resolve } from 'dns';

describe('webpack-virtual-modules', () => {
  it('should fail if not applied as plugin', () => {
    const plugin = new Plugin();

    expect(() => plugin.writeModule('example.js', '')).toThrow();
  });

  it('should NOT fail if applied as plugin', () => {
    const plugin = new Plugin();

    webpack({
      plugins: [plugin],
      entry: './entry.js',
    });

    expect(() => plugin.writeModule('example.js', '')).not.toThrow();
  });

  it('should write static modules to fs', async () => {
    const options = { 'static_module1.js': 'const foo;' };
    options[path.resolve('static_module2.js')] = 'const bar;';
    const plugin = new Plugin(options);

    return new Promise((resolve) => {
      webpack({
        plugins: [plugin],
        entry: './entry.js',
      }).run(async (err, stats) => {
        if (!stats) throw err;

        const fs = stats.compilation.inputFileSystem as MemoryFileSystem;
        expect(fs.readFileSync(path.resolve('static_module1.js')).toString()).toEqual('const foo;');
        expect(fs.readFileSync(path.resolve('static_module2.js')).toString()).toEqual('const bar;');
        resolve();
      });
    });
  });

  it('static modules should survive fs purge', async () => {
    const plugin = new Plugin({
      'static_module.js': 'const foo;',
    });

    return new Promise((resolve) => {
      webpack({
        plugins: [plugin],
        entry: './entry.js',
      }).run((err, stats) => {
        if (!stats) throw err;

        const fs = stats.compilation.inputFileSystem as MemoryFileSystem;
        fs.purge();
        expect(fs.readFileSync(path.resolve('static_module.js')).toString()).toEqual('const foo;');
        resolve();
      });
    });
  });

  it('purge should work when no virtual files exist', async () => {
    const plugin = new Plugin();

    return new Promise((resolve) => {
      webpack({
        plugins: [plugin],
        entry: './entry.js',
      }).run((err, stats) => {
        if (!stats) throw err;

        expect(() => {
          const fs = stats.compilation.inputFileSystem as MemoryFileSystem;
          fs.purge();
        }).not.toThrow();

        resolve();
      });
    });
  });

  it('two instances of plugin should have no conflicts', async () => {
    const plugin1 = new Plugin({ 'static_module1.js': 'const foo;' });
    const plugin2 = new Plugin({ 'static_module2.js': 'const bar;' });

    const compiler = webpack({
      plugins: [plugin1, plugin2],
      entry: './entry.js',
    });

    return new Promise((resolve) => {
      compiler.run((err, stats) => {
        if (!stats) throw err;

        const fs = stats.compilation.inputFileSystem as MemoryFileSystem;
        expect(fs.readFileSync(path.resolve('static_module1.js')).toString()).toEqual('const foo;');
        expect(fs.readFileSync(path.resolve('static_module2.js')).toString()).toEqual('const bar;');

        resolve();
      });
    });
  });

  it('should write dynamic modules to fs', async () => {
    const plugin = new Plugin();

    const compiler = webpack({
      plugins: [plugin],
      entry: './entry.js',
    });

    return new Promise((resolve) => {
      const watcher = compiler.watch({}, (err, stats) => {
        if (!stats) throw err;

        plugin.writeModule('dynamic_module.js', 'const baz;');
        const fs = stats.compilation.inputFileSystem as MemoryFileSystem;
        fs.purge();
        expect(fs.readFileSync(path.resolve('dynamic_module.js')).toString()).toEqual('const baz;');
        watcher.close(resolve);
      });
    });
  });

  it('should invalidate bundle on dynamic module write', async () => {
    const plugin = new Plugin({
      'entry.js': 'require("./dynamic_module.js");',
      'dynamic_module.js': '',
    });
    const compiler = webpack({
      plugins: [plugin],
      entry: { bundle: './entry.js' },
    });
    compiler.outputFileSystem = new MemoryFileSystem();
    let count = 0;

    const waiter = (callback) => {
      const fileWatchers = (compiler.watchFileSystem as any).watcher.fileWatchers;
      if (fileWatchers instanceof Map) {
        // Webpack v5 is a map
        if (!Array.from(fileWatchers.keys()).length) {
          setTimeout(function () {
            waiter(callback);
          }, 50);
        } else {
          callback();
        }
      } else if (!Object.keys(fileWatchers).length) {
        setTimeout(function () {
          waiter(callback);
        }, 50);
      } else {
        callback();
      }
    };

    return new Promise((resolve) => {
      const watcher = compiler.watch({}, (err, stats) => {
        if (count === 0) {
          waiter(() => {
            if (!stats) throw err;

            plugin.writeModule('dynamic_module.js', 'const baz;');
            const fs = stats.compilation.inputFileSystem as MemoryFileSystem;
            fs.purge();

            // eslint-disable-next-line jest/no-conditional-expect
            expect(fs.readFileSync(path.resolve('dynamic_module.js')).toString()).toEqual('const baz;');
            count++;
          });
        } else {
          watcher.close(resolve);
        }
      });
    });
  });

  it('should work with path which parent dir not exists', async () => {
    const plugin = new Plugin({
      'entry.js': 'const a = require("a").default; const b = require("b").default; export default a + b;',
      'node_modules/a.js': 'export default 1;',
      'node_modules/b.js': 'export default 2;',
    });
    const compiler = webpack({
      context: __dirname,
      plugins: [plugin],
      entry: './entry.js',
      output: {
        path: path.resolve(__dirname),
        filename: 'bundle.js',
        library: 'test',
        libraryTarget: 'umd',
      },
      target: 'node',
    });
    const fileSystem = new MemoryFileSystem();
    compiler.outputFileSystem = fileSystem;

    return new Promise((resolve) => {
      compiler.run((err, stats) => {
        expect(stats).toBeDefined();
        expect(err).toBeNull();
        if (!stats) throw err;
        expect(stats.hasErrors()).toBeFalsy();
        expect(stats.toJson().errors).toHaveLength(0);
        const outputPath = path.resolve(__dirname, 'bundle.js');
        const outputFile = fileSystem.readFileSync(outputPath).toString();
        const output = eval(outputFile + ' module.exports;').default;
        expect(output).toEqual(3);
        const fs = compiler.inputFileSystem as MemoryFileSystem;
        const rootEntries = fs.readdirSync(__dirname);
        expect(rootEntries).toContain('entry.js');
        expect(rootEntries).toContain('node_modules');
        const nmEntries = fs.readdirSync(path.join(__dirname, 'node_modules'));
        expect(nmEntries).toContain('a.js');
        expect(nmEntries).toContain('b.js');

        resolve();
      });
    });
  });
});
