'use strict';

const qs = require('querystring');

const Log = require('log');
const Axios = require('axios');
const Cookie = require('cookie');

const log = new Log('debug');

class HttpClient {
    constructor() {
        this.cookie = {};
        this.clientHeaders = {
            'User-Agent': 'Mozilla/5.0 (Linux x86_64; rv:51.0) Gecko/20100101 Firefox/51.0'
        };
    }

    setCookie(arg) {
        switch (typeof arg) {
            case 'string':
                this.cookie = Cookie.parse(arg);
                break;
            case 'object':
                this.cookie = arg;
        }
    }

    updateCookie(arg) {
        if (typeof arg == 'string')
            arg = Cookie.parse(arg);
        for (let key in arg) {
            this.cookie[key] = arg[key];
        }
    }

    getCookie(key = '') {
        if (key.length) {
            try {
                return this.cookie[key];
            }
            catch (err) {
                throw new Error(`[HttpClient] No such cookie '${key}'`);
            }
        } else {
            return this.cookie;
        }
    }

    getCookieString() {
        let result = '';
        for (let key in this.cookie) {
            result += `${key}=${this.cookie[key]}; `;
        }
        return result;
    }

    post(url, data, config) {
        if (typeof data == 'object') data = qs.stringify(data);
        return new Promise((resolve, reject) => {
            Axios({
                url: url,
                method: 'post',
                data: data,
                headers: {
                    'Cookie': this.getCookieString(),
                    'Referer': config.Referer,
                    'User-Agent': this.clientHeaders['UserAgent'],
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'Content-Length': Buffer.byteLength(data)
                }
            }).then(response => {
                log.debug(response);
                this.updateCookie(response.headers['set-cookie']);
                resolve(JSON.parse(response.data));
            }).catch(error => {
                // log.debug(response);
                reject(error);
            });
        });
    }

    get(urlOrConfig, jsonParse = true) {
        let config = {
            url: (typeof urlOrConfig == 'string') ? urlOrConfig : urlOrConfig.url,
            method: 'get',
            headers: {
                'Cookie': this.getCookieString(),
                'Referer': urlOrConfig.Referer || '',
                'User-Agent': this.clientHeaders['UserAgent'] || ''
            }
        };
        return new Promise((resolve, reject) => {
            Axios(config).then(response => {
                log.debug(response);
                let result;
                if (jsonParse) result = JSON.parse(response.data);
                resolve(response.data);
            }).catch(error => {
                // log.debug(response);
                reject(error);
            });
        });
    }
}

module.exports = HttpClient;