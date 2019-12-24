'use strict';
const assert = require('assert');
const path = require('path');
const config = require('../lib/config')._clear();

describe('config', function () {
  
  let nodeEnv = process.env.NODE_ENV;
  afterEach(()=> {
    config._clear();
    process.env.NODE_ENV = nodeEnv;
  });

  const assertConfig = function assertConfig(cfg) {
    assert(cfg, 'Config object should be returned');
    assert(cfg.tool, 'Config should contain tool');
    assert.strictEqual(typeof cfg.tool, 'object', 'Tool config should be an Object');
    assert(cfg.publishers, 'Config should contain publishers');
    assert.strictEqual(Array.isArray(cfg.publishers), true, 'Publishers object should be an Array');
  };
  
  it('should get default and allow concurrent access', async function () {
    process.env.NODE_ENV = 'test';
    const cfgs = await Promise.all([config.get(), config.get()]);
    assert.strictEqual(cfgs[0], cfgs[1], 'Concurrently access config. It should return same object.');
    const cfg = await config.get();
    assert.strictEqual(cfgs[0], cfg, 'Next config.get should return same object.');
    assertConfig(cfg);
  });

  it('should accept custom config file path and concurrent get', async function () {
    const cfgs = await Promise.all([config.set(path.join(__dirname, 'fixtures/config.json')), config.get()]);
    assert.strictEqual(cfgs[0], cfgs[1], 'Concurrently get and set config. It should return same object.');
    const cfg = await config.get();
    assert.strictEqual(cfgs[0], cfg, 'Next config.get should return same object.');
    assertConfig(cfg);
    assert.strictEqual(cfg.publishers.length, 2, 'publishers length should be 2.');
  });

  it('should accept custom config json path and concurrent get', async function () {
    const custom_config = {
      "tool": {
        "module": {
          "name": "path:./lib/tool/artillery"
        }
      },
      "publishers": [
        {
          "module": {
            "name": "path:./lib/publisher/console"
          }
        }
      ]
    };
    const cfgs = await Promise.all([config.set(custom_config), config.get()]);
    assert.strictEqual(cfgs[0], cfgs[1], 'Concurrently get and set config. It should return same object.');
    const cfg = await config.get();
    assert.strictEqual(cfgs[0], cfg, 'Next config.get should return same object.');
    assertConfig(cfg);
    assert.strictEqual(cfg.publishers.length, 1, 'publishers length should be 1.');
  });
});
