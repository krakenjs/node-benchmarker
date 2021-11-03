'use strict';
const assert = require('assert');
const path = require('path');
const shush = require('shush');
const shortstop = require('shortstop');
const confit = require('confit');
const Protocols = require('./utils/protocols');
const { getRootDir, Debug } = require('./utils');

let config;

/**
 * Loads and returns configuration 
 * @returns {Promise} resolves to config object
 */
function loadConfig(cfgPath) {
  return new Promise((resolve, reject) => {
    const rootDir = getRootDir();
    const basedir = cfgPath || path.join(rootDir, 'config');
    const protocols = Protocols(rootDir);
    confit({protocols, basedir}).create(function (err, conf) {
      if (err) {
        return void reject(err);
      }
      const cfg = conf.get('benchmarker')||{};
      const debug = Debug('benchmarker:config');
      const env = conf.get('env:env');
      debug(`ENVIRONMENT: ${env}`, cfg);
      cfg.env = env;
      resolve(cfg);
    });
  });
}

/**
 * Set config. Accepts file name/path or json
 * @param {String/Object} file_or_json
 * @returns {Promise}
 */
module.exports.set = async function setConfig(file_or_json) {
  assert(file_or_json, 'config file or config json is required');
  const json  = typeof file_or_json === 'string' && shush(file_or_json) || file_or_json;
  const shorty = shortstop.create();
  const protocols = Protocols(getRootDir());
  for (const [protocol, impls] of Object.entries(protocols)) {
    if (Array.isArray(impls)) {
      for (const impl of impls) {
        shorty.use(protocol, impl);
      }
    } else {
      shorty.use(protocol, impls);
    }
  }
  return config = new Promise((resolve, reject) => {
    shorty.resolve(json, function (err, cfg) {
      if (err) {
        config == void 0;
        return void reject(err);
      }
      config = cfg && cfg.benchmarker || cfg;
      resolve(config);
    });
  });
};

/**
 * get config
 * @returns {Promise/Object}
 */
module.exports.get = async function getConfig() {
  if (!config) {
    config = loadConfig();
    try {
      // eslint-disable-next-line require-atomic-updates
      config = await config;
    } catch (ex) {
      // eslint-disable-next-line require-atomic-updates
      config = void 0;
      throw ex;
    }
  } else if (config instanceof Promise) {
    // concurrent call
    return await config;
  }
  return config;
};

/**
 * Should be used for Unit Tests only!
 */
module.exports._clear = function clearConfig() {
  config = void 0;
  return module.exports;
};

/**
 * Should be used for Unit Tests only!
 */
module.exports._loadConfig = loadConfig;
