'use strict';
const assert = require('assert');
const { Tool } = require('../../');

class TestTool extends Tool {
  constructor() {
    super(TestTool.name.toLowerCase(), { extname: '.json'});
    assert(this.extname, '.json', '"extname" should default to .json');
  }

  /**
   * This executes the tool with passed arguments.
   * @param {Object} context 
   * @param {String} script 
   * @param {Array} args 
   */
  async execute(context, script, args=[]) {
    assert(script && typeof script === 'string', 'Script is required');
    assert(Array.isArray(args), 'Arguments should be an array');
    await super.execute(context, script, args);
    return new Promise((resolve) => {
      setTimeout(resolve.bind(null, {
        stats : {
          iterations: 100,
          completed: 100,
          requests: 200,
          latency: {
            min: 1.2,
            max: 3.6,
            median: 2.4,
            p90: 3.3,
            p95: 3.4,
            p99: 3.5
          },
          rps: 1.33,
          durations: {
            min: 10.2,
            max: 13.6,
            median: 12.4,
            p90: 13.3,
            p95: 13.4,
            p99: 13.5
          },
          codes: {'200': 100, '302': 80, '400': 19, '500': 1 },
          timestamp: new Date().toLocaleString(),
        }
      }), 500);
    });
  }

  /**
   * Normalize output.
   * @param {Object} context 
   * @param {Object|String} output 
   */
  async normalizeOutput(context, output) {
    await super.normalizeOutput(context, output);
    const { 
      iterations,
      completed,
      requests,
      latency,
      rps,
      durations,
      codes,
      timestamp
    } = output && output.stats || {};

    return {
      iterations,
      completed,
      requests,
      latency,
      rps,
      durations,
      codes: codes && Object.keys(codes).reduce((o, code) => {
        const key = /^[2345]/.test(code) && code.replace(/\d\d$/, 'xx');
        if (key) {
          o[key] = (o[key]||0)+codes[code];
        } else {
          context.logger.error(`Unexpected http code ${code} in`, codes);
        }
        return o;
      }, Object.create(null)),
      timestamp: new Date(timestamp),
    };
  }
}

module.exports = TestTool;
