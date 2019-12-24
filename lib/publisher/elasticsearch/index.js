'use strict';
const assert = require('assert');

const Publisher = require('../');
const { Debug } = require('../../utils');

const { benchmarks: benchmarks_config } = require('./es.config');
const kIndexName = Symbol('index_name');
const kIndexType = Symbol('indexType'); // For 6.x or previous version
const kClient = Symbol('client');

// debug should be initiazed lazy
let debug;

function getIndexName(prefix, date) {
  // Creating index per week to make maintenance like purge easier?
  const today = date||new Date();
  const weekStart = new Date(today.setDate(today.getDate() - (today.getDay())));
  const weekStartStr = `${weekStart.getFullYear()}${(weekStart.getMonth()+1).toString().padStart(2, '0')}${weekStart.getDate().toString().padStart(2, '0')}`;
  return `${prefix}${weekStartStr}`;
}

class ElasticSearchPublisher extends Publisher {
  /**
   * Creates a client
   * @param {String} uri 
   * @param {String} indexName 
   * @param {String} indexNamePrefix
   * @param {Object} options 
   */
  async connect({ esVersion=7, indexName, indexNamePrefix='benchmarks', clientOptions={}, indexSettings={}}={}) {
    if (this[kClient]) throw new Error('cannot connect to the es instance twice');
    // debug should be initiazed lazy
    if (!debug) debug = Debug('benchmarker:publisher:elasticsearch');
    esVersion = Number(esVersion);
    debug('new client connection [%s]: [%j] [%j]', esVersion, clientOptions, indexSettings);
    const { Client } = require(`es${esVersion}`);
    //https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/7.x/client-configuration.html
    this[kClient] = new Client({node: 'http://localhost:9200', ...clientOptions});
    try {
      //TODO: Should we have an index per application?
      const index = this[kIndexName] =  process.env['BENCHMARKER_ES_INDEXNAME'] || indexName || getIndexName(indexNamePrefix);
      if (esVersion < 7) {
        this[kIndexType] = '_doc';
      }
      const existsResults = await this[kClient] .indices.exists({
        index
      });
      if (!existsResults || existsResults.body === false) {
        const body = { ...benchmarks_config };
        body.settings = { ...body.settings, ...indexSettings };

        if (this[kIndexType]) {
          body.mappings = { [this[kIndexType]]: body.mappings };
        }
        await this[kClient].indices.create({
          index,
          body
        });
      }
      return true;
    } catch (ex) {
      await this.close();
      throw ex;
    }
  }

  /**
   * closes client
   */
  async close() {
    const client = this[kClient];
    this[kClient] = void 0;
    if (client && typeof client === 'object') {
      await client.close();
    }
  }

  /**
   * Publish to elasticsearch
   * @param {Object} context 
   * @param {Object} benchmark 
   * @param {Object|String} result 
   */
  async publish(context, benchmark, result) {
    assert(this[kClient], `can't call publish on a closed client`);
    const id = benchmark.id;
    const index = this[kIndexName];
    const body = { ...benchmark, ...result };
    delete body.id;
    await this[kClient].index({ 
      id,
      index,
      type: this[kIndexType],
      body,
      refresh: 'true'
    });
  }
}

module.exports = ElasticSearchPublisher;
