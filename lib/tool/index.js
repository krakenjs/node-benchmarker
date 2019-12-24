'use strict';

const kName = Symbol('name');
const kExtName = Symbol('extname');

class Tool {
  /**
   * Constructor
   * @param {String} name
   * @param {String} extname: script extension default: .json
   */
  constructor(name='slacker', { extname='.json'} = {}) {
    this[kName] = name;
    return this[kExtName] = extname;
  }

  /**
   * Accessor for name
   */
  get name() {
    return this[kName];
  }

  /**
   * Extension of script files. Default: .json
   */
  get extname() {
    return this[kExtName];
  }

  /**
   * This executes the tool with passed arguments.
   * @param {Object} context 
   * @param {String} script 
   * @param {Array?} args 
   * @param {Object?} options
   */
  async execute(context, script, args, options) {
    context.logger.log('execute', script, args, options);
  }

  /**
   * Normalize output.
   * @param {Object} context 
   * @param {Object|String} output 
   */
  async normalizeOutput(context, output) {
    context.logger.log('normalize output');
    return output;
  }
}

module.exports = Tool;
