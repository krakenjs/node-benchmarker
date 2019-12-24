'use strict';
const assert = require('assert');
const mongoose = require('mongoose');
const { Debug } = require('../../utils');
const { benchmarks: benchmarks_schema } = require('./schema');

const Publisher = require('../');

// debugging
if (/mongoose/.test(process.env.DEBUG) || process.env.DEBUG === '*') {
  mongoose.set('debug', true);
}

const kConn = Symbol('conn'), kModel = Symbol('model');

// debug should be initiazed lazy
let debug;

/**
 * Filter username and password from connection strings
 *
 * @param {String} uri
 * @see https://docs.mongodb.com/manual/reference/connection-string/
 */
function cleanUri(uri) {
  return String(uri)
    .split(',')
    .map((s) => {
      return s.replace(/mongodb:\/\/[^@]+@/, 'mongodb://[cleaned]:[cleaned]@');
    })
    .join(',');
}

class MongoDBPublisher extends Publisher {
  /**
   * Creates a connection
   * @param {String} uri 
   * @param {String} model model name 
   * @param {Object} options 
   */
  async connect({uri='mongodb://127.0.0.1:27017/benchmarks', model='benchmarks', options={}}={}) {
    if (this[kConn]) throw new Error('cannot connect to the db twice');
    const debugUri = cleanUri(uri);
    // eslint-disable-next-line no-unused-vars
    const {sslCA, sslKey, sslCert, ...debugOptions} = options;
    if (!debug) debug = Debug('benchmarker:publisher:mongodb');
    debug('createConnection: %s %j', debugUri, debugOptions);
    this[kConn] = true; //lock
    try {
      // eslint-disable-next-line require-atomic-updates
      this[kConn] = await mongoose.createConnection(uri, options);
      const modelName = process.env['BENCHMARKER_MONGODB_MODEL'] || model;
      this[kModel] = this[kConn].model(modelName, benchmarks_schema);
      return true;
    } catch (ex) {
      await this.close();
      throw ex;
    }
  }

  /**
   * close connection
   */
  async close() {
    const conn = this[kConn];
    this[kConn] = void 0;
    this[kModel] = void 0;
    if (conn && typeof conn === 'object') {
      await conn.close();
    }
  }

  /**
   * Publish to mongo db
   * @param {Object} context 
   * @param {Object} benchmark 
   * @param {Object|String} result 
   */
  async publish(context, benchmark, result) {
    assert(this[kModel], `can't call publish on a closed connection`);
    const _id = benchmark.id;
    const data = { _id , ...benchmark, ...result };
    delete data.id;
    await this[kModel].updateOne({ _id }, data, { upsert: true });
  }
}

module.exports = MongoDBPublisher;
