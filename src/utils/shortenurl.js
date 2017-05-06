/**
 * this api(appkey) was found in
 * https://www.douban.com/note/249723561/
 *
 * url template:
 * http://api.t.sina.com.cn/short_url/shorten.json?source=${appkey}&url_long=${url}
 */

'use strict';

const http = require('http');

function shortenUrl(url) {
    let path = '';
    const argIsArray = Array.isArray(url);

    if (argIsArray) {
        path = url.reduce((a, b) => `${a}&url_long=${b}`, '');
    } else {
        path = `&url_long=${url}`;
    }
    path = '/short_url/shorten.json?source=3271760578' + path;

    return new Promise((resolve, reject) => {
        http.request({
            method: 'GET',
            protocol: 'http:',
            host: 'api.t.sina.com.cn',
            path
        }, res => {
            let chunks = '';
            let response;

            res.on('data', data => chunks += data);
            res.on('end', () => {
                response = JSON.parse(chunks);
                if (response.error_code) {
                    reject(response.error);
                } else {
                    if (!argIsArray) {
                        resolve(response[0].url_short);
                    } else {
                        resolve(response.map(r => r.url_short));
                    }
                }
            });
        }).end();
    });
}

module.exports = shortenUrl;
