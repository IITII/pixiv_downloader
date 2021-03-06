/**
 * @author IITII
 * @date 2020/9/19 12:34
 */
'use strict';
const config = require('../config'),
  fetch = require('node-fetch'),
  cheerio = require('cheerio'),
  _ = require('lodash'),
  fs = require('fs'),
  path = require('path'),
  {logger} = require("./logger"),
  webdriver = require('selenium-webdriver'),
  By = webdriver.By,
  BROWSER = 'chrome',
  chrome = require(`selenium-webdriver/${BROWSER}`),
  until = webdriver.until,
  utils = require('./utils'),
  HttpsProxyAgent = require('https-proxy-agent'),
  PIXIV_USERNAME = config.pixiv.username,
  redis_api = require('./redis_api.js'),
  PIXIV_PASSWORD = config.pixiv.password;

let User_Agent = config.user_agent;

/**
 * return dom base on url
 * @param url Telegraph URL
 * @param proxy http proxy
 * @return {Promise<*>} cheerio
 */
async function getDom(url, proxy) {
  let data = await (utils.isNil(proxy)
    ? fetch(url)
    : fetch(url, {
      agent: new HttpsProxyAgent(proxy)
    }));
  let text = await data.text();
  return await cheerio.load(text);
}

/**
 * Login to pixiv
 * @param driver selenium driver
 * @param username pixiv username
 * @param password pixiv password
 */
async function login(driver, username, password) {
  await driver.get('https://accounts.pixiv.net/login');
  await utils.sleep(utils.getRandomSec(3, 10));
  await driver.wait(until.elementsLocated(By.id('LoginComponent')), 60000);
  let js = await fs.readFileSync(path.resolve(__dirname, '../dom/login.js'), {
    encoding: 'utf-8'
  });
  js = js.replace('username', username)
    .replace('password', password);
  await driver.executeScript(`${js}`);
  await utils.sleep(utils.getRandomSec(3, 10));
}

/**
 * Get Daily Rank Url
 * @param limit limit array size max: 50, default: 50
 * @return Array A array for Daily Rank Url with limit
 */
async function getDailyRankUrl(limit = 50) {
  return await new Promise(async (resolve, reject) => {
      try {
        if (limit <= 0 || limit > 50) {
          return reject('Limit should greater than 0 and less than 50');
        }
        const DAILY_RANKING_URL = 'https://www.pixiv.net/ranking.php?mode=daily&content=illust';
        let illustrationArray = [];
        let $ = await getDom(DAILY_RANKING_URL, config.pixiv.proxy || config.proxy || process.env.HTTP_PROXY || null);
        await $('.work').each((index, item) => {
          // MAX ARRAY SIZE: 50
          if (index < limit) {
            illustrationArray.push(new URL(DAILY_RANKING_URL).origin + item.attribs.href);
          }
        })
        return resolve(illustrationArray);
      } catch (e) {
        return reject(e);
      }
    }
  )
}

/**
 * Get img origin url
 * @param driver selenium driver
 * @param imgUrl {URL}
 * @param js {String}
 * @return Array {Array} array length maybe greater than 1
 */
async function getRealImgUrl(driver, imgUrl, js) {
  return await new Promise(async resolve => {
    await driver.get(imgUrl);
    await driver.wait(until.elementLocated(By.css('div[role="presentation"] > a')), 600000);
    await utils.sleep(utils.getRandomSec(3, 10));
    await driver.findElement(By.css('div[role="presentation"] > a')).click();
    await utils.sleep(utils.getRandomSec(3, 10));
    let array = await driver.executeScript(`return ${js}`);
    await utils.sleep(utils.getRandomSec(3, 10));
    return resolve(array);
  });
}

async function getDaily() {
  return await new Promise(async (resolve, reject) => {
    if (utils.isNil(PIXIV_USERNAME) || utils.isNil(PIXIV_PASSWORD)) {
      return reject('Empty PIXIV_USERNAME or PIXIV_PASSWORD!!!');
    }
    try {
      const driver = new webdriver.Builder()
        .forBrowser(BROWSER)
        .setChromeOptions(new chrome.Options().addArguments(config.webdriver.args))
        .build();
      let rankUrls = await getDailyRankUrl();
      // Remove duplicate
      rankUrls = _.uniq(rankUrls);
      // We need remove duplicate before download new images.
      // Maybe this url had already downloaded at past.
      if (config.redis.enable) {
        rankUrls = await redis_api.unique(rankUrls);
      }
      if (rankUrls.length === 0) {
        return resolve([]);
      }
      await login(driver, PIXIV_USERNAME, PIXIV_PASSWORD);
      // Update user_agent with live chrome user_agent
      User_Agent = await driver.executeScript(`return navigator.userAgent`)
        || User_Agent;
      let js = await fs.readFileSync(path.resolve(__dirname, '../dom/img.js'), {
        encoding: 'utf-8'
      });
      let data = [];
      for (const rankUrl of rankUrls) {
        let tmp = await getRealImgUrl(driver, rankUrl, js);
        tmp.forEach(e => {
          logger.info(`Got ${e} from ${rankUrl}`);
          data.push({
            url: e,
            origin: rankUrl,
            // Duplicate with a very low probability
            savePath: config.save.currentImgSaveDir + path.sep + path.basename(new URL(e).pathname)
          });
        });
      }
      // We need remove duplicate before download new images.
      // Maybe this url had already downloaded at past.
      if (config.redis.enable) {
        // Due to pixiv's anti-spider, we will add keys into redis after all options is success.
        await redis_api.setRedis(rankUrls);
        redis_api.quitRedis();
      }
      // async quit, just for reduce time
      driver.quit().then(() => {
        logger.info(`driver quit successfully!!!`);
      })
        .catch(e => {
          logger.error(`driver quit failed!!!`);
          logger.error(e);
        });
      return resolve(_.uniqBy(data, 'url'));
    } catch (e) {
      return reject(e);
    }
  });
}

module.exports = {
  getDaily
};