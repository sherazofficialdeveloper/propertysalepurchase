/**
 * Runtime frontend configuration.
 * Deployments may replace API_BASE_URL without changing api.js.
 */
(function (global) {
  'use strict';

  global.APP_CONFIG = global.APP_CONFIG || {
    API_BASE_URL: '',
  };
})(window);
