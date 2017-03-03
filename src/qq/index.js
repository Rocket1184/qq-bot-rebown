'use strict';

const fs = require('fs');
const Log = require('log');

const URL = require('./url');
const Codec = require('../codec');
const Client = require('../httpclient');

const log = new Log('debug');

const AppConfig = {
    clientid: 53999199,
    appid: 501004106
};

function writeFileAsync(filePath, data, options) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, data, options, error => {
            if (error) reject(error);
            resolve();
        });
    });
};

class QQ {
    constructor() {
        this.tokens = {
            ptwebqq: '',
            vfwebqq: '',
            psessionid: ''
        };
        this.selfInfo = {};
        this.buddy = {};
        this.discu = {};
        this.group = {};
        this.client = new Client();
    }

    async login() {
        let initCookies = {
            pgv_info: `ssid=${Codec.randPgv()}`,
            pgv_pvid: Codec.randPgv()
        };
        this.client.setCookie(initCookies);
        await this.client.get(URL.loginPrepare);
        let qrCode = await this.client.get({ url: URL.qrcode, responseType: 'arraybuffer' });
        await writeFileAsync('/tmp/code.png', qrCode, 'binary');
        log.info('二维码下载完成，等待扫描...');
        let scanSuccess = false;
        do {
            let responseBody = await this.client.get({
                url: URL.getPtqrloginURL(this.client.getCookie('qrsig')),
                headers: { Referer: URL.qrsigReferer },
            });
            log.debug(responseBody);
            let arr = responseBody.split(`','`);
        } while (!scanSuccess)
    }
}

module.exports = QQ;