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
            pgv_info: `ssid=s${Codec.randPgv()}`,
            pgv_pvid: Codec.randPgv()
        };
        this.client.setCookie(initCookies);
        await this.client.get(URL.loginPrepare);
        let qrCode = await this.client.get({ url: URL.qrcode, responseType: 'arraybuffer' });
        await writeFileAsync('/tmp/code.png', qrCode, 'binary');
        log.info('二维码下载完成，等待扫描...');
        require('child_process').exec('xdg-open /tmp/code.png');
        let scanSuccess = false;
        let quotRegxp = /'[^,]*'/g;
        let ptlogin4URL;
        do {
            let responseBody = await this.client.get({
                url: URL.getPtqrloginURL(this.client.getCookie('qrsig')),
                headers: { Referer: URL.qrsigReferer },
            });
            log.debug(responseBody);
            let arr = responseBody.match(quotRegxp).map(i => i.substring(1, i.length - 1));
            if (arr[0] === '0') {
                scanSuccess = true;
                ptlogin4URL = arr[2];
            }
        } while (!scanSuccess);
        log.info('二维码扫描完成');
        require('child_process').exec('rm /tmp/code.png');
        await this.client.get({
            url: ptlogin4URL,
            maxRedirects: 0,     // Axios follows redirect automatically, but we need to disable it here.
            headers: { Referer: URL.ptlogin4Referer }
        });
        this.tokens.ptwebqq = this.client.getCookie('ptwebqq');
        log.info('获取 ptwebqq 成功');
        let vfwebqqResp = await this.client.get({
            url: URL.getVfwebqqURL(this.tokens.ptwebqq),
            headers: { Referer: URL.vfwebqqReferer }
        });
        log.debug(vfwebqqResp);
        this.tokens.vfwebqq = vfwebqqResp.result.vfwebqq;
        log.info('获取 vfwebqq 成功');

    }
}

module.exports = QQ;