/**
 * @author IITII
 * @date 2020/9/23 12:41
 */
'use strict';
const
  config = require('../config.js'),
  path = require('path'),
  redis = require('redis'),
  client = redis.createClient(config.redis.connect),
  {logger} = require('./logger.js');

client.on("error", error => {
  logger.error(`Redis's error: ${error}`);
});
client.on('connect', () => {
  logger.info(`Redis is connected.`);
});
client.on('ready', () => {
  logger.info(`Redis is ready.`);
});
client.on("warning", warning => {
  logger.info(`Redis's warning: ${warning}`);
});
client.on('end', () => {
  logger.info(`Redis is connected.`);
});

/**
 * Remove duplicate url which was downloaded in the past
 * @param {Array} array origin array
 * @return {Array} removed array
 */
async function unique(array) {
  return await new Promise(async (resolve, reject) => {
    let tmp = [];
    for (let i = 0; i < array.length; i++) {
      let ele = array[i];
      // ┌─────────────────────┬────────────┐
      // │          dir        │    base    │
      // ├──────┬              ├──────┬─────┤
      // │ root │              │ name │ ext │
      // "  /    home/user/dir / file  .txt "
      // └──────┴──────────────┴──────┴─────┘
      const key = path.parse(ele).name;
      await get(key)
        .then(value => {
          if (value === 0) {
            tmp.push(ele);
            logger.info(`Pushing new daily url: ${ele}...`);
          } else {
            logger.info(`Aborting duplicate daily url: ${ele}...`);
            logger.info(`Duplicate count: ${value + 1}`);
          }
        })
        .catch(e => {
          return reject(e);
        });
    }
    return resolve(tmp);
  });
}

/**
 * Put data to redis
 * @param {Array} array origin array
 * @param value {Number} defa
 * @return {Array} removed array
 */
async function setRedis(array, value = 1) {
  return await new Promise(async (resolve, reject) => {
    for (let i = 0; i < array.length; i++) {
      let url = array[i];
      const key = path.parse(url).name;
      await set(key, value)
        .then(value => {
          logger.debug(`Set key: ${key}, value: ${value}`);
        })
        .catch(e => reject(e));
    }
    return resolve();
  })
}

/**
 * Set value for special key
 * @param key pid, task "https://www.pixiv.net/artworks/84521887" for instance,
 * the key of this url is 84521887
 * @param value stepper
 * @return {Number} duplicate times
 */
async function set(key, value = 1) {
  return await new Promise((resolve, reject) => {
    client.get(key, (err, res) => {
      if (err) {
        return reject(err);
      }
      if (res !== null) {
        value += parseInt(res);
      }
      client.set(key, value, (err1, res1) => {
        if (err1) {
          return reject(value);
        }
        if (res1 === 'OK') {
          return resolve(value);
        } else {
          return reject(`Unknown response: ${res1}`);
        }
      });
    });
  })
}

/**
 * Get value for special key
 * @param key pid, task "https://www.pixiv.net/artworks/84521887" for instance,
 * the key of this url is 84521887
 * @return {Number} duplicate times
 */
async function get(key) {
  return await new Promise((resolve, reject) => {
    client.get(key, (err, res) => {
      if (err) {
        return reject(err);
      }
      if (res !== null) {
        return resolve(parseInt(res));
      } else {
        return resolve(0);
      }
    });
  });
}

function quitRedis() {
  client.quit();
}

module.exports = {
  unique,
  setRedis,
  quitRedis,
}