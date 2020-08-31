'use strict';
/**
 * @author IITII
 * @date 2020/8/28 11:39
 */
const got = require('got'),
  _ = require('lodash'),
  // User name
  NAME = process.env.HWC_NAME,
  // User password
  PASSWORD = process.env.HWC_PASSWORD,
  // User domain name
  USER_DOMAIN_NAME = process.env.HWC_USER_DOMAIN_NAME,
  // User scope domain name
  SCOPE_DOMAIN_NAME = process.env.HWC_SCOPE_DOMAIN_NAME,
  // SCOPE_PROJECT_NAME = process.env.SCOPE_PROJECT_NAME,
  // See: https://apiexplorer.developer.huaweicloud.com/apiexplorer/doc?product=IAM&api=KeystoneCreateUserTokenByPassword
  // See: https://apiexplorer.developer.huaweicloud.com/apiexplorer/doc?product=CDN&api=CreatePreheatingTasks

  // Anything about api url?
  // See: https://github.com/sindresorhus/ky/issues/70
  API = {
    IAM: {
      END_POINT: 'https://iam.cn-north-4.myhuaweicloud.com',
      KeystoneCreateUserTokenByPassword: 'v3/auth/tokens'
    },
    CDN: {
      END_POINT: 'https://cdn.myhwclouds.com',
      preheatingtasks: 'v1.0/cdn/preheatingtasks',
      refreshtasks: 'v1.0/cdn/refreshtasks',
      ShowHistoryTaskDetails: 'v1.0/cdn/historytasks/history_tasks_id/detail',
    }
  };

/**
 * Simple packaging got
 * @param prefixUrl {String | URL} got prefixUrl
 * @param token {String} huaweicloud IAM Token
 * @param json_body POST BODY, NULL for GET Method
 * @return {Got} Got instance
 * @see https://github.com/sindresorhus/got
 * <br>
 * @see https://apiexplorer.developer.huaweicloud.com/apiexplorer/doc
 */
function got_instance(prefixUrl, token, json_body = null) {
  try {
    new URL(prefixUrl)
  } catch (ERR_INVALID_URL) {
    throw new Error('Invalid prefixUrl!!!');
  }
  let op = {
    prefixUrl: prefixUrl,
    headers: {
      'content-type': 'application/json;charset=utf8',
      'X-Auth-Token': token
    },
    responseType: "json",
    json: json_body
  }
  // Remove empty param
  // op = _.pickBy(op,!_.isNil);
  if (json_body === null) {
    delete op["json"];
  }
  return got.extend(op);
}

/**
 * huaweicloud common api operation
 * @param prefixUrl prefixUrl {String | URL} got prefixUrl
 * @param api_url API URL which shouldn't start with '/'
 * @param body request body
 * @param token {String} huaweicloud IAM TOKEN
 * @param instance Got instance, default null
 * @return {JSON | Error}
 * @see https://github.com/sindresorhus/got
 * <br>
 * @see https://apiexplorer.developer.huaweicloud.com/apiexplorer/doc
 */
async function hwc_common(prefixUrl, api_url, body, token, instance = null) {
  return await new Promise((resolve, reject) => {
    instance = instance === null
      ? instance = got_instance(prefixUrl, token, body)
      : instance;
    instance.post(api_url)
      .then(res => {
        if (res.statusCode === 200) {
          return resolve({
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            body: res.body
          });
        } else {
          return reject({
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            body: res.body
          });
        }
      })
      .catch(e => {
        return reject(e);
      });
  });
}


/**
 * Give a string or array, get a compact array
 * @param array {String | Array} Input array or string
 * @return {Array} Output array without null object
 * @see https://www.lodashjs.com/docs/lodash.compact
 */
function checkUrl(array) {
  if (_.isArray(array)) {
    return _.compact(array);
  } else if (typeof array === 'string') {
    try {
      new URL(array);
      return [array];
    } catch (e) {
      return [];
    }
  } else {
    return [];
  }
}

/**
 * Get huaweicloud IAM TOKEN
 * @return {JSON} huaweicloud IAM TOKEN
 * @see https://apiexplorer.developer.huaweicloud.com/apiexplorer/debug?product=IAM&api=KeystoneCreateUserTokenByPassword
 */
async function getToken() {
  return await new Promise((resolve, reject) => {
    let userInfo = {
      "auth": {
        "identity": {
          "methods": [
            "password"
          ],
          "password": {
            "user": {
              "domain": {
                "name": USER_DOMAIN_NAME
              },
              "name": NAME,
              "password": PASSWORD
            }
          }
        },
        "scope": {
          "domain": {
            "name": SCOPE_DOMAIN_NAME
          }
        }
      }
    }
    got_instance(API.IAM.END_POINT, "", userInfo)
      .post(API.IAM.KeystoneCreateUserTokenByPassword)
      .then(res => {
        if (res.statusCode === 201) {
          return resolve({
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            x_subject_token: res.headers['x-subject-token'],
            // We don't need it
            // body: res.body
          });
        } else {
          return reject({
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
          });
        }
      })
      .catch(e => {
        return reject(e);
      })
  })
}


