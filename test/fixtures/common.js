'use strict';

const setBaseUrl = (() => {
  const orgBaseUrl = process.env.BASE_URL;
  return function setBaseUrl(baseUrl) {
    if (!baseUrl) delete process.env.BASE_URL;
    else process.env.BASE_URL = baseUrl;
    return () => {
      if (orgBaseUrl !== undefined)
        process.env.BASE_URL = orgBaseUrl;
    };
  };
})();

module.exports = {
  setBaseUrl
};
