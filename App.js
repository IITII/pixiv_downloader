'use strict';
const config = require('./config'),
  fetch = require('node-fetch'),
  cheerio = require('cheerio'),
  fs = require('fs'),
  path = require('path'),
  _ = require('lodash'),
  HttpsProxyAgent = require('https-proxy-agent'),
  webdriver = require('selenium-webdriver'),
  By = webdriver.By,
  BROWSER = 'chrome',
  chrome = require(`selenium-webdriver/${BROWSER}`),
  until = webdriver.until,
  util = require('util'),
  streamPipeline = util.promisify(require('stream').pipeline),
  async = require('async'),
  moment = require('moment'),
  // Some variable
  LIMIT = config.save.limit || 10,
  SAVE_DIR = config.save.dir || path.resolve(__dirname, './tmp'),
  PIXIV_USERNAME = config.pixiv.username,
  PIXIV_PASSWORD = config.pixiv.password;
let User_Agent = config.user_agent
  || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Safari/537.36';


/**
 * logger
 */
const logger = {
  info: function (msg) {
    console.info(`[${moment().format('YYYY-MM-DD HH:mm:ss.SSS')}] ${msg}`);
  },
  debug: function (msg) {
    console.debug(`[${moment().format('YYYY-MM-DD HH:mm:ss.SSS')}] ${msg}`);
  },
  warn: function (msg) {
    console.warn(`[${moment().format('YYYY-MM-DD HH:mm:ss.SSS')}] ${msg}`);
  },
  error: function (msg) {
    console.error(`[${moment().format('YYYY-MM-DD HH:mm:ss.SSS')}] ${msg}`);
  }
}

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
      return reject();
    } finally {
      let cost = new Date() - start;
      let logInfo = cost > 1000 ? cost / 1000 + 's' : cost + 'ms';
      logger.info(`Total spent ${logInfo}.`);
    }
  });
}

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
 * return dom base on url
 * @param url Telegraph URL
 * @param proxy http proxy
 * @return {Promise<*>} cheerio
 */
async function getDom(url, proxy) {
  let data = await (isNil(proxy)
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
  await driver.wait(until.elementsLocated(By.id('LoginComponent')), 60000);
  let js = await fs.readFileSync(path.resolve(__dirname, './dom/login.js'), {
    encoding: 'utf-8'
  });
  js = js.replace('username', username)
    .replace('password', password);
  await driver.executeScript(`${js}`);
  await sleep(2000);
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
    await driver.wait(until.elementLocated(By.css('div[role="presentation"] > a')), 600000)
    await driver.findElement(By.css('div[role="presentation"] > a')).click();
    await sleep(1000);
    let array = await driver.executeScript(`return ${js}`);
    return resolve(array);
  });
}

