'use strict';

const settings = Object.create(null);

module.exports.set = function setSetting(key, value) {
  settings[key] = value;
};

module.exports.get = function getSetting(key) {
  return settings[key];
};
