'use strict';

/**
 * Module dependencies
 */
var crypto = require('crypto');

/**
 * Cache prototype
 *
 * {
 *  defaultHost: 'localhost:3000',
 *  cacheClient: 'redis',
 *  redisURL: 'redis://:@redis:6379',
 *  cacheDuration: 5 * 60 * 1000 // 5 minutos de cache
 * }
 */
function Cache(options) {
  this.options = options || {};

  this.initClient();
}

/**
 * Initialize cache client
 */
Cache.prototype.initClient = function() {
  var cacheClient = require('./' + this.options.cacheClient);
  this.cacheClient = cacheClient(this.options);
  if (this.options.cacheClient === 'redis') {
    var that = this;
    this.cacheClient.on('error', function(err) {
      console.log(err);
      that.cacheClient.end();
      that.cacheClient = require('./cache-clients/disk')(that.options);
    });
  }
};

/**
 * Get hashed path string
 */
Cache.prototype.hashPath = function(path) {
  return crypto.createHash('md5').update(path).digest('hex');
};

/**
 * Check cached page validity
 */
Cache.prototype.isCachedPageValid = function(cachedPage) {
  return (Date.now() - cachedPage.created) < this.options.cacheDuration;
};

/**
 * Get page from cache
 */
Cache.prototype.get = function(path, callback) {
  // Setting up 'this'
  var _this = this;

  // Create an hash string of path
  var hashedPath = this.hashPath(path);

  // Call cache client to get cached page
  this.cacheClient.get(hashedPath, function(err, cachedPage) {
    if (err) {
      callback(err);
    } else {
      var cachedObject = JSON.parse(cachedPage);

      //If cached page is not valid
      if (cachedPage && _this.isCachedPageValid(cachedObject)) {
        callback(err, cachedObject);
      } else {
        // If cached page is not valid than clear it from cache
        _this.clear(path);

        // And call the callback
        callback(new Error('Cached version is invalid'));
      }
    }
  });
};

/**
 * Save page to cache
 */
Cache.prototype.set = function(path, content, callback) {
  // Init set local variables
  var hashedPath = this.hashPath(path);
  var cachedPage = {
    path: path,
    content: content,
    created: Date.now()
  };

  var stringified = JSON.stringify(cachedPage);

  // Call cache client to set cached page
  this.cacheClient.set(hashedPath, stringified, callback);
};

/**
 * Clear page from cache
 */
Cache.prototype.clear = function(path, callback) {
  // Create an hash string of path
  var hashedPath = this.hashPath(path);

  // Call cache client to clear cached page
  this.cacheClient.del(hashedPath, callback);
};

exports = module.exports = Cache;
