/**
 * @author IITII
 * @date 2020/9/19 12:25
 */
'use strict';
const dayjs = require('dayjs');
const format = 'YYYY-MM-DD HH:mm:ss.SSS';
/**
 * logger
 */
const logger = {
  info: function (msg) {
    console.info(`[${dayjs().format(format)}] ${msg}`);
  },
  debug: function (msg) {
    console.debug(`[${dayjs().format(format)}] ${msg}`);
  },
  warn: function (msg) {
    console.warn(`[${dayjs().format(format)}] ${msg}`);
  },
  error: function (msg) {
    console.error(`[${dayjs().format(format)}] ${msg}`);
  }
}

module.exports = {
  logger
}