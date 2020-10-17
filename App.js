/**
 * @author IITII
 * @date 2020/9/19 17:37
 */
'use strict';
const
  {logger} = require('./libs/logger.js'),
  {getDaily} = require('./libs/get_daily'),
  {saveImg} = require('./libs/download'),
  {cdn_task} = require('./libs/cdn'),
  {sleep, getRandomMin} = require('./libs/utils'),
  {aria2} = require('./libs/user_task');

// Main task
(async () => {
  const mill = getRandomMin(1, 120);
  // 随机休眠 1-120 分钟
  logger.info(`The spider will be very slow and unstable due to the anti-spider...`);
  logger.info(`I want the spider do as a real human...`);
  logger.info(`I will wait randomly from 1 minute to 120 minute as default...`);
  logger.info(`Just wait for ${(mill / 1000 / 60).toFixed(1)} minutes...`);

  await sleep(mill);
  const daily = await getDaily();
  await saveImg(daily)
    .then(async res => {
      // cdn refresh task and preheating task
      if (Array.isArray(res) && res.length === 0) {
        return [];
      }
      await cdn_task(res);
    })
})()
  .then(() => {
    // Run another task
    aria2();
  })
  .catch(e => {
    logger.error(e);
  })