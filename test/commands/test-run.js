'use strict';
const assert = require('assert');
const path = require('path');
const config = require('../../lib/config')._clear();
const run = require('../../lib/commands/run');
const { setBaseUrl } = require('../fixtures/common');

describe('commands.run', function () {
  let server, restoreBaseUrl;
  before(function before(next) {
    restoreBaseUrl = setBaseUrl();
    server = require('../fixtures/app').listen(function () {
      console.info(`app listening on port ${this.address().port}`);
      const target_url = `http://127.0.0.1:${this.address().port}`;
      process.env.TEST_TARGET = `${target_url}`;
      next();
    });
  });

  after(function after() {
    if (restoreBaseUrl) restoreBaseUrl();
    if (server) {
      server.close();
    }
    delete process.env.TEST_TARGET;
  });

  afterEach(() => {
    config._clear();
  });

  it('should run with test config', async function () {
    try {
      await config.set(path.join(__dirname, '../fixtures/config.json'));
      await run(path.join(__dirname, '../fixtures/artillery/*.yml'));
    } catch(ex) {
      assert.ifError(ex);
    }
  });

  it('should run with missing config', async function () {
    // no config dir under __dirname. The cfg should be empty object.
    const cfg = await config._loadConfig(__dirname);
    assert(cfg, 'should return object');
    assert.strictEqual(cfg.env, 'development', 'environment should be development');
    assert.strictEqual(Object.keys(cfg).length, 1, 'should contain one property');
    config.set(cfg);
    try {
      await run(path.join(__dirname, '../fixtures/artillery/*.yml'));
    } catch(ex) {
      assert.ifError(ex);
    }
  }).timeout(60000);
});
