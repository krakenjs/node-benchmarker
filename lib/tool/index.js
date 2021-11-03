'use strict';

const kName = Symbol('name');
const kExtName = Symbol('extname');
const kBaseUrl = Symbol('baseUrl');
const kEnv = Symbol('env');

class Tool {
  /**
   * Constructor
   * @param {String} name
   * @param {String} extname: script extension default: .json
   */
  constructor(name='slacker', { extname='.json', baseUrl, env } = {}) {
    this[kName] = name;
    this[kBaseUrl] = process.env.BASE_URL || baseUrl;
    this[kEnv] = process.env.NODE_ENV || env;
    this[kExtName] = extname;
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
   * Base Url / Target. Value of BASE_URL environment variable
   */
  get baseUrl() {
    return this[kBaseUrl];
  }

  /**
   * env determined from NODE_ENV
   */
  get env() {
    return this[kEnv];
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
