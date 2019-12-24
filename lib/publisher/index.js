'use strict';

class Publisher {

  /**
   * Place holder for connect
   */
  async connect() { }

  /**
   * Placeholder for closing the connection
   */
  async close() { }

  /**
   * Default publisher
   * @param {Object} context 
   * @param {Object} benchmark 
   * @param {Object|String} result 
   */
  async publish(context, benchmark, result) {
    context.logger.log(benchmark, result);
  }
}

module.exports = Publisher;
