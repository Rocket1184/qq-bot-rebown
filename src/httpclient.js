'use strict';

const qs = require('querystring');
const Log = require('log');

const Axios = require('axios');
const Cookie = require('cookie');

const log = global.log || new Log(process.env.LOG_LEVEL || 'info');

function transformHeaders(k, v) {
    if (k === 'Cookie') {
        return Cookie.parse(v);
    } else return v;
}

function logResponse(resp) {
    log.debug(`HTTP:
${(resp.config.method).toUpperCase()} ${resp.config.url}
Status: ${resp.status} ${resp.statusText}
Response Headers: ${JSON.stringify(resp.headers, null, 2)}
Request Headers: ${JSON.stringify(resp.config.headers, transformHeaders, 2)}`);
}

class HttpClient {
    constructor() {
        this.cookie = {};
    }

    get clientHeaders() {
        return {
            Cookie: this.getCookieString(),
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:51.0) Gecko/20100101 Firefox/51.0'
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
        delete this.cookie.EXPIRES;
        delete this.cookie.DOMAIN;
        delete this.cookie.PATH;
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
        config.method = 'post';
        config.data = HttpClient.mkFormR(config.data);

        config.headers = Object.assign({
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(config.data)
        }, this.clientHeaders, config.headers);

        return new Promise((resolve, reject) => {
            Axios(config).then(response => {
                this.handleResponse(response);
                resolve(response.data);
            }).catch(error => {
                logResponse(error.response);
                reject(error);
            });
        });
    }

    get(urlOrConfig) {
        let config;
        if (typeof urlOrConfig == 'string')
            config = { url: urlOrConfig };
        else config = urlOrConfig;

        config.headers = Object.assign(this.clientHeaders, config.headers);

        return new Promise((resolve, reject) => {
            Axios(config).then(response => {
                this.handleResponse(response);
                resolve(response.data);
            }).catch(error => {
                logResponse(error.response);
                reject(error);
            });
        });
    }
}

module.exports = HttpClient;
