module.exports = {
  pixiv: {
    username: '' || process.env.PIXIV_USERNAME,
    password: '' || process.env.PIXIV_PASSWORD,
    proxy: '' || process.env.HTTP_PROXY
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
    dir: './tmp'
  },
  // sub-proxy will replace parent proxy
  proxy: '',
  user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Safari/537.36'
}