async function fetchImg(url, proxy = null, referer = null, user_agent = null) {
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
  await spendTime(async () => {
    let data = await fetchImg(imgSrc.url,
      config.save.proxy || config.proxy || process.env.HTTP_PROXY || null,
      imgSrc.origin,
      User_Agent
    );
    if (data.ok) {
      await streamPipeline(data.body, fs.createWriteStream(imgSrc.savePath));
    }
  })
    .then(() => {
      logger.info(`Save to ${imgSrc.savePath}`);
    })
    .catch(e => {
      logger.error(`Download error!!!`);
      logger.error(e);
    })
    .finally(callback);
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

async function saveImg(data, IMG_TMP_DIR, useragent) {
  User_Agent = useragent;
  mkdir(IMG_TMP_DIR, () => {
    logger.info(`Create un-exist path: ${IMG_TMP_DIR}`);
    // LIMIT: Concurrency download limit
    async.mapLimit(data, LIMIT, async (link, callback) => {
      await downImg(link, callback);
    })
      .then(() => {
        logger.info(`Download completed!!! Downloaded  to ${IMG_TMP_DIR}`);
      })
      .then(() => {
        logger.info(`Compressing files...`);
        let zipPath = path.resolve(IMG_TMP_DIR) + '.zip';
        zipDir(IMG_TMP_DIR, zipPath)
          .then(() => {
            logger.info(`Compress completed!!! Save to ${zipPath}`);
          })
          .catch(e => {
            logger.error(`Compress failed!!!`);
            logger.error(e);
          })
      })
      .catch(e => {
        logger.error(`Unknown error!!!`);
        logger.error(e);
      })
  });
}


async function main() {
  if (isNil(PIXIV_USERNAME) || isNil(PIXIV_PASSWORD)) {
    logger.error('Empty PIXIV_USERNAME or PIXIV_PASSWORD!!!');
    process.exit(1);
  }
  const date = moment().format('YYYY-MM-DD'),
    IMG_DOWNLOAD_DIR = SAVE_DIR + path.sep + date;
  if (fs.existsSync(IMG_DOWNLOAD_DIR)) {
    if (fs.statSync(IMG_DOWNLOAD_DIR).isDirectory()) {
      let files = fs.readdirSync(IMG_DOWNLOAD_DIR);
      if (files.length > 0) {
        logger.warn(`Exist!!! Dir ${IMG_DOWNLOAD_DIR} is exist and not empty...`);
        process.exit(1);
      }
    } else {
      logger.error(`Error!!! A file named ${IMG_DOWNLOAD_DIR}!!!`);
      process.exit(1);
    }
  } else {
    try {
      mkdir(IMG_DOWNLOAD_DIR, () => {
        logger.info(`Create un-exist path: ${IMG_DOWNLOAD_DIR}`);
      });
    } catch (e) {
      logger.error(e);
      process.exit(1);
    }
  }
  const driver = new webdriver.Builder()
    .forBrowser(BROWSER)
    .setChromeOptions(new chrome.Options()
      .addArguments(
        "--start-maximized",
        "--disable-notifications",
        "--disable-infobars",
        "--headless",
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu"
      )
    )
    .build();
  let rankUrls = await getDailyRankUrl();
  // Remove duplicate
  rankUrls = _.uniq(rankUrls);
  await login(driver, PIXIV_USERNAME, PIXIV_PASSWORD);
  User_Agent = await driver.executeScript(`return navigator.userAgent`)
    || User_Agent;
  let js = await fs.readFileSync(path.resolve(__dirname, './dom/img.js'), {
    encoding: 'utf-8'
  });
  let data = [], count = 0;
  for (const rankUrl of rankUrls) {
    let tmp = await getRealImgUrl(driver, rankUrl, js);
    tmp.forEach(e => {
      count++;
      data.push({
        url: e,
        origin: rankUrl,
        // Duplicate with a very low probability
        savePath: IMG_DOWNLOAD_DIR + path.sep + path.basename(new URL(e).pathname)
      });
    });
  }
  // async quit, just for reduce time
  driver.quit().then(() => {
    logger.info(`driver quit successfully!!!`);
  })
    .catch(e => {
      logger.error(`driver quit failed!!!`);
      logger.error(e);
    });
  data = _.uniqBy(data, 'url');
  saveImg(data, IMG_DOWNLOAD_DIR, User_Agent)
    .then(() => {
      if (isNil(process.env.HWC_ENABLE)) {
        return;
      }
      let baseUrl = process.env.HWC_BASEURL,
        {getToken, cdn_preheatingtasks, cdn_refreshtasks} = require('./libs/hwc_api');
      if (isNil(baseUrl)) {
        return;
      }
      if (!baseUrl.match('/$')) {
        baseUrl += '/';
      }
      let token = getToken();
      let preHeatingArray = (() => {
        let tmp = [];
        data.forEach(e => {
          tmp.push(baseUrl + date + '/' + path.basename(new URL(e.url).pathname))
        });
        return tmp;
      })()
      preHeatingArray.push(baseUrl + date + '.zip');
      let refreshFilesArray = [baseUrl];
      cdn_refreshtasks(refreshFilesArray, token.x_subject_token)
        .then(result => {
          logger.info(`cdn_refreshtasks submit successful`);
          logger.debug(JSON.stringify(result));
        })
        .then(() => {
          cdn_preheatingtasks(preHeatingArray, token.x_subject_token)
            .then(result => {
              logger.info(`cdn_preheatingtasks submit successful`);
              logger.debug(JSON.stringify(result));
            })
            .catch(e => {
              logger.error(e);
            })
        })
        .catch(e => {
          logger.error(e);
        })
    })
    .catch(e => {
      logger.error(e);
    })
}

main().then(() => {
  logger.info(`Success!!!`)
})
  .then(() => {
    //Aria2
    if (config.save.aria2Enable) {
      const Aria2 = require('aria2'),
        aria2 = new Aria2(config.save.aria2.rpc);
      logger.info('Connecting to Aria2...');
      aria2.open()
        .then(() => {
          aria2.call('getVersion')
            .then(version => {
              logger.info(`Aria2 connected successfully: version ${version.version}`);
            })
            .then(() => {
              let link = config.save.aria2.href + '/' + moment().format('YYYY-DD-MM');
              logger.info(`Downloading ${link}...`);
              aria2.call('addUri', [link], config.save.aria2.config)
                .then(gid => {
                  logger.info(`Download Task: ${link} add to ${config.save.aria2.rpc.host}!!!`);
                  logger.info(`Download Task Gid: ${gid}`);
                })
                .catch(e => {
                  logger.error(e);
                })
            })
            .catch(e => {
              logger.error(e);
              process.exit(1);
            })
        })
        .catch(e => {
          logger.error(e);
          process.exit(1)
        })
    }
  })