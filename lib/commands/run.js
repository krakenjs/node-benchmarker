'use strict';
const { getScripts, Debug } = require('../utils');
const config = require('../config');
const Benchmarker = require('../benchmarker');

const description =
  `Run the scripts.
    "script_path" accepts *glob* pattern (https://en.wikipedia.org/wiki/Glob_(programming)). [Default: "./benchmarks/**/*[EXTNAME]"]
    ** [EXTNAME] is specific to the tool. ex: '.yml', '.json', '.js'
    ** [tool] and [publishers] for the run should be configured in the config file.`;

async function load() {
  const cfg = await config.get();
  // Lazy initialize debug module
  const { publishers:pub_cfg, tool:tool_cfg, env } = cfg;
  let tool, publishers, args, options;
  if (tool_cfg) {
    tool = new (require(tool_cfg.module.name))();
    args = tool_cfg.args;
    options = tool_cfg.options;
  } else {
    tool = new (require('../tool/artillery'))();
  }
  if (pub_cfg) {
    publishers = [];
    try {
      for (const pcfg of (Array.isArray(pub_cfg) && pub_cfg || [pub_cfg])) {
        const publisher = new (require(pcfg.module.name))();
        const cargs = Array.isArray(pcfg.connection) && pcfg.connection || [ pcfg.connection ];
        await publisher.connect(...cargs);
        publishers.push(publisher);
      }
    } catch(ex) {
      await Promise.all(publishers.map((p)=> p.close()));
      throw ex;
    }
  }
  return {publishers, tool, args, options, env};
}

/**
 * Run the benchmark
 * @param {String} script_path 
 */
async function run(script_path) {
  const debug = Debug('benchmarker:run');
  debug('Initiating run!');
  const {publishers, tool, args, options, env} = await load();
  const benchmarker = new Benchmarker({tool, publishers});
  if (!script_path) script_path = `./benchmarks/**/*${tool.extname}`;
  const scripts = getScripts(script_path);

  if (scripts.length === 0) {
    console.warn(`\x1b[33m **WARNING** \x1b[36m NO TARGET SCRIPT FOUND MATCHING "${script_path}". SKIPPING! \x1b[0m`);
  } else {
    debug(`Found ${scripts.length} to run!`);
  }

  try {
    for (const script of scripts) {
      await benchmarker.run(script, args, { env, ...options });
    }
  } finally {
    if (Array.isArray(publishers)) {
      await Promise.all(publishers.map((p)=> p.close()));
    }
  }
}

module.exports = run;
module.exports.args = '[script_path]';
module.exports.description = description;
