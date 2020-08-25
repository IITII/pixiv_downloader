'use strict';
async function sleep(ms) {
  return await new Promise((resolve) => {
    setTimeout(() => {
      return resolve();
    }, ms)
  })
}
(async function (){
    console.log(require('moment')().format('M'));
    await sleep(30*1000);
})()