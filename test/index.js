"use strict";

var webpack = require("webpack");
var assert = require("chai").assert;

var Plugin = require("../src/index");

describe("webpack-overlay-modules", function() {
  it("should fail if not applied as plugin", function() {
    var plugin = new Plugin();

    assert.throws(function() {
      plugin.writeModule("example.js", "");
    });

    assert.throws(function() {
      plugin.replaceLoadedModule("example.js", "");
    });
  });

  it("should NOT fail if applied as plugin", function() {
    var plugin = new Plugin();

    webpack({
      plugins: [plugin],
      entry: 'index.js'
    });

    assert.doesNotThrow(function() {
      plugin.writeModule("example.js", "");
    });

    assert.doesNotThrow(function() {
      plugin.replaceLoadedModule("example.js", "");
    });
  });
});