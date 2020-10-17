/**
 * @author IITII
 * @date 2020/9/19 12:25
 */
'use strict';
// const dayjs = require('dayjs');
const format = 'YYYY-MM-DD HH:mm:ss.SSS';
const opts = {
  // logger.error() will throw a error if you are using 'errorEventName'
  // errorEventName: 'error',
  dateFormat: 'YYYY.MM.DD',
  timestampFormat: format,
  level: process.env.LOG_LEVEL || 'debug',
  category: 'pixiv_downloader'
}
/**
 * logger
 */
const logger = require('simple-node-logger').createSimpleLogger(opts);

module.exports = {
  logger
}