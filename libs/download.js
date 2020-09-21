/**
 * @author IITII
 * @date 2020/9/19 13:06
 */
'use strict';
const config = require('../config'),
  fetch = require('node-fetch'),
  fs = require('fs'),
  path = require('path'),
  util = require('util'),
  streamPipeline = util.promisify(require('stream').pipeline),
  async = require('async'),
  dayjs = require('dayjs'),
  // 引入 events 模块
  events = require('events'),
  // 创建 eventEmitter 对象
  eventEmitter = new events.EventEmitter(),
  {isNil, mkdir, spendTime, zipDir} = require('./utils'),
  {logger} = require('./logger'),
  HttpsProxyAgent = require('https-proxy-agent'),
  httpProxy = config.save.proxy || config.proxy || process.env.HTTP_PROXY || null;

let User_Agent = config.user_agent;

async function fetchImg(url,
                        proxy = null,
                        referer = null,
                        user_agent = null) {
  return await new Promise(async (resolve, reject) => {
    try {
      if (isNil(proxy)) {
        let data = await fetch(url, {
          headers: {
            "Referer": referer,
            "User-Agent": user_agent || User_Agent
          },
          compress: true
        });
        if (data.ok) {
          return resolve(data);
        } else {
          return reject(data);
        }
      } else {
        let data = await fetch(url, {
          agent: new HttpsProxyAgent(proxy),
          headers: {
            "Referer": referer,
            "User-Agent": user_agent || User_Agent
          },
          compress: true
        });
        if (data.ok) {
          return resolve(data);
        } else {
          return reject(data);
        }
      }
    } catch (e) {
      return reject(e);
    }
  })
}

async function downImg(imgSrc, callback) {
  logger.info(`Downloading ${imgSrc.url}...`);
  // Add await for callback
  await spendTime(async () => {
    let data = await fetchImg(imgSrc.url, httpProxy, imgSrc.origin, User_Agent);
    if (data.ok) {
      await streamPipeline(data.body, fs.createWriteStream(imgSrc.savePath));
    }
  })
    .then(() => {
      logger.info(`Save to ${imgSrc.savePath}`);
    })
    .catch(e => {
      eventEmitter.emit('Download_Err', imgSrc);
      logger.error(`Download error!!!`);
      logger.error(e);
    })
    .finally(callback);
}

async function saveImg(data,
                       IMG_TMP_DIR = config.save.currentImgSaveDir,
                       useragent = config.user_agent) {
  return await new Promise((resolve, reject) => {
    User_Agent = useragent;
    let map = (() => {
      let tmpMap = new Map();
      data.forEach(e => {
        tmpMap.set(e.url, e);
      });
      return tmpMap;
    })();
    // listen on Download_Err
    eventEmitter.on('Download_Err', (imgSrc) => {
      if (map.has(imgSrc.url)) {
        // Remove download err object
        if (map.delete(imgSrc.url)) {
          logger.info('Remove from cdn map successful');
        } else {
          logger.error(`Remove from cdn map successful failed`);
        }
      } else {
        logger.warn(`No such key ${imgSrc.url}`);
      }
    });
    let preHeatingArray, date = dayjs().format(config.timeFormat.date);
    mkdir(IMG_TMP_DIR, async () => {
      logger.info(`Create un-exist path: ${IMG_TMP_DIR}`);
      // LIMIT: Concurrency download limit
      await async.mapLimit(data, config.save.limit, async (link, callback) => {
        await downImg(link, callback);
      })
        .then(() => {
          logger.info(`Download completed!!! Downloaded to ${IMG_TMP_DIR}`);
          logger.debug(JSON.stringify(data));
          preHeatingArray = (() => {
            let tmp = [];
            map.forEach(e => {
              tmp.push(config.baseUrl
                + date
                + '/'
                + path.basename(new URL(e.url).pathname)
              )
            });
            return tmp;
          })();
        })
        .then(() => {
          logger.info(`Compressing files...`);
          let zipPath = path.resolve(IMG_TMP_DIR) + '.zip';
          zipDir(IMG_TMP_DIR, zipPath)
            .then(() => {
              logger.info(`Compress completed!!! Save to ${zipPath}`);
              preHeatingArray.push(config.baseUrl + date + '.zip')
            })
            .catch(e => {
              logger.error(`Compress failed!!!`);
              logger.error(e);
            })
        })
        .then(() => {
          return resolve({
            preHeatingArray,
            refreshFilesArray: [config.baseUrl]
          });
        })
        .catch(e => {
          logger.error(`Unknown error!!!`);
          return reject(e);
        })
    });
  });
}

module.exports = {saveImg};