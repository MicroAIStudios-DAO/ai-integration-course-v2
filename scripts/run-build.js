#!/usr/bin/env node

/**
 * Custom wrapper around CRA build to disable the ForkTsCheckerWebpackPlugin
 * when running in CI. This avoids out-of-memory failures caused by the
 * type-checker while keeping the standard build flow locally.
 */

const Module = require('module');

const OPENSSL_FLAG = '--openssl-legacy-provider';

// Ensure the OpenSSL legacy provider flag is preserved to match package.json.
if (!process.env.NODE_OPTIONS || !process.env.NODE_OPTIONS.includes(OPENSSL_FLAG)) {
  process.env.NODE_OPTIONS = [process.env.NODE_OPTIONS, OPENSSL_FLAG]
    .filter(Boolean)
    .join(' ');
}

// Only strip the type-checking plugin in CI environments.
if (process.env.CI === 'true') {
  const originalRequire = Module.prototype.require;
  Module.prototype.require = function patchedRequire(request) {
    const result = originalRequire.apply(this, arguments);
    // react-scripts/scripts/build loads ../config/webpack.config
    if (
      request === '../config/webpack.config' ||
      request === './config/webpack.config' ||
      request === 'react-scripts/config/webpack.config'
    ) {
      return function patchedConfigFactory() {
        const config = result.apply(this, arguments);
        config.plugins = config.plugins.filter(
          (plugin) => plugin?.constructor?.name !== 'ForkTsCheckerWebpackPlugin'
        );
        return config;
      };
    }
    return result;
  };
}

require('react-scripts/scripts/build');
