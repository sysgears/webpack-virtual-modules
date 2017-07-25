var VirtualStats = require('./virtual-stats');
var path = require('path');
var debug = require('debug')('webpack-virtual-modules');

var inode = 45000000;

function checkActivation(instance) {
  if (!instance._compiler) {
    throw new Error("You must use this plugin only after creating webpack instance!");
  }
}

function VirtualModulesPlugin(modules) {
  this._staticModules = modules;
}

function getModulePath(filePath, compiler) {
  return path.isAbsolute(filePath) ? filePath : path.join(compiler.context, filePath);
}

VirtualModulesPlugin.prototype.writeModule = function(filePath, contents) {
  var self = this;

  checkActivation(self);

  var len = contents ? contents.length : 0;
  var time = Date.now();

  var stats = new VirtualStats({
    dev: 8675309,
    nlink: 0,
    uid: 1000,
    gid: 1000,
    rdev: 0,
    blksize: 4096,
    ino: inode++,
    mode: 33188,
    size: len,
    blocks: Math.floor(len / 4096),
    atime: time,
    mtime: time,
    ctime: time,
    birthtime: time
  });
  var modulePath = getModulePath(filePath, self._compiler);

  debug(self._compiler.name, "Write module:", modulePath, contents);

  self._compiler.inputFileSystem._writeVirtualFile(modulePath, stats, contents);
  if (self._watcher && self._watcher.compiler.watchFileSystem.watcher.fileWatchers.length) {
    self._watcher.compiler.watchFileSystem.watcher.fileWatchers.forEach(function(fileWatcher) {
      if (fileWatcher.path === modulePath) {
        debug(self._compiler.name, "Emit file change:", modulePath, time);
        fileWatcher.emit("change", time, null);
      }
    });
  }
};

function setData(storage, key, value) {
  if (storage.data instanceof Map) {
    storage.data.set(key, value);
  } else {
    storage.data[key] = value;
  }
}

VirtualModulesPlugin.prototype.apply = function(compiler) {
  var self = this;

  self._compiler = compiler;

  compiler.plugin("after-environment", function() {
    if (!compiler.inputFileSystem._writeVirtualFile) {
      var originalPurge = compiler.inputFileSystem.purge;

      compiler.inputFileSystem.purge = function() {
        originalPurge.call(this, arguments);
        if (this._virtualFiles) {
          Object.keys(this._virtualFiles).forEach(function(file) {
            var data = this._virtualFiles[file];
            setData(this._statStorage, file, [null, data.stats]);
            setData(this._readFileStorage, file, [null, data.contents]);
          }.bind(this));
        }
      };

      compiler.inputFileSystem._writeVirtualFile = function(file, stats, contents) {
        this._virtualFiles = this._virtualFiles || {};
        this._virtualFiles[file] = {stats: stats, contents: contents};
        setData(this._statStorage, file, [null, stats]);
        setData(this._readFileStorage, file, [null, contents]);
      };
    }

    if (self._staticModules) {
      Object.keys(self._staticModules).forEach(function(path) {
        self.writeModule(path, self._staticModules[path]);
      });
      delete self._staticModules;
    }
  });

  compiler.plugin("watch-run", function(watcher, callback) {
    self._watcher = watcher;
    callback();
  });
};

module.exports = VirtualModulesPlugin;
