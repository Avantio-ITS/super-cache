'use strict';

/**
 * Module dependencies
 */
var redis = require('redis')
  , url = require('url');

exports = module.exports = function (opts) {
  if (opts.redisURL) {
    var redisURL = url.parse(opts.redisURL);
    /*jshint camelcase: false */
    var client = redis.createClient(redisURL.port, redisURL.hostname, {no_ready_check: true});
    client.auth(redisURL.auth.split(':')[1]); //does not support db indexes
    return client;
  }
  return redis.createClient();
};

