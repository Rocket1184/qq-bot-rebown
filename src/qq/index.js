'use strict';

const fs = require('fs');

const URL = require('./url');
const Codec = require('../codec');
const Client = require('../httpclient');
const MessageAgent = require('./message-agent');

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
}

class QQ {
    constructor(...msgHandlers) {
        this.tokens = {
            uin: '',
            ptwebqq: '',
            vfwebqq: '',
            psessionid: ''
        };
        this.selfInfo = {};
        this.buddy = {};
        this.discu = {};
        this.group = {};
        this.buddyNameMap = new Map();
        this.discuNameMap = new Map();
        this.groupNameMap = new Map();
        this.client = new Client();
        this.messageAgent = null;
        this.msgHandlers = msgHandlers;
    }

    async run() {
        await this.login();
        await this.initInfo();
        await this.loopPoll();
    }

    async login() {
        log.info('(0/5) 开始登录，准备下载二维码');

        // Step0: prepare cookies, pgv_info and pgv_pvid
        // http://pingjs.qq.com/tcss.ping.js  tcss.run & _cookie.init
        let initCookies = {
            pgv_info: `ssid=s${Codec.randPgv()}`,
            pgv_pvid: Codec.randPgv()
        };
        this.client.setCookie(initCookies);
        await this.client.get(URL.loginPrepare);

        // Step1: download QRcode
        let qrCode = await this.client.get({ url: URL.qrcode, responseType: 'arraybuffer' });
        await writeFileAsync('/tmp/code.png', qrCode, 'binary');
        log.info('(1/5) 二维码下载完成，等待扫描');
        // open file, only for linux
        require('child_process').exec('xdg-open /tmp/code.png');

        // Step2: 
        let scanSuccess = false;
        let quotRegxp = /'[^,]*'/g;
        let ptqrloginURL = URL.getPtqrloginURL(this.client.getCookie('qrsig'));
        let ptlogin4URL;
        do {
            let responseBody = await this.client.get({
                url: ptqrloginURL,
                headers: { Referer: URL.ptqrloginReferer },
            });
            log.debug(responseBody);
            let arr = responseBody.match(quotRegxp).map(i => i.substring(1, i.length - 1));
            if (arr[0] === '0') {
                scanSuccess = true;
                ptlogin4URL = arr[2];
            }
        } while (!scanSuccess);
        log.info('(2/5) 二维码扫描完成');
        // remove file, for linux(or macOS ?)
        require('child_process').exec('rm /tmp/code.png');

        // Step3: find token 'vfwebqq' in cookie
        // NOTICE: the request returns 302 when success. DO NOT REJECT 302.
        await this.client.get({
            url: ptlogin4URL,
            maxRedirects: 0,     // Axios follows redirect automatically, but we need to disable it here.
            validateStatus: status => status === 302,
            headers: { Referer: URL.ptlogin4Referer }
        });
        this.tokens.ptwebqq = this.client.getCookie('ptwebqq');
        log.info('(3/5) 获取 ptwebqq 成功');

        // Step4: request token 'vfwebqq'
        let vfwebqqResp = await this.client.get({
            url: URL.getVfwebqqURL(this.tokens.ptwebqq),
            headers: { Referer: URL.vfwebqqReferer }
        });
        log.debug(vfwebqqResp);
        this.tokens.vfwebqq = vfwebqqResp.result.vfwebqq;
        log.info('(4/5) 获取 vfwebqq 成功');

        // Step5: psessionid and uin
        let loginStat = await this.client.post({
            url: URL.login2,
            data: {
                ptwebqq: this.tokens.ptwebqq,
                clientid: AppConfig.clientid,
                psessionid: "",
                status: "online",
            },
            headers: {
                Origin: URL.login2Origin,
                Referer: URL.login2Referer
            }
        });
        log.debug(loginStat);
        this.tokens.uin = loginStat.result.uin;
        this.tokens.psessionid = loginStat.result.psessionid;
        this.messageAgent = new MessageAgent({
            psessionid: this.tokens.psessionid
        });
        log.info('(5/5) 获取 psessionid 和 uin 成功');
    }

