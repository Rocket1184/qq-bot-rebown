'use strict';

const os = require('os');
const Log = require('log');
const path = require('path');
const EventEmitter = require('events');

const URL = require('./url');
const Codec = require('../codec');
const Utils = require('../utils');
const Client = require('../httpclient');
const MessageAgent = require('./message-agent');

const log = global.log || new Log(process.env.LOG_LEVEL || 'info');

class QQ extends EventEmitter {
    static get defaultOptions() {
        return {
            app: {
                clientid: 53999199,
                appid: 501004106
            },
            font: {
                name: '宋体',
                size: 10,
                style: [0, 0, 0],
                color: '000000'
            },
            cronTimeout: 60 * 1000,
            cookiePath: path.join(os.tmpdir(), 'qq-bot.cookie'),
            qrcodePath: path.join(os.tmpdir(), 'qq-bot-code.png')
        };
    }

    static parseOptions(opt) {
        const app = Object.assign(QQ.defaultOptions.app, opt.app);
        const font = Object.assign(QQ.defaultOptions.font, opt.font);
        return Object.assign(QQ.defaultOptions, opt, { app, font });
    }

    constructor(options = {}) {
        super();
        this.options = QQ.parseOptions(options);
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
        /**
         * @typedef {{name: string, uin: number}} BuddyQQNumInfo
         * @typedef {{gname: string, mems: BuddyQQNumInfo[]}} BuddyGroupMensInfo
         */
        /** @type {BuddyGroupMensInfo[]} */
        this.buddyGroup = [];
        this.buddyNameMap = new Map();
        this.discuNameMap = new Map();
        this.groupNameMap = new Map();
        this.client = new Client();
        this.messageAgent = null;
        // true if QQBot still online/trying to online
        this.isAlive = false;
        // functions to exec every `cronTimeout`
        this.cronJobs = [
            () => this.getSelfInfo()
                .then(resp => {
                    if (resp.retcode === 6) {
                        Utils.unlinkAsync(this.options.cookiePath);
                        log.info('Cookie 已过期，需重新登录');
                        this.emit('disconnect');
                        throw new Error('disconnect');
                    } else if (resp.result) {
                        this.selfInfo = resp.result;
                    }
                }),
            () => this.getOnlineBuddies(),
            () => this.getBuddy()
                .then(resp => {
                    if (resp.result) {
                        this.buddyNameMap = new Map();
                        this.buddy = resp.result;
                    }
                }),
            () => this.getBuddyGroupInfo()
                .then(buddyGroup => this.buddyGroup = buddyGroup),
            () => this.getGroup()
                .then(resp => {
                    if (resp.result.gnamelist) {
                        this.groupNameMap = new Map();
                        this.group = resp.result.gnamelist;
                    }
                })
                .then(() => Promise.all(this.getAllGroupMembers())),
            () => this.getDiscu()
                .then(resp => {
                    if (resp.result.dnamelist) {
                        this.discuNameMap = new Map();
                        this.discu = resp.result.dnamelist;
                    }
                })
                .then(() => Promise.all(this.getAllDiscuMembers()))
        ];
    }

    async run() {
        await this.login();
        this.isAlive = true;
        // await all info fetched, then continue receiving messages
        await (async function cron() {
            if (this.isAlive) {
                await Promise.all(this.cronJobs.map(job => job()));
                // execute cronJobs after `cronTimeout`
                setTimeout(cron.bind(this), this.options.cronTimeout);
            }
        }).apply(this);
        try {
            await this.loopPoll();
        } catch (err) {
            if (err.message === 'disconnect') {
                this.isAlive = false;
                return this.run();
            }
        }
    }

