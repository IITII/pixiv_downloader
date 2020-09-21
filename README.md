# PIXIV_DOWNLOADER
> A simple downloader for pixiv daily  

## Use

* git clone
* SET ENV, for example: export PIXIV_USERNAME='233'
* npm start

## Config

* Most configure in `config.js`, please modify it as you want
* Please modify ENV setting if you want to use huaweicloud cdn. (`disable by default`)


|       Param       |                   Default                   |              Description               |
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



## Docs

* See: [https://iitii.github.io/pixiv_downloader/](https://iitii.github.io/pixiv_downloader/)