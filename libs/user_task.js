/**
 * @author IITII
 * @date 2020/9/19 17:34
 */
'use strict';
const config = require('../config'),
  {logger} = require('./logger');

function aria2() {
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
          })
      })
      .catch(e => {
        logger.error(e);
      })
  }
}

module.exports = {
  aria2,
}