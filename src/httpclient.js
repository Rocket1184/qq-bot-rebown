'use strict';

const qs = require('querystring');

const Log = require('log');
const Axios = require('axios');
const Cookie = require('cookie');

const log = new Log('debug');

function logResponse(resp) {
    log.debug(`request:`);
    log.debug(JSON.stringify(resp.config, null, 4));
    log.debug(`status: ${resp.status} ${resp.statusText}`);
    log.debug(`response headers:`);
    log.debug(JSON.stringify(resp.headers, null, 4));
}

class HttpClient {
    constructor() {
        this.cookie = {};
        this.clientHeaders = {
            UserAgent: 'Mozilla/5.0 (Linux x86_64; rv:51.0) Gecko/20100101 Firefox/51.0'
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
        if (Array.isArray(arg))
            arg = arg.join(' ').replace(/HttpOnly /g, '');
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

    handleResponse(response) {
        logResponse(response);
        this.updateCookie(response.headers['set-cookie']);
    }

    static mkFormR(payload) {
        return qs.stringify({
            r: JSON.stringify(payload)
        });
    }

    post(config) {
        config.data = HttpClient.mkFormR(config.data);

        config.headers = Object.assign({
            Cookie: this.getCookieString(),
            'User-Agent': this.clientHeaders.UserAgent,
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Content-Length': Buffer.byteLength(config.data)
        }, config.headers);

        return new Promise((resolve, reject) => {
            Axios(config).then(response => {
                this.handleResponse(response);
                resolve(response.data);
            }).catch(error => {
                log.error(error);
                reject(error);
            });
        });
    }

    get(urlOrConfig) {
        let config;
        if (typeof urlOrConfig == 'string')
            config = { url: urlOrConfig };
        else config = urlOrConfig;

        config.headers = Object.assign({
            Cookie: this.getCookieString(),
            'User-Agent': this.clientHeaders.UserAgent
        }, config.headers);

        return new Promise((resolve, reject) => {
            Axios.get(config.url, config).then(response => {
                this.handleResponse(response);
                resolve(response.data);
            }).catch(error => {
                if (error.response.status === 302) {
                    this.handleResponse(error.response);
                    resolve(error.response);
                } else {
                    log.error(error);
                    reject(error);
                }
            });
        });
    }
}

module.exports = HttpClient;