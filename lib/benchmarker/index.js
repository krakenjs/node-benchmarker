'use strict';
const assert = require('assert');
const path = require('path');
const EventEmitter = require('events');
const { performance } = require('perf_hooks');
const ConsolePublisher = require('../publisher/console');
const { getName, getTag } = require('../utils');
const Logger = require('./logger');

const PRIVATE_PROPS = ['tool', 'publishers'];
const READONLY_PROPS = ['instanceId'];
const PROPS = READONLY_PROPS.concat(PRIVATE_PROPS);
const kProperties = PROPS.reduce((obj, prop) => {
  obj[prop] = Symbol(prop);
  return obj;
}, Object.create(null));

function initializeRun(instanceId, script, args) {
  const name = getName();
  const tag = getTag();
  const start_time = new Date();
  const id = `${name}${start_time.toJSON().replace(/[^\d]/g,'')}${instanceId.toString().padStart(4,'0')}`;
  return {id, name, tag, start_time, script: script||this.name, args: args && JSON.stringify(args)};
}

let instance = 0;

class Benchmarker extends EventEmitter {
  /**
   * ctor
   * @param {Object} options 
   */
  constructor({tool, publishers=[]}={}) {
    super();

    assert(tool, 'Tool is required for benchmarking');
    if (!Array.isArray(publishers)) publishers = [ publishers ];
    if (publishers.length === 0) publishers.push(new ConsolePublisher());

    this[kProperties.tool] = tool;
    this[kProperties.publishers] = publishers;
    this[kProperties.instanceId] = ++instance;
  }

  /**
   * Accessor for name
   */
  get name() {
    return this[kProperties.tool].name;
  }

  /**
   * Accessor for instanceId
   */
  get instanceId() {
    return this[kProperties.instanceId];
  }

  /**
   * run
   * @param {String} script 
   * @param {Array?} args 
   * @param {Object?} options 
   */
  async run(script, args, options) {
    const benchmark = initializeRun(this.instanceId, script, args);
    const scriptname = script && path.basename(script) || '';
    const logger = new Logger(`benchmarker:${this.name}:${scriptname}:${this.instanceId}`);
    const context = { logger, benchmarker: this };
    const tool = this[kProperties.tool];
    logger.log(`[${benchmark.id}]: execute`);
    this.emit('execute', benchmark);
    const startTs = performance.now();

    const output = await tool.execute(context, script, args, options);

    // eslint-disable-next-line require-atomic-updates
    benchmark.total_time = performance.now() - startTs;
    // eslint-disable-next-line require-atomic-updates
    benchmark.end_time = new Date();
    // eslint-disable-next-line require-atomic-updates
    benchmark.output = typeof output === 'string' && output || JSON.stringify(output);
    Object.freeze(benchmark);

    logger.log(`[${benchmark.id}]: parse`);
    this.emit('parse', benchmark, output);
    const result = await tool.normalizeOutput(context, output);
    Object.freeze(result);

    logger.log(`[${benchmark.id}]: publish`);
    this.emit('publish', benchmark, result);
    await Promise.all(this[kProperties.publishers].map((publisher) => publisher.publish(context, benchmark, result)));

    logger.log('complete');
    logger.log(`[${benchmark.id}]: constant`);
    this.emit('complete', benchmark, result);
  }
}

module.exports = Benchmarker;
