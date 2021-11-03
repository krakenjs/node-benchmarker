'use strict';
const path = require('path');
const fs = require('fs');
const child_process = require('child_process');
const glob = require('glob');
const settings = require('./settings');
const { promises: fsPromises } = fs;

const { spawn } = child_process;

// Sync call. This is to make sure that the installed executable node_modules are in path
// Explore `cross-spawn` if `child_process`.spawn or exec cause heartburn on windows.
require('npm-path')();

const baseDir = process.env.WORKSPACE || process.cwd();
const packageMeta = (function packageMetaReader() {
  let meta = null;
  const readMeta = () => {
    const pkgPath = path.join(baseDir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const { name, version } = require(pkgPath);
        return { 
          name: name.replace(/^@\w+\//,''), //remove scope
          version
        };
      } catch(ex) {
        console.log(`Error loading pkgPath`, ex);
      }
    }
    return {};
  };
  const getProperty = (name) => {
    if (!meta) {
      meta = readMeta();
    }
    return meta[name];
  };
  return {
    get name() { return getProperty('name'); },
    get version() { return getProperty('version'); }
  };
})();

/**
 * Lazy initialize debug module to enable debugging via cli option
 */
module.exports.Debug = (function () {
  let debug;
  return function Debug(name) {
    // lazy initialize debug module
    if (!debug) debug = require('debug');
    return debug(name);
  };
})();

/**
 * Get name for the run
 */
module.exports.getName = function getName() {
  if (!settings.get('name')) {
    settings.set('name', packageMeta.name||'benchmark');
  }
  return settings.get('name');
};

/**
 * Get tag for the run
 */
module.exports.getTag = function getTag() {
  if (!settings.get('tag')) {
    settings.set('tag', packageMeta.version||new Date().toJSON().replace(/[-T:.Z]/g,''));
  }
  return settings.get('tag');
};

/**
 * Returns root directory
 * @returns {String}
 */
module.exports.getRootDir = function getRootDir() {
  return baseDir;
};

/**
 * Get scripts to execute
 * @param {String} path: glob pattern
 */
module.exports.getScripts = function getScripts(path) {
  return glob.sync(path, {cwd: baseDir, nodir: true, absolute: true});
};

/**
 * execute command
 * @param {Object} context 
 * @param {*} args: Arguments for spawn 
 * @returns {Promise}
 */
module.exports.executeCommand = function executeCommand(context, ...args /*command, args, options*/) {
  return new Promise((resolve, reject) => {
    const proc = spawn.apply(child_process, args);
    let last_stdout = '', last_stderr = '';
    proc.stdout.on('data', (data) => {
      last_stdout = data;
      context.logger.log(`stdout: ${data}`);
    });
    
    proc.stderr.on('data', (data) => {
      last_stderr = data;
      context.logger.error(`stdout: ${data}`);
    });

    proc.on('close', (returnCode) => {
      resolve({returnCode, stdout: last_stdout, stderr: last_stderr});
    });
    proc.on('error', reject);
  });
};

/**
 * Reads content from file fd
 * @param {Number} fd
 */
module.exports.readFromFileFd = function readFromFileFd(fd) {
  const stream = fs.createReadStream(null, {fd, start: 0});
  return new Promise((resolve, reject) => {
    let data;
    stream.on('error', reject);
    stream.on('data', (chunk) => {
      data = data && Buffer.concat([data, chunk]) || chunk;
    });
    stream.on('end', () => {
      resolve(data && data.toString());
    });
  });
};

/**
 * Get temporary directory 
 * @returns {String}
 */
module.exports.getTempDir = (function () {
  const kTempDir = process.env['BENCHMARKER_TMPDIR'] || path.join(baseDir, '.tmp');
  let created = false;
  return async function getTempDir() {
    if (!created) {
      await fsPromises.mkdir(kTempDir, {recursive: true});
      created = true;
    }
    return kTempDir;
  };
})();
