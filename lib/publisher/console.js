'use strict';
const Publisher = require('./');

const isObject = (o) => {
  return o && typeof o === 'object' &&
     (Object.getPrototypeOf(o) === null || Object.getPrototypeOf(o) === Object.prototype);
};
function log(val, indent='') {
  if (!isObject(val) && !Array.isArray(val)) {
    console.log(`${indent}\x1b[32m%o`, val);
    return;
  }
  for (const [key, value] of Object.entries(val)) {
    if (isObject(value) || Array.isArray(val)) {
      console.log(`${indent}\x1b[34m%s:`, key);
      log(value, indent+'\t');
    } else {
      if (value && value instanceof Date) {
        console.log(`${indent}\x1b[34m%s: \x1b[32m%o`, key, value.toISOString());
      } else {
        console.log(`${indent}\x1b[34m%s: \x1b[32m%o`, key, typeof value !== 'undefined'?value:'');
      }
    }
  }
}

class ConsolePublisher extends Publisher {
  /**
   * Default publisher
   * @param {Object} context 
   * @param {Object} benchmark 
   * @param {Object|String} result 
   */
  async publish(context, benchmark, result) {
    log({ ...benchmark, ...result });
  }
}
module.exports = ConsolePublisher;
