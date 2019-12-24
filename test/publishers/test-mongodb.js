'use strict';
const assert = require('assert');
const path = require('path');
const sinon = require('sinon');
const Benchmarker = require('../../lib/benchmarker');
const testTool = new (require('../fixtures/test-tool'))();
const mongodbPublisher = new (require('../../lib/publisher/mongodb'))();

// mock mongodb model functions
const modelFns = { 
  'updateOne': async function updateOne(filter, update, options) {
    assert(filter, '"filter" object should be passed');
    assert(filter._id, 'filter should containg "_id"');
    assert(update, '"update" object should be passed');
    assert(options, '"options" object should be passed');
    assert.strictEqual(options.upsert, true, '"options" should contain "upsert"');
  } 
};

describe('publisher.mongodb', function () {
  before(function before() {
    sinon.stub(require('mongoose'), 'createConnection').returns({
      model: (modelName, schema) => {
        assert.strictEqual(modelName, 'benchmarks', 'Model name should be "benchmarks"');
        assert(schema, '"schema" should be passed');
        const model = Object.create(null);
        for (const [method, assertFn] of Object.entries(modelFns)) {
          model[method] = assertFn; 
        }
        return model;
      },
      close: async () => {},
    });
  });

  after(function after() {
    sinon.restore();
  });

  it('should run with mock mongodb publisher', async function () {
    const tool = testTool;
    const publishers = [mongodbPublisher];
    await Promise.all(publishers.map(p => p.connect()));
    const benchmarker = new Benchmarker({tool, publishers});
    assert.strictEqual(benchmarker.name, tool.name, 'Benchmarker name should be tool name');
    assert.ok(benchmarker.instanceId, 'Benchmarker instanceId should be set');
    assert.strictEqual(typeof benchmarker.instanceId, 'number', 'Benchmarker instanceId should be a number');
    try {
      await benchmarker.run(path.join(__dirname, 'fixtures/artillery/test.yml'));
    } catch(ex) {
      assert.ifError(ex);
    }
    await Promise.all(publishers.map(p => p.close()));
  });

  it('should throw if connect is called multiple times', async function () {
    const publishers = [mongodbPublisher, mongodbPublisher];
    try {
      await Promise.all(publishers.map(p => p.connect()));
      assert.fail('Calling connect second time should throw');
    } catch (ex) {
      assert.ok(/cannot connect to the db twice/.test(ex.message), 'Error expected');
    }
  });
});
