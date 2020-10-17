/**
 * @author IITII
 * @date 2020/9/21 9:13
 */
'use strict';
const config = require('../config'),
  {logger} = require('../libs/logger.js'),
  {isNil,} = require('../libs/utils'),
  date = require('dayjs')().format(config.timeFormat.date);
const hwc_api = require('../libs/hwc_api');

/**
 * pre-check for huaweicloud cdn
 * @return {Boolean} true for passed, false for failed
 */
function preCheck() {
  if (isNil(process.env.HWC_ENABLE)) {
    logger.info(`ENV HWC_ENABLE is empty, exiting ...`);
    return false;
  }
  if (process.env.HWC_ENABLE !== 'true') {
    logger.info(`HWC_ENABLE is not 'true', disabled...`);
    return false;
  }
  if (isNil(process.env.HWC_BASEURL)) {
    logger.info(`ENV HWC_BASEURL is empty, exiting...`);
    return false;
  }
}

async function cdn_task(res) {
  if (!preCheck()) {
    return;
  }
  let baseUrl = process.env.HWC_BASEURL;
  if (!baseUrl.match('/$')) {
    baseUrl += '/';
  }
  let token = await hwc_api.getToken();
  let preHeatingArray = res.preHeatingArray;
  preHeatingArray.push(baseUrl + date + '.zip');
  let refreshFilesArray = [baseUrl];
  try {
    let cdn_refresh = await hwc_api.cdn_refreshtasks(refreshFilesArray, token.x_subject_token);
    logger.info(`cdn_refreshtasks submit successful`);
    logger.debug(JSON.stringify(cdn_refresh));
    let cdn_refresh_detail = await hwc_api.showHistoryTaskDetails(
      token.x_subject_token,
      cdn_refresh.body.refreshTask.id
    );
    await hwc_api.waitForRefreshTaskDone(token.x_subject_token, cdn_refresh_detail.body.id)
      .then(res => {
        logger.info(`Refresh Task Run Successful, Total: ${res}`);
      })
      .then(async () => {
        logger.info(`Submitting cdn_preheatingtasks...`)
        await hwc_api.cdn_preheating(token.x_subject_token, preHeatingArray)
          .then(result => {
            if (result.length === 0) {
              logger.info(`cdn_preheatingtasks submit successful`);
            } else {
              logger.debug(`Failed preheating task:`)
              logger.debug(JSON.stringify(result));
            }
          })
          .catch(e => {
            logger.error(e);
          })
      })
      .catch(e => {
        logger.info(`cdn_refreshtasks running failed!!!`);
        logger.error(e);
      })
  } catch (e) {
    logger.info(`cdn_refreshtasks running failed!!!`);
    logger.error(e);
  }
}

module.exports = {
  cdn_task
}