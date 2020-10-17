/**
 * @author IITII
 * @date 2020/9/19 12:25
 */
'use strict';
const {logger} = require('./logger'),
  fs = require('fs'),
  path = require('path');

/**
 * sleep for a while
 * @param ms ms
 */
async function sleep(ms) {
  return await new Promise((resolve) => {
    setTimeout(() => {
      return resolve();
    }, ms)
  })
}

/**
 * Checks if value is null or undefined or ''.
 * @param object object
 * @return {boolean} true for nil or ""
 */
function isNil(object) {
  return (object == null) || (object === '');
}

/**
 * Calc how much time spent on run function.
 * @param func Run function
 * @param args function's args
 */
async function spendTime(func, ...args) {
  return await new Promise(async (resolve, reject) => {
    let start = new Date();
    try {
      await func.apply(this, args);
      return resolve();
    } catch (e) {
      logger.error(e);
      return reject(e);
    } finally {
      let cost = new Date() - start;
      let logInfo = cost > 1000 ? cost / 1000 + 's' : cost + 'ms';
      logger.info(`Total spent ${logInfo}.`);
    }
  });
}

/**
 *递归创建文件夹
 * @param dir 文件夹目录
 * @param cb callback
 */
function mkdir(dir, cb) {
  let paths = dir.split(path.sep);
  let index = 1;

  function next(index) {
    //递归结束判断
    if (index > paths.length)
      return cb();
    let newPath = paths.slice(0, index).join(path.sep);
    fs.access(newPath, function (err) {
      if (err) {//如果文件不存在，就创建这个文件
        fs.mkdir(newPath, function () {
          next(index + 1);
        });
      } else {
        //如果这个文件已经存在，就进入下一个循环
        next(index + 1);
      }
    })
  }

  next(index);
}

/**
 *同步递归创建文件夹
 * @param dir 文件夹目录
 */
function mkdirSync(dir) {
  let paths = dir.split(path.sep);
  let index = 1;

  function next(index) {
    //递归结束判断
    if (index > paths.length) {
      return;
    }
    let newPath = paths.slice(0, index).join(path.sep);
    fs.access(newPath, function (err) {
      //如果文件不存在，就创建这个文件
      if (err) {
        fs.mkdirSync(newPath);
      }
      //进入递归
      next(index + 1);
    })
  }

  next(index);
}

/**
 * only compress dir under given `dirname`
 * @param dirName compress dirname
 * @param zipFileName compressed filename
 * @see https://github.com/cthackers/adm-zip
 * @description docs is out-of-date
 * Unsupported chinese folder name
 */
async function zipDir(dirName, zipFileName) {
  return await new Promise(async (resolve, reject) => {
    try {
      const adm_zip = require("adm-zip"),
        zip = new adm_zip();
      await zip.addLocalFolder(dirName);
      zip.writeZip(zipFileName, (err) => {
        if (err) {
          logger.error(`Compress to ${zipFileName} failed...`);
          return;
        }
        logger.info(`Compress to ${zipFileName} success.`)
      });
      return resolve();
    } catch (e) {
      return reject(e);
    }
  })
}

/**
 * Get a random milliseconds from low to high
 * @param low start (unit: minute)
 * @param high end (unit: minute)
 * @return {number} return a random milliseconds from low to high(unit: milliseconds)
 * return 0 if high is lesser than low
 */
function getRandomMin(low, high) {
  if (high <= low) {
    return 0;
  }
  return Math.floor(1000 * 60 * (Math.random() * high + low));
}

/**
 * Get a random milliseconds from low to high
 * @param low start (unit: second)
 * @param high end (unit: second)
 * @return {number} return a random milliseconds from low to high(unit: milliseconds)
 * return 0 if high is lesser than low
 */
function getRandomSec(low, high) {
  if (high <= low) {
    return 0;
  }
  return Math.floor(1000 * (Math.random() * high + low));
}

module.exports = {
  sleep,
  isNil,
  spendTime,
  mkdir,
  zipDir,
  getRandomMin,
  getRandomSec,
  mkdirSync,
}