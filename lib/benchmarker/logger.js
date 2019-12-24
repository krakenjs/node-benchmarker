'use strict';
const { Debug } = require('../utils');

const kLogger = Symbol('logger');

class Logger {
  constructor(name) {
    this[kLogger] = Debug(name);
  }

  /**
   * debug log
   * @param  {...any} args 
   */
  log(...args) {
    // console.log.apply(console, args);
    return this[kLogger].apply(this[kLogger], args);
  }

  /**
   * log error
   * @param  {...any} args 
   */
  error(...args) {
    console.error.apply(console, args);
    return this[kLogger].apply(this[kLogger], args);
  }
}

module.exports = Logger;