    async login() {
        this.emit('login');
        beforeGotVfwebqq: {
            if (await Utils.existAsync(this.options.cookiePath)) {
                try {
                    const cookieFile = await Utils.readFileAsync(this.options.cookiePath, 'utf-8');
                    const cookieText = cookieFile.toString();
                    log.info('(-/5) 检测到 cookie 文件，尝试自动登录');
                    this.emit('cookie-relogin');
                    this.tokens.ptwebqq = cookieText.match(/ptwebqq=(.+?);/)[1];
                    this.client.setCookie(cookieText);
                    // skip this label if found cookie, goto Step4
                    break beforeGotVfwebqq;
                } catch (err) {
                    this.tokens.ptwebqq = '';
                    Utils.unlinkAsync(this.options.cookiePath);
                    log.info('(-/5) Cookie 文件非法，自动登录失败');
                    this.emit('cookie-invalid');
                }
            }
            log.info('(0/5) 开始登录，准备下载二维码');

            // Step0: prepare cookies, pgv_info and pgv_pvid
            // http://pingjs.qq.com/tcss.ping.js  tcss.run & _cookie.init
            const initCookies = {
                pgv_info: `ssid=s${Codec.randPgv()}`,
                pgv_pvid: Codec.randPgv()
            };
            this.client.setCookie(initCookies);
            await this.client.get(URL.loginPrepare);

            // Step1: download QRcode
            let scanSuccess = false;
            let qrCodeExpired = true;
            let ptlogin4URL;  // Scan QR code to get this, useful in Step3
            const quotRegxp = /'[^,]*'/g;

            while (!scanSuccess) {

                const qrCode = await this.client.get({ url: URL.qrcode, responseType: 'arraybuffer' });
                await Utils.writeFileAsync(this.options.qrcodePath, qrCode, 'binary');
                qrCodeExpired = false;
                this.emit('qr', this.options.qrcodePath, qrCode);
                log.info(`(1/5) 二维码下载到 ${this.options.qrcodePath} ，等待扫描`);
                Utils.openFile(this.options.qrcodePath);
                const ptqrloginURL = URL.getPtqrloginURL(this.client.getCookie('qrsig'));

                // Step2: scan QRcode
                while (!scanSuccess && !qrCodeExpired) {
                    const responseBody = await this.client.get({
                        url: ptqrloginURL,
                        headers: { Referer: URL.ptqrloginReferer },
                    });
                    log.debug(responseBody.trim());
                    const arr = responseBody.match(quotRegxp).map(i => i.substring(1, i.length - 1));
                    log.debug('JSONP result matched:\n', JSON.stringify(arr));
                    if (arr[0] === '0') {
                        scanSuccess = true;
                        ptlogin4URL = arr[2];
                    } else if (arr[0] === '65') {
                        qrCodeExpired = true;
                        this.emit('qr-expire');
                        log.info('(1/5) 二维码已失效，重新下载二维码');
                    } else if (arr[0] === '67') {
                        log.info('(1/5) 二维码已扫描，请在手机端确认登录');
                        await Utils.sleep(2000);
                        continue;
                    } await Utils.sleep(2000);
                }
            }
            log.info('(2/5) 二维码认证完成');
            Utils.unlinkAsync(this.options.qrcodePath);

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
        } // ========== label 'beforeGotVfwebqq' ends here ==========

        // Step4: request token 'vfwebqq'
        const vfwebqqResp = await this.client.get({
            url: URL.getVfwebqqURL(this.tokens.ptwebqq),
            headers: { Referer: URL.vfwebqqReferer }
        });
        log.debug(vfwebqqResp);
        try {
            this.tokens.vfwebqq = vfwebqqResp.result.vfwebqq;
            log.info('(4/5) 获取 vfwebqq 成功');
        } catch (err) {
            Utils.unlinkAsync(this.options.cookiePath);
            log.info('(-/5) Cookie 已失效，切换到扫码登录');
            this.emit('cookie-expire');
            return this.login();
        }
        // Step5: psessionid and uin
        const loginStat = await this.client.post({
            url: URL.login2,
            data: {
                ptwebqq: this.tokens.ptwebqq,
                clientid: this.options.app.clientid,
                psessionid: "",
                // TODO: online status
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
            font: this.options.font,
            clientid: this.options.app.clientid,
            psessionid: this.tokens.psessionid
        });
        log.info('(5/5) 获取 psessionid 和 uin 成功');
        const cookie = await this.client.getCookieString();
        Utils.writeFileAsync(this.options.cookiePath, cookie, 'utf-8').then(() => {
            log.info(`保存 Cookie 到 ${this.options.cookiePath}`);
        });
        this.emit('login-success', this.options.cookiePath, cookie);
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

    getAllGroupMembers() {
        return this.group.map(async e => {
            const rawInfo = await this.getGroupInfo(e.code);
            return e.info = rawInfo.result;
        });
    }

    getAllDiscuMembers() {
        return this.discu.map(async e => {
            const rawInfo = await this.getDiscuInfo(e.did);
            return e.info = rawInfo.result;
        });
    }

    getBuddyName(uin) {
        let name = this.buddyNameMap.get(uin);
        if (name) return name;
        this.buddy.marknames.some(e => e.uin == uin ? name = e.markname : false);
        if (!name) this.buddy.info.some(e => e.uin == uin ? name = e.nick : false);
        if (name) this.buddyNameMap.set(uin, name);
        else name = uin;
        return name;
    }

    getDiscuName(did) {
        let name = this.discuNameMap.get(did);
        if (name) return name;
        let discu = this.discu
            .filter(e => e.did == did)
            .pop();
        if (!discu) return did;
        this.discuNameMap.set(did, discu.name);
        return discu.name;
    }

    getDiscuInfo(did) {
        return this.client.get({
            url: URL.discuInfo(did, this.tokens.psessionid, this.tokens.vfwebqq),
            headers: { Referer: URL.referer151105 }
        });
    }

    /**
     * buddy group info including group name and real QQ number
     *
     * @returns  {BuddyGroupMensInfo[]}
     * @memberof QQ
     */
    async getBuddyGroupInfo() {
        log.info('开始获取好友分组与 QQ 号码');
        /**
         * what the fxxk typedef??? fxxk tencent again and again
         * @type {{ec: number, result: Object.<string, {gname: string, mems: BuddyGroupMensInfo}>}}
         */
        const response = await this.client.get({
            url: URL.NumberListInfo(this.client.getCookie('skey')),
            headers: { Referer: URL.refererNumberList }
        });
        // convert that fuzzy object to array
        const result = [];
        for (let key in response.result) {
            const group = response.result[key];
            result.push({
                gname: Utils.unEscapeHtml(group.gname || ''),
                mems: group.mems
            });
        }
        return result;
    }

    /**
     * get real QQ number by remark name/nickname
     * returns -1 -> none matched
     * number -> only one matchs
     * number[] -> 2 or more match
     *
     * @param {any} name 
     * @returns {number|number[]}
     * @memberof QQ
     */
    getBuddyQQNum(name) {
        let result = [];
        for (let buddyGroup of this.buddyGroup) {
            for (let buddy of buddyGroup.mems) {
                if (buddy.name === name) result.push(buddy.uin);
            }
        }
        switch (result.length) {
            case 0: return -1;
            case 1: return result[0];
            default: return result;
        }
    }

    getNameInDiscu(uin, did) {
        const nameKey = `${did}${uin}`;
        let name = this.discuNameMap.get(nameKey);
        if (name) return name;
        let discu = this.discu
            .filter(g => did == g.did)
            .pop();
        if (!discu) return uin;
        discu.info.mem_info.some(i => i.uin == uin ? name = i.nick : false);
        if (name) this.discuNameMap.set(nameKey, name);
        else name = uin; // uin not found. may self or newly added member
        return name;
    }

    getGroupName(gIdOrCode) {
        let name = this.groupNameMap.get(gIdOrCode);
        if (name) return name;
        let group = this.group
            .filter(g => gIdOrCode == g.gid || gIdOrCode == g.code)
            .pop();
        if (!group) return gIdOrCode;
        this.groupNameMap.set(gIdOrCode, group.name);
        return group.name;
    }

    getGroupInfo(code) {
        return this.client.get({
            url: URL.groupInfo(code, this.tokens.vfwebqq),
            headers: { Referer: URL.referer130916 }
        });
    }

    getNameInGroup(uin, gIdOrCode) {
        const nameKey = `${gIdOrCode}${uin}`;
        let name = this.groupNameMap.get(nameKey);
        if (name) return name;
        let group = this.group
            .filter(g => gIdOrCode == g.gid || gIdOrCode == g.code)
            .pop();
        if (!group) return null;
        if (group.info.cards) {
            group.info.cards.some(i => i.muin == uin ? name = i.card : false);
        }
        if (!name && group.info.minfo) group.info.minfo.some(i => i.uin == uin ? name = i.nick : false);
        if (name) this.groupNameMap.set(nameKey, name);
        else name = uin; // uin not found. may self or newly added member
        return name;
    }

    logMessage(msg) {
        const content = msg.result[0].value.content.filter(e => typeof e == 'string').join(' ');
        const { value: { from_uin, send_uin }, poll_type } = msg.result[0];
        switch (poll_type) {
            case 'message':
                log.info(`[新消息] ${this.getBuddyName(from_uin)} | ${content}`);
                break;
            case 'group_message':
                log.info(`[群消息] ${this.getGroupName(from_uin)} : ${this.getNameInGroup(send_uin, from_uin)} | ${content}`);
                break;
            case 'discu_message':
                log.info(`[讨论组] ${this.getDiscuName(from_uin)} : ${this.getNameInDiscu(send_uin, from_uin)} | ${content}`);
                break;
            default:
                log.notice(`未知消息类型 ‘${poll_type}’`);
                break;
        }
    }

    handleMsgRecv(msg) {
        const content = msg.result[0].value.content.filter(e => typeof e == 'string').join(' ');
        const { value: { from_uin, send_uin }, poll_type } = msg.result[0];
        let msgParsed = { content };
        // do not handle messages sent by self
        if (from_uin === this.selfInfo.account || from_uin === this.tokens.uin) return;
        switch (poll_type) {
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
                break;
            default:
                break;
        }
        this.logMessage(msg);
        this.emit('msg', msgParsed, msg);
        this.emit(msgParsed.type, msgParsed, msg);
    }

    async loopPoll() {
        this.emit('start-poll');
        log.info('开始接收消息...');
        let failCnt = 0;
        do {
            let pollBody;
            try {
                pollBody = await this.client.post({
                    url: URL.poll,
                    data: {
                        ptwebqq: this.tokens.ptwebqq,
                        clientid: this.options.app.clientid,
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
                this.emit('polling', pollBody);
                if (failCnt > 0) failCnt = 0;
            } catch (err) {
                log.warning('[loopPoll] Request Failed: ', err);
                if (err.response && err.response.status === 502)
                    log.info(`出现 502 错误 ${++failCnt} 次，正在重试`);
                if (failCnt > 10) {
                    log.error(`服务器 502 错误超过 ${failCnt} 次，连接已断开`);
                    this.emit('disconnect');
                    throw new Error('disconnect');
                }
            } finally {
                log.debug(pollBody);
                switch (pollBody.retcode) {
                    case 0:
                        if (pollBody.result) {
                            try {
                                this.handleMsgRecv(pollBody);
                            } catch (err) {
                                log.error('Error when handling msg: ', pollBody, err);
                                this.emit('error', err);
                            }
                        }
                        break;
                    case 103:
                        await this.getOnlineBuddies();
                        break;
                    case 100001:
                        log.info('登录状态已失效，连接断开');
                        this.emit('disconnect');
                        throw new Error('disconnect');
                    default:
                        log.notice('未知的 retcode: ', pollBody.retcode);
                        log.notice(pollBody);
                        break;
                }
            }
        } while (true);
    }

    async innerSendMsg(url, type, id, content) {
        const resp = await this.client.post({
            url,
            data: this.messageAgent.build(type, id, content),
            headers: { Referer: URL.referer151105 }
        });
        log.debug(resp);
        /* it returns
         * { errmsg: 'error!!!', retcode: 100100 }
         * when success, i don't know why.
         * fxxk tencent
         */
        this.emit('send', resp, { type, id, content });
        // send-buddy, send-discu, send-group
        this.emit(`send-${type}`, resp, { type, id, content });
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
