# PIXIV_DOWNLOADER
> A simple downloader for pixiv daily  

## Use

* git clone
* SET ENV, for example: export PIXIV_USERNAME='233'
* npm start

## Config

* Most configure in `config.js`, please modify it as you want
* Please modify ENV setting if you want to use huaweicloud cdn. (`disable by default`)


|     Property      |                   Default                   |              Description               |
| :---------------: | :-----------------------------------------: | :------------------------------------: |
|  pixiv.username   |         process.env.PIXIV_USERNAME          |             pixiv username             |
|  pixiv.password   |         process.env.PIXIV_PASSWORD          |             pixiv password             |
|    pixiv.proxy    |           process.env.HTTP_PROXY            |          http_proxy for pixiv          |
|     webdriver     |                 `headless`                  |             selenium args              |
| save.aria2Enable  |                    false                    |        enable or disable aria2         |
|  save.aria2.href  |                    null                     |        aria2 download url href         |
|  save.aria2.rpc   |               localhost:6800                |            aria2 rpc config            |
| save.aria2.config |         {"pause-metadata": "true"}          |        aria2 download configure        |
|    save.proxy     |           process.env.HTTP_PROXY            |        http_proxy  for download        |
|     save.dir      |      path.resolve(__dirname, './tmp')       |           save dir for image           |
|    save.limit     |                     10                      |       concurrency download limit       |
|   redis.enable    |                    true                     |    using redis to remove duplicate     |
|   redis.connect   |     {"port": 6379,"host": "127.0.0.1"}      |      Redis connection configure.       |
|       proxy       |           process.env.HTTP_PROXY            |           global http_proxy            |
|    user_agent     |    `windows chrome default, dont modify`    | UserAgent for download, dynamic update |
|      baseUrl      |           process.env.HWC_BASEURL           |       huaweicloud cdn basic url        |
|    HWC_ENABLE     | process.env.HWC_ENABLE (disable by default) |   enable or disable huaweicloud cdn    |
|    HWC_BASEURL    |           process.env.HWC_BASEURL           |       huaweicloud cdn basic url        |
|       NAME        |            process.env.HWC_NAME             |          huaweicloud username          |
|     PASSWORD      |          process.env.HWC_PASSWORD           |          huaweicloud password          |
| USER_DOMAIN_NAME  |      process.env.HWC_USER_DOMAIN_NAME       |      huaweicloud user domain name      |
| SCOPE_DOMAIN_NAME |      process.env.HWC_SCOPE_DOMAIN_NAME      |   huaweicloud user scope domain name   |

> See: [https://apiexplorer.developer.huaweicloud.com/apiexplorer/doc?product=IAM&api=KeystoneCreateUserTokenByPassword](https://apiexplorer.developer.huaweicloud.com/apiexplorer/doc?product=IAM&api=KeystoneCreateUserTokenByPassword)  
> See: [https://apiexplorer.developer.huaweicloud.com/apiexplorer/doc?product=CDN&api=CreatePreheatingTasks](https://apiexplorer.developer.huaweicloud.com/apiexplorer/doc?product=CDN&api=CreatePreheatingTasks)  
> Redis configure: [https://github.com/NodeRedis/node-redis#options-object-properties](https://github.com/NodeRedis/node-redis#options-object-properties)  



## Docs

* See: [https://iitii.github.io/pixiv_downloader/](https://iitii.github.io/pixiv_downloader/)

## Known issues

* Socket hang up when committing huaweicloud preheating task.

## Q&A

1. Why does the file name look strange? Such as: `83876617_p0.png`, `83882514_p0.jpg`, `83875546_p1.jpg`. Does it have any special meaning?

* Yes, it does. 
* Take `83876617_p0.png` for instance, I think `83876617` is the unique id for each artwork, `p0` and `p1` is the index of each image which are in the same artworks. 
* You can visit `https://www.pixiv.net/artworks/${unique_id}` to verify it, for example, [https://www.pixiv.net/artworks/83876617](https://www.pixiv.net/artworks/83876617)