    getSelfInfo() {
        log.info('开始获取用户信息');
        return this.client.get({
            url: URL.selfInfo,
            headers: { Referer: URL.referer130916 }
        });
    }

    getBuddy() {
        log.info('开始获取好友列表');
        return this.client.post({
            url: URL.getBuddy,
            headers: {
                Referer: URL.referer130916
            },
            data: {
                vfwebqq: this.tokens.vfwebqq,
                hash: Codec.hashU(this.tokens.uin, this.tokens.ptwebqq)
            }
        });
    }

    getOnlineBuddies() {
        log.info('开始获取好友在线状态');
        return this.client.get({
            url: URL.onlineBuddies(this.tokens.vfwebqq, this.tokens.psessionid),
            headers: {
                Referer: URL.referer151105
            }
        });
    }

    getGroup() {
        log.info('开始获取群列表');
        return this.client.post({
            url: URL.getGroup,
            headers: {
                Referer: URL.referer130916
            },
            data: {
                vfwebqq: this.tokens.vfwebqq,
                hash: Codec.hashU(this.tokens.uin, this.tokens.ptwebqq)
            }
        });
    }

    getDiscu() {
        log.info('开始获取讨论组列表');
        return this.client.post({
            url: URL.getDiscu(this.tokens.vfwebqq, this.tokens.psessionid),
            headers: {
                Referer: URL.referer130916
            },
            data: {
                vfwebqq: this.tokens.vfwebqq,
                hash: Codec.hashU(this.tokens.uin, this.tokens.ptwebqq)
            }
        });
    }

    async initInfo() {
        let manyInfo = await Promise.all([
            this.getSelfInfo(),
            this.getBuddy(),
            this.getOnlineBuddies(),
            this.getDiscu(),
            this.getGroup()
        ]);
        log.debug(JSON.stringify(manyInfo, null, 4));
        this.selfInfo = manyInfo[0].result;
        this.buddy = manyInfo[1].result;
        this.discu = manyInfo[3].result.dnamelist;
        this.group = manyInfo[4].result.gnamelist;
        let promises = this.group.map(async e => {
            let rawInfo = await this.getGroupInfo(e.code);
            e.info = rawInfo.result;
        });
        promises = promises.concat(this.discu.map(async e => {
            let rawInfo = await this.getDiscuInfo(e.did);
            e.info = rawInfo.result;
        }));
        manyInfo = await Promise.all(promises);
        log.debug(JSON.stringify(manyInfo, null, 4));
        log.info('信息初始化完成');
    }

    getBuddyName(uin) {
        let name = this.buddyNameMap.get(uin);
        if (name) return name;
        this.buddy.marknames.some(e => e.uin == uin ? name = e.markname : false);
        if (!name) this.buddy.info.some(e => e.uin == uin ? name = e.nick : false);
        this.buddyNameMap.set(uin, name);
        return name;
    }

    getDiscuName(did) {
        let name = this.discuNameMap.get(did);
        if (name) return name;
        this.discu.some(e => e.did == did ? name = e.name : false);
        this.discuNameMap.set(did, name);
        return name;
    }

    getDiscuInfo(did) {
        return this.client.get({
            url: URL.discuInfo(did, this.tokens.psessionid, this.tokens.vfwebqq),
            headers: { Referer: URL.referer151105 }
        });
    }

    getNameInDiscu(uin, did) {
        let nameKey = `${did}${uin}`;
        let name = this.discuNameMap.get(nameKey);
        if (name) return name;
        let discu;
        for (let d of this.discu) {
            if (d.did == did) {
                discu = d;
                break;
            }
        }
        discu.info.mem_info.some(i => i.uin == uin ? name = i.nick : false);
        this.discuNameMap.set(nameKey, name);
        return name;
    }

    getGroupName(groupCode) {
        let name = this.groupNameMap.get(groupCode);
        if (name) return name;
        this.group.some(e => e.gid == groupCode ? name = e.name : false);
        this.groupNameMap.set(groupCode, name);
        return name;
    }

    getGroupInfo(code) {
        return this.client.get({
            url: URL.groupInfo(code, this.tokens.vfwebqq),
            headers: { Referer: URL.referer130916 }
        });
    }