/**
 * huaweicloud cdn preheatingtasks
 * @param array {Array | String}
 * @param token {String} huaweicloud IAM TOKEN
 * @param instance Got instance, default null
 * @return {JSON | Error} result
 * @see https://apiexplorer.developer.huaweicloud.com/apiexplorer/debug?product=CDN&api=CreatePreheatingTasks
 */
async function cdn_preheatingtasks(array, token, instance = null) {
  return await new Promise((resolve, reject) => {
    let tmpArray = checkUrl(array);
    if (tmpArray.length === 0) {
      return reject('Invalid Input!!!');
    }
    let body = {
      "preheatingTask": {
        "urls": tmpArray
      }
    };
    hwc_common(API.CDN.END_POINT, API.CDN.preheatingtasks, body, token, instance)
      // got_instance(API.CDN.END_POINT,token,body)
      .then(res => {
        return resolve(res);
      })
      .catch(e => {
        return reject(e);
      })
  });
}

/**
 * huaweicloud cdn refreshtasks
 * @param array {Array | String}
 * @param token {String} huaweicloud IAM TOKEN
 * @param types {'file'|'directory'} refresh types, default 'file'
 * @param instance Got instance, default null
 * @return {JSON | Error} result
 * @see https://apiexplorer.developer.huaweicloud.com/apiexplorer/doc?product=CDN&api=CreateRefreshTasks
 */
async function cdn_refreshtasks(array, token, types = "file", instance = null) {
  return await new Promise((resolve, reject) => {
    let tmpArray = checkUrl(array);
    if (tmpArray.length === 0) {
      return reject('Invalid Input!!!');
    }
    let body = {
      "refreshTask": {
        "type": types,
        "urls": tmpArray
      }
    };
    hwc_common(API.CDN.END_POINT, API.CDN.refreshtasks, body, token, instance)
      // got_instance(API.CDN.END_POINT,token,body)
      .then(res => {
        return resolve(res);
      })
      .catch(e => {
        return reject(e);
      })
  })
}

/**
 * huaweicloud cdn refreshtasks
 * @param history_tasks_id TaskID
 * @param token {String} huaweicloud IAM TOKEN
 * @param instance Got instance, default null
 * @return {JSON | Error} result
 * @see https://apiexplorer.developer.huaweicloud.com/apiexplorer/mock?product=CDN&api=ShowHistoryTaskDetails
 */
async function showHistoryTaskDetails(token, history_tasks_id, instance = null) {
  return await new Promise((resolve, reject) => {
    if (_.isNaN(history_tasks_id)) {
      return reject('Empty history_tasks_id');
    }
    instance = instance === null
      ? instance = got_instance(API.CDN.END_POINT, token)
      : instance;
    instance.get(API.CDN.ShowHistoryTaskDetails.replace('history_tasks_id', history_tasks_id))
      .then(res => {
        if (res.statusCode === 200) {
          return resolve({
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            body: res.body
          });
        } else {
          return reject({
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            body: res.body
          });
        }
      })
      .catch(e => {
        return reject(e);
      });
  });
}

/**
 * wait for refresh task done
 * @param token {String} huaweicloud IAM TOKEN
 * @param refreshTaskId {Number} cdn refresh Task ID
 * @param MAX_TRY Maximum attempts
 * @param query_break {Number} setTimeout time unit
 * @param instance  Got instance, default null
 * @return {Array | Number | Error}
 * Number for succeed task numbers
 * <br>
 * Array for failed task array
 * <br>
 * Error for other error
 */
async function waitForRefreshTaskDone(token, refreshTaskId, MAX_TRY = 10 * 6, query_break = 10 * 1000, instance) {
  return await new Promise((resolve, reject) => {
    let try_time = 0;
    setTimeout(async () => {
      if (++try_time > MAX_TRY) {
        return reject('Maximum number of attempts reached!!!');
      }
      try {
        let cdn_detail = await showHistoryTaskDetails(token, refreshTaskId, instance);
        if (cdn_detail.body.status === 'task_done') {
          if (cdn_detail.body.succeed === cdn_detail.body.urls.length) {
            // return if all task is succeed
            return resolve(cdn_detail.body.succeed)
          } else {
            let failedArray = (() => {
              let urls = cdn_detail.body.urls;
              let tmp = [];
              urls.forEach(url => {
                if (url.status === 'failed') {
                  tmp.push(url)
                }
              });
              return tmp;
            })()
            if (failedArray.length === 0) {
              return reject('Internal Error!!!');
            } else {
              return reject(failedArray);
            }
          }
        }
      } catch (e) {
        return reject(e);
      }

    }, query_break)
  })
}

module.exports = {
  getToken,
  cdn_refreshtasks,
  cdn_preheatingtasks,
  showHistoryTaskDetails,
  waitForRefreshTaskDone,
}