'use strict';
const assert = require('assert');
const path = require('path');
const sinon = require('sinon');
const EventEmitter = require('events');
const Benchmarker = require('../../lib/benchmarker');
const testTool = new (require('../fixtures/test-tool'))();
const esPublisher = new (require('../../lib/publisher/elasticsearch'))();

// mock indices
const indicesFns = { 
  'exists': async function indexExists({index}) {
    assert.strictEqual(typeof index, 'string', '"index" should be passed');
    return false;
  },
  'create': async function indexCreate({index, body}) {
    this.indexName = index;
    assert.strictEqual(typeof index, 'string', '"index" should be passed');
    assert(body, '"body" object should be passed');
    return true;
  }
};

// Mock client
class Client extends EventEmitter {
  constructor({node}) {
    super();
    assert.strictEqual(typeof node, 'string', '"node" should be passed');
    this.indices = Object.create(null);
    for (const [method, assertFn] of Object.entries(indicesFns)) {
      this.indices[method] = assertFn.bind(this);
    }
  }

  async index({id, index, body}) {
    assert.strictEqual(typeof id, 'string', '"id" should be passed');
    assert.strictEqual(typeof index, 'string', '"index" should be passed');
    assert.strictEqual(index, this.indexName, '"index" should be created');
    assert(body, '"body" object should be passed');
  }

  async close() { }
}

describe('publisher.elasticsearch', function () {
  before(function before() {
    sinon.stub(require('es7'), 'Client').value(Client);
  });

  after(function after() {
    sinon.restore();
  });

  it('should run with mock elasticsearch publisher', async function () {
    const tool = testTool;
    const publishers = [esPublisher];
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
    const publishers = [esPublisher, esPublisher];
    try {
      await Promise.all(publishers.map(p => p.connect()));
      assert.fail('Calling connect second time should throw');
    } catch (ex) {
      assert.ok(/cannot connect to the es instance twice/.test(ex.message), 'Error expected');
    }
  });
});