    getNameInGroup(uin, groupCode) {
        let nameKey = `${groupCode}${uin}`;
        let name = this.groupNameMap.get(nameKey);
        if (name) return name;
        let group;
        for (let g of this.group) {
            if (g.gid == groupCode) {
                group = g;
                break;
            }
        }
        group.info.cards.some(i => i.muin == uin ? name = i.card : false);
        if (!name) group.info.minfo.some(i => i.uin == uin ? name = i.nick : false);
        this.groupNameMap.set(nameKey, name);
        return name;
    }

    logMessage(msg) {
        let content = msg.result[0].value.content.filter(e => typeof e == 'string').join(' ');
        let { from_uin, send_uin } = msg.result[0].value;
        switch (msg.result[0].poll_type) {
            case 'message':
                log.info(`[新消息] ${this.getBuddyName(from_uin)} | ${content}`);
                break;
            case 'group_message':
                log.info(`[群消息] ${this.getGroupName(from_uin)} : ${this.getNameInGroup(send_uin, from_uin)} | ${content}`);
                break;
            case 'discu_message':
                log.info(`[讨论组] ${this.getDiscuName(from_uin)} : ${this.getNameInDiscu(send_uin, from_uin)} | ${content}`);
        }
    }

    handelMsgRecv(msg) {
        let content = msg.result[0].value.content.filter(e => typeof e == 'string').join(' ');
        let { from_uin, send_uin } = msg.result[0].value;
        let msgParsed = { content };
        switch (msg.result[0].poll_type) {
            case 'message':
                msgParsed.type = 'buddy';
                msgParsed.id = from_uin;
                msgParsed.name = this.getBuddyName(from_uin);
                break;
            case 'group_message':
                msgParsed.type = 'group';
                msgParsed.id = send_uin;
                msgParsed.name = this.getNameInGroup(send_uin, from_uin);
                msgParsed.groupId = from_uin;
                msgParsed.groupName = this.getGroupName(from_uin);
                break;
            case 'discu_message':
                msgParsed.type = 'discu';
                msgParsed.id = send_uin;
                msgParsed.name = this.getNameInDiscu(send_uin, from_uin);
                msgParsed.discuId = from_uin;
                msgParsed.discuName = this.getDiscuName(from_uin);
        }
        this.msgHandlers.forEach(handler => handler.tryHandle(msgParsed, this));
    }

    async loopPoll() {
        log.info('开始接收消息...');
        do {
            let msgContent = await this.client.post({
                url: URL.poll,
                data: {
                    ptwebqq: this.tokens.ptwebqq,
                    clientid: AppConfig.clientid,
                    psessionid: this.tokens.psessionid,
                    key: ''
                },
                headers: {
                    Origin: URL.msgOrigin,
                    Referer: URL.referer151105
                },
                responseType: 'text',
                validateStatus: status => status === 200 || status === 504
            });
            log.debug(msgContent);
            if (msgContent.result) {
                try {
                    this.logMessage(msgContent);
                    this.handelMsgRecv(msgContent);
                } catch (error) {
                    log.error(error);
                }
            }
        } while (true);
    }

    async innerSendMsg(url, key, id, content) {
        const resp = await this.client.post({
            url,
            data: this.messageAgent.build(key, id, content),
            headers: { Referer: URL.referer151105 }
        });
        log.debug(resp);
        /* it returns 
         * { errmsg: 'error!!!', retcode: 100100 }
         * when success, i don't know why.
         * fxxk tencent
         */
        return resp;
    }

    async sendBuddyMsg(uin, content) {
        const resp = await this.innerSendMsg(URL.buddyMsg, 'buddy', uin, content);
        log.info(`发消息给好友 ${this.getBuddyName(uin)} : ${content}`);
        return resp;
    }

    async sendDiscuMsg(did, content) {
        const resp = await this.innerSendMsg(URL.discuMsg, 'discu', did, content);
        log.info(`发消息给讨论组 ${this.getDiscuName(did)} : ${content}`);
        return resp;
    }

    async sendGroupMsg(gid, content) {
        const resp = await this.innerSendMsg(URL.groupMsg, 'group', gid, content);
        log.info(`发消息给群 ${this.getGroupName(gid)} : ${content}`);
        return resp;
    }
}

module.exports = QQ;
