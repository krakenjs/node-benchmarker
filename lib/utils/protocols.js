'use strict';
const Handlers = require('shortstop-handlers');

const protocols = (basedir, overrides) => {
  return {
    file:    Handlers.file(basedir),
    path:    Handlers.path(basedir),
    base64:  Handlers.base64(),
    env:     Handlers.env(),
    require: Handlers.require(basedir),
    exec:    Handlers.exec(basedir),
    glob:    Handlers.glob(basedir),
    ...overrides
  };
};

module.exports = protocols;
