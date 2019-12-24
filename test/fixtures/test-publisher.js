'use strict';
const assert = require('assert');
const { Publisher } = require('../../');
const { Debug } = require('../../lib/utils');

const kConn = Symbol('conn');

// debug should be initiazed lazy
let debug;

class TestPublisher extends Publisher {
  /**
   * Creates a connection
   * @param {String} uri 
   * @param {Object} options 
   */
  async connect({uri='https://dummy-server/benchmarks', options={}}={}) {
    if (this[kConn]) throw new Error('cannot connect to the db twice');
    this[kConn] = true;
    if (!debug) debug = Debug('benchmarker:publisher:test');
    debug('new client connection: %s %j', uri, options);
    await super.connect();
    return new Promise((resolve)=> {
      setTimeout(() => {
        this[kConn] = new (class Conn {
          constructor(uri) {
            this.uri = uri;
          }
          close(){
            this.uri = void 0;
          }
        })(uri);
        resolve();
      }, 100);
    });
  }

  /**
   * close connection
   */
  async close() {
    const conn = this[kConn];
    this[kConn] = void 0;
    if (conn && typeof conn === 'object') {
      await conn.close();
    }
    await super.close();
  }

  /**
   * Publish to mongo db
   * @param {Object} context 
   * @param {Object} benchmark 
   * @param {Object|String} result 
   */
  async publish(context, benchmark, result) {
    await super.publish(context, benchmark, result);
    const assertStats = (label, stats) => {
      if (stats.max) assert.strictEqual(typeof stats.max, 'number', `${label}.max should be a number`);
      if (stats.min) assert.strictEqual(typeof stats.min, 'number', `${label}.min should be a number`);
      if (stats.median) assert.strictEqual(typeof stats.median, 'number', `${label}.median should be a number`);
      if (stats.p90) assert.strictEqual(typeof stats.p90, 'number', `${label}.p90 should be a number`);
      if (stats.p95) assert.strictEqual(typeof stats.p95, 'number', `${label}.p95 should be a number`);
      if (stats.p99) assert.strictEqual(typeof stats.p99, 'number', `${label}.p99 should be a number`);
    };
    assert(this[kConn] && this[kConn].uri, `can't call publish on a closed connection`);
    assert(context, `context shouleb be received`);
    assert(context.logger, `context should contain logger`);
    assert(context.benchmarker, `context should contain benchmarker`);
    assert(benchmark, 'benchmark should be received');
    assert(benchmark.id, 'benchmark should have an id');
    assert(benchmark.name, 'benchmark should have a name');
    assert(benchmark.tag, 'benchmark should have a tag');
    assert(benchmark.script, 'benchmark should have script');
    assert(benchmark.start_time instanceof Date, 'benchmark should have start_time');
    assert(benchmark.end_time instanceof Date, 'benchmark should have end_time');
    assert.strictEqual(typeof benchmark.total_time, 'number', 'benchmark should have total_time');
    assert(result, 'result should be received');
    assert.strictEqual(typeof result.iterations, 'number', 'result.iterations should be a number');
    if (result.completed !== void 0) {
      assert.strictEqual(typeof result.completed, 'number', 'result.completed should be a number');
    }
    if (result.requests !== void 0) {
      assert.strictEqual(typeof result.requests, 'number', 'result.requests should be a number');
    }
    if (result.latency !== void 0) {
      assert.strictEqual(typeof result.latency, 'object', 'result.latency should be a number');
      assertStats('result.latency', result.latency);
    }
    if (result.rps !== void 0) {
      assert.strictEqual(typeof result.rps, 'number', 'result.rps should be a number');
    }
    if (result.durations !== void 0) {
      assert.strictEqual(typeof result.durations, 'object', 'result.durations should be a number');
      assertStats('result.durations', result.durations);
    }
    if (result.timestamp !== void 0) {
      assert(result.timestamp instanceof Date, 'result.timestamp should be a Date');
    }
  }
}

module.exports = TestPublisher;
