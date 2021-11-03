'use strict';
const assert = require('assert');
const { withFile } = require('tmp-promise');
const { executeCommand, readFromFileFd, getTempDir } = require('../utils');
const Tool = require('./');

const kExecutable = 'artillery';

class Artillery extends Tool {
  constructor() {
    super(Artillery.name.toLowerCase(), { extname: '.yml' });
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
    args.unshift('run');
    args.push(script);

    const target = this.baseUrl;
    const env = this.env;

    const dir = await getTempDir();
    return withFile (async ({path, fd}) => {
      args.push('-o', path);
      if (env) args.push('-e', env);
      if (target) args.push('-t', target);

      context.logger.log('executing:', kExecutable, args.join(' '));
      const {returnCode, stdout, stderr} = await executeCommand(context, kExecutable, args);
      if (returnCode !== 0) {
        const emsg = `Command Execution Failed [${stdout}] [${stderr}]`;
        context.logger.error(emsg);
        throw new Error(emsg);
      }
      context.logger.log(`execution completed with return code: ${returnCode}`);
      let result = await readFromFileFd(fd);
      context.logger.log(JSON.stringify(result));
      try {
        result = JSON.parse(result);
      } catch (ex) {
        const emsg = `Error parsing artillery results: ${ex.stack}`;
        context.logger.error(emsg);
        throw new Error(emsg);
      }
      if (result && result.aggregate && result.aggregate.errors) {
        let errTxt = '';
        for (const [emsg, count] of Object.entries(result.aggregate.errors)) {
          errTxt += `${emsg}: ${count};`;
        }
        if (errTxt.length > 0) {
          const emsg = `Error during artillery run: [${errTxt}]`;
          context.logger.error(`${emsg}\nOUTPUT:\n${JSON.stringify(result)}`);
          throw new Error(emsg);
        }
      }
      return result;
    }, { dir });
  }

  /**
   * Normalize output.
   * @param {Object} context 
   * @param {Object|String} output 
   */
  async normalizeOutput(context, output) {
    context.logger.log('normalize output');
    const { 
      scenariosCreated: iterations,
      scenariosCompleted: completed,
      requestsCompleted: requests,
      latency,
      rps,
      scenarioDuration: durations,
      codes,
      timestamp
    } = output && output.aggregate || {};

    return {
      iterations,
      completed,
      requests,
      latency,
      rps: rps && rps.mean,
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

module.exports = Artillery;
