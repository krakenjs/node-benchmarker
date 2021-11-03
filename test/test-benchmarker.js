'use strict';
const assert = require('assert');
const path = require('path');
const { Benchmarker } = require('../');
const Artillery = require('../lib/tool/artillery');
const consolePublisher = new (require('../lib/publisher/console'))();
const testTool = new (require('./fixtures/test-tool'))();
const testPublisher = new (require('./fixtures/test-publisher'))();
const { setBaseUrl } = require('./fixtures/common');

describe('benchmarker', function () {
  let server, target_url, restoreBaseUrl;
  before(function before(next) {
    restoreBaseUrl = setBaseUrl();
    server = require('./fixtures/app').listen(function () {
      console.info(`app listening on port ${this.address().port}`);
      target_url = `http://127.0.0.1:${this.address().port}`;
      delete process.env.TEST_TARGET;
      next();
    });
  });

  after(function after() {
    if (restoreBaseUrl) restoreBaseUrl();
    if (server) {
      server.close();
    }
  });

  afterEach(() => {
    delete process.env.TEST_TARGET;
  });

  function EventListener(benchmarker) {
    const events = Object.create(null);
    benchmarker.on('execute', (benchmark)=> {
      events.execute = {benchmark};
    });
    benchmarker.on('parse', (benchmark, output) => {
      events.parse = {benchmark, output};
    });
    benchmarker.on('publish', (benchmark, result) => {
      events.publish = {benchmark, result};
    });
    benchmarker.on('complete', (benchmark, result) => {
      events.complete = {benchmark, result};
    });
    return {
      assert() {
        assert.ok(events.execute, '"execute" event should be raised');
        assert.ok(events.execute.benchmark, '"execute" event should receive "benchmark" object');
        assert.ok(events.parse, '"parse" event should be raised');
        assert.ok(events.parse.benchmark, '"parse" event should receive "benchmark" object');
        assert.ok(events.parse.output, '"parse" event should receive "output" object');
        assert.ok(events.publish, '"publish" event should be raised');
        assert.ok(events.publish.benchmark, '"publish" event should receive "benchmark" object');
        assert.ok(events.publish.result, '"publish" event should receive "result" object');
        assert.ok(events.complete, '"complete" event should be raised');
        assert.ok(events.complete.benchmark, '"complete" event should receive "benchmark" object');
        assert.ok(events.complete.result, '"complete" event should receive "result" object');
      }
    };
  }

  it('should fail with no tool passed', function () {
    try {
      new Benchmarker();
      assert.fail(`Benchmarker initiation should throw`);
    } catch(ex) {
      assert.ok(ex, `Error expected!`);
    }
  });


  it('should fail w/o target url set', async function () {
    const tool = new Artillery();
    try {
      const benchmarker = new Benchmarker({tool});
      await benchmarker.run(path.join(__dirname, 'fixtures/artillery/test.yml'));
      assert.fail(`Benchmarker run should throw!`);
    } catch(ex) {
      assert.ok(ex, `Error expected!`);
    }
  }).timeout(10000);

  it('should succeed with target url set', async function () {
    const tool = testTool;
    const benchmarker = new Benchmarker({tool});
    assert.strictEqual(benchmarker.name, tool.name, 'Benchmarker name should be tool name');
    assert.ok(benchmarker.instanceId, 'Benchmarker instanceId should be set');
    assert.strictEqual(typeof benchmarker.instanceId, 'number', 'Benchmarker instanceId should be a number');
    const eventListener = EventListener(benchmarker);
    try {
      await benchmarker.run(path.join(__dirname, 'fixtures/artillery/test.yml'));
    } catch(ex) {
      assert.ifError(ex);
    }
    eventListener.assert();
  });

  it('should succeed with test tool and publisher', async function () {
    const tool = testTool;
    const publishers = [testPublisher];
    await Promise.all(publishers.map(p => p.connect()));
    const benchmarker = new Benchmarker({tool, publishers});
    assert.strictEqual(benchmarker.name, tool.name, 'Benchmarker name should be tool name');
    assert.ok(benchmarker.instanceId, 'Benchmarker instanceId should be set');
    assert.strictEqual(typeof benchmarker.instanceId, 'number', 'Benchmarker instanceId should be a number');
    const eventListener = EventListener(benchmarker);
    try {
      await benchmarker.run(path.join(__dirname, 'fixtures/artillery/test.yml'));
    } catch(ex) {
      assert.ifError(ex);
    }
    eventListener.assert();
    await Promise.all(publishers.map(p => p.close()));
  });

  it('should support artillery and multiple publishers', async function () {
    restoreBaseUrl = setBaseUrl(`${target_url}`);
    const tool = new Artillery();
    const publishers = [testPublisher, consolePublisher];
    await Promise.all(publishers.map(p => p.connect()));
    const benchmarker = new Benchmarker({tool, publishers});
    // NOT NEEDED WITH BASE_URL
    // process.env.TEST_TARGET = `${target_url}`;
    const eventListener = EventListener(benchmarker);
    try {
      await benchmarker.run(path.join(__dirname, 'fixtures/artillery/test.yml'));
    } catch(ex) {
      assert.ifError(ex);
    }
    eventListener.assert();
    await Promise.all(publishers.map(p => p.close()));
  }).timeout(30000);
});
