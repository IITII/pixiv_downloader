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
  {aria2} = require('./libs/user_task');

// Main task
(async () => {
  const daily = await getDaily();
  await saveImg(daily)
    .then(async res => {
      // cdn refresh task and preheating task
      await cdn_task(res);
    })
    .catch(e => {
      logger.error(e);
    })
})()
  .then(() => {
    // Run another task
    aria2();
  })
  .catch(e => {
    logger.error(e);
  })