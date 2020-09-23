'use strict';
const path = require('path'),
  fs = require('fs'),
  dayjs = require('dayjs'),
  {isNil, mkdir} = require('./libs/utils')

let config = {
  pixiv: {
    username: '' || process.env.PIXIV_USERNAME,
    password: '' || process.env.PIXIV_PASSWORD,
    proxy: '' || process.env.HTTP_PROXY
  },
  webdriver: {
    args: [
      "--start-maximized",
      "--disable-notifications",
      "--disable-infobars",
      "--headless",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu"
    ]
  },
  save: {
    // if enabled, we will add download task to aria2 via rpc
    // after zipped all images of a day
    aria2Enable: false,
    aria2: {
      href: "https://github.com/",
      "rpc": {
        "host": "localhost",
        "port": 6800,
        "secure": false,
        "secret": "1",
        "path": "/jsonrpc"
      },
      "config": {
        "pause-metadata": "true",
        "dir": null,
      }
    },
    // download image concurrency limit
    limit: 10,
    // Download proxy, for example: http://localhost:1080
    proxy: '' || process.env.HTTP_PROXY,
    // download dir, for example: ./tmp
    dir: path.resolve(__dirname, './tmp')
  },
  redis: {
    enable: true,
    connect: {
      // See: https://github.com/NodeRedis/node-redis#options-object-properties
      "port": 6379,
      "host": "127.0.0.1",
      "tls": null
    }
  },
  // sub-proxy will replace parent proxy
  proxy: '',
  user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Safari/537.36',
  baseUrl: "" || process.env.HWC_BASEURL,
  timeFormat: {
    date: 'YYYY-MM-DD',
  },
}
// 请勿修改，基于 config.save.dir 和当前时间生成
config.save['currentImgSaveDir'] = config.save.dir + path.sep + dayjs().format('YYYY-MM-DD');

// config check

// pixiv
if (isNil(config.pixiv.username) || isNil(config.pixiv.password)) {
  console.error('Empty PIXIV_USERNAME or PIXIV_PASSWORD!!!');
  process.exit(1);
}
// dir
if (fs.existsSync(config.save.currentImgSaveDir)) {
  if (fs.statSync(config.save.currentImgSaveDir).isDirectory()) {
    let files = fs.readdirSync(config.save.currentImgSaveDir);
    if (files.length > 0) {
      console.error(`Exist!!! Dir ${config.save.currentImgSaveDir} is exist and not empty...`);
      process.exit(1);
    }
  } else {
    console.error(`Error!!! A file named ${config.save.currentImgSaveDir}!!!`);
    process.exit(1);
  }
} else {
  try {
    mkdir(config.save.currentImgSaveDir, () => {
      console.info(`Create un-exist path: ${config.save.currentImgSaveDir}`);
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

// limit
if (config.save.limit < 0) {
  config.save.limit = 10;
}
// baseUrl
if (!config.baseUrl.match('/$')) {
  config.baseUrl += '/';
}

module.exports = config;