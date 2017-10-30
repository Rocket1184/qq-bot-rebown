import * as Axios from 'axios';

interface BaseResponse {
    retcode: number
    result: any
}

interface UserDetailInfo {
    face: number,
    birthday: {
        month: number,
        year: number,
        day: number
    },
    occupation: string,
    phone: string,
    allow: number,
    college: string,
    uin: number,
    constel: number,
    blood: number,
    homepage: string,
    stat: number,
    vip_info: number,
    country: string,
    city: string,
    personal: string,
    nick: string,
    shengxiao: number,
    email: string,
    province: string,
    gender: string,
    mobile: string
}

interface BubbyGroupMensInfo {
    gname: string
    mems: Array<{ name: string, uin: number }>
}

interface GroupDetailInfo {
    stats: Array<{
        client_type: number,
        uin: number,
        stat: number
    }>,
    minfo: Array<{
        nick: string,
        province: string,
        gender: string,
        uin: number,
        country: string,
        city: string
    }>,
    ginfo: {
        face: number,
        memo: string,
        class: number,
        fingermemo: string,
        code: number,
        createtime: number,
        flag: number,
        level: number,
        name: string,
        gid: number,
        owner: number,
        members: Array<{
            muin: number,
            mflag: number
        }>,
        option: number
    },
    cards: Array<{
        muin: number,
        card: string
    }>,
    vipinfo: Array<{
        vip_level: number,
        u: number,
        is_vip: number
    }>
}

interface DiscuDetailInfo {
    info: {
        did: number,
        discu_name: string,
        mem_list: Array<{
            mem_uin: number,
            ruin: number
        }>
    },
    mem_info: Array<{
        nick: string,
        uin: number
    }>,
    mem_status: Array<{
        client_type: number,
        status: string,
        uin: number
    }>
}

interface QQOptions {
    app?: {
        clientid?: number,
        appid?: number
    },
    font?: {
        name?: string,
        size?: number,
        style?: Array<number> | [0, 0, 0],
        color?: string | '000000'
    },
    /**
     * interval to execute cronJobs. unit in `ms`
     * 
     * @type {number}
     * @memberof QQOptions
     */
    cronTimeout: number,
    cookiePath?: string | '/tmp/qq-bot.cookie',
    qrcodePath?: string | '/tmp/code.png'
}

export class QQ {
    constructor(options: QQOptions)
    options: QQOptions
    tokens: {
        uin: string
        ptwebqq: string
        vfwebqq: string
        psessionid: string
    }
    selfInfo: UserDetailInfo
    buddy: {
        friends: Array<{
            flag: number,
            uin: number,
            categories: number
        }>,
        marknames: Array<{
            uin: number,
            markname: string,
            type: number
        }>,
        categories: Array<{
            index: number,
            sort: number,
            name: string
        }>,
        vipinfo: Array<{
            vip_level: number,
            u: number,
            is_vip: number
        }>,
        info: Array<{
            face: number,
            flag: number,
            nick: string,
            uin: number
        }>
    };
    discu: Array<{
        did: number
        name: string
    }>
    group: Array<{
        flag: number
        name: string
        /**
         * use this for send group msg
         */
        gid: number
        /**
         * use this for get group info
         */
        code: number
    }>
    buddyGroup: Array<BubbyGroupMensInfo>
    buddyNameMap: Map<string, string>
    discuNameMap: Map<string, string>
    groupNameMap: Map<string, string>
    // TODO: HttpClient tsd
    client: any
    // TODO: MessageAgent tsd
    messageAgent: any
    /**
     * true if QQBot still online/trying to online
     */
    isAlive: boolean
    /**
     * functions to exec every `cronTimeout`
     */
    cronJobs: Array<() => Promise<any>>
    run(): Promise<void>
    login(): Promise<void>
    getSelfInfo(): Promise<void>
    getBuddy(): Promise<void>
    getOnlineBuddies(): Promise<void>
    getGroup(): Promise<void>
    getDiscu(): Promise<void>
    getAllGroupMembers(): Promise<void>
    getAllDiscuMembers(): Promise<void>
    initInfo(): Promise<void>
    getBuddyName(uin: number): string
    getDiscuName(did: number): string
    getDiscuInfo(uin: number): Promise<DiscuDetailInfo>
    /**
     * get all buddy and buddy group, including group name and REAL QQ number
     */
    async getBubbyGroupInfo(): Array<BubbyGroupMensInfo>
    /**
     * get REAL QQ number by buddy remark name / nickname
     * priority: remark > nickname
     * it returns array of numbers when 2 or more buddy have same name
     * it returns -1 if none of your buddy's name matchs the given one
     */
    getBuddyQQNum(name: string): number | Array<number> | -1
    getNameInDiscu(uin: number, did: number): string
    getGroupName(gIdOrCode: number): string
    getGroupInfo(code: number): Promise<GroupDetailInfo>
    getNameInGroup(uin: number, gIdOrCode: number): string
    logMessage(msg: Object): void
    handelMsgRecv(msg: Object): void
    loopPoll(): Promise<void>
    innerSendMsg(url: string, key: number, id: number, content: string): Promise<void>
    sendBuddyMsg(uin: number | string, content: string): Promise<void>
    sendDiscuMsg(did: number | string, content: string): Promise<void>
    sendGroupMsg(gid: number | string, content: string): Promise<void>

    on(event: string, listener?: (...args: any[]) => void): void
    /**
     * login start. use `login-success` if u want to catch
     * login success event.
     * 
     * @param {'login'} event 
     * @memberof QQ
     */
    on(event: 'login')
    /**
     * start re-login using cookie
     * 
     * @param {'cookie-relogin'} event 
     * @memberof QQ
     */
    on(event: 'cookie-relogin')
    /**
     * found cookie file but in bad format
     * 
     * @param {'cookie-invalid'} event 
     * @memberof QQ
     */
    on(event: 'cookie-invalid')
    /**
     * QR-Code downloaded, about to scan
     * 
     * @param {'qr'} event 
     * @param {string} qrcodePath /path/to/qrcode.png
     * @param {ArrayBuffer} qrCode binary QR-Code data
     * @memberof QQ
     */
    on(event: 'qr', listener: (qrcodePath: string, qrCode: ArrayBuffer) => void)
    /**
     * QR-Code downloaded, about to scan
     * 
     * @param {'qr'} event 
     * @param {string} qrcodePath /path/to/qrcode.png
     * @param {ArrayBuffer} qrCode binary QR-Code data
     * @memberof QQ
     */
    on(event: 'qr-expire')
    /**
     * re-login using cookie but cookie has expired
     * 
     * @param {'cookie-expire'} event 
     * @memberof QQ
     */
    on(event: 'cookie-expire')
    on(event: 'login-success')
    /**
     * receive a message
     * 
     * @param {'msg'} event 
     * @param {ReceivedMsgType} msgParsed 
     * @param {*} msg unparsed raw polling result
     * @memberof QQ
     */
    on(event: 'msg', listener: (msgParsed: ReceivedMsgType, msg: any) => void)
    /**
     * receive a buddy message
     * 
     * @param {'buddy'} event 
     * @param {ReceivedMsgType} msgParsed 
     * @param {*} msg unparsed raw polling result
     * @memberof QQ
     */
    on(event: 'buddy', listener: (msgParsed: ReceivedMsgType, msg: any) => void)
    /**
     * receive a discu message
     * 
     * @param {'discu'} event 
     * @param {ReceivedMsgType} msgParsed 
     * @param {*} msg unparsed raw polling result
     * @memberof QQ
     */
    on(event: 'discu', listener: (msgParsed: ReceivedMsgType, msg: any) => void)
    /**
     * receive a group message
     * 
     * @param {'group'} event 
     * @param {ReceivedMsgType} msgParsed 
     * @param {*} msg unparsed raw polling result
     * @memberof QQ
     */
    on(event: 'group', listener: (msgParsed: ReceivedMsgType, msg: any) => void)
    /**
     * poll will start
     * 
     * @param {'start-poll'} event 
     * @memberof QQ
     */
    on(event: 'start-poll')
    /**
     * a poll finished
     * 
     * @param {'polling'} event 
     * @param {*} msg unpareed raw polling result
     * @memberof QQ
     */
    on(event: 'polling', listener: (msg: any) => void)
    on(event: 'disconnect')
    /**
     * error when handling messages
     * 
     * @param {'error'} event 
     * @param {Error} err 
     * @memberof QQ
     */
    on(event: 'error', listener: (err: Error) => void)
    /**
     * about to send message
     * 
     * @param {'send'} event 
     * @param {SentMsgType} msg 
     * @memberof QQ
     */
    on(event: 'send', listener: (msg: SentMsgType) => void)
    /**
     * about to send message to buddy
     * 
     * @param {'send-buddy'} event 
     * @param {SentMsgType} msg 
     * @memberof QQ
     */
    on(event: 'send-buddy', listener: (msg: SentMsgType) => void)
    /**
     * about to send message to discu
     * 
     * @param {'send-discu'} event 
     * @param {SentMsgType} msg 
     * @memberof QQ
     */
    on(event: 'send-discu', listener: (msg: SentMsgType) => void)
    /**
     * about to send message to group
     * 
     * @param {'send-group'} event 
     * @param {SentMsgType} msg 
     * @memberof QQ
     */
    on(event: 'send-group', listener: (msg: SentMsgType) => void)
}

interface ReceivedMsgType {
    id: number
    name: string
    type: 'buddy' | 'discu' | 'group'
    content: string
    groupId?: string
    groupName?: string
    disucId?: string
    discuName?: string
}

interface SentMsgType {
    id: number
    type: 'buddy' | 'discu' | 'group'
    content: string
}

interface ClientRequestConfig extends Axios.AxiosRequestConfig {
    headers?: {
        Origin?: string,
        Referer?: string
    }
}

export class HttpClient {
    clientHeaders: { Cookie: string, 'User-Agent': string }
    setCookie(arg: string | Object): void
    updateCookie(arg: string | Array<string>): void
    getCookie(key?: string): void
    getCookiestring(): string
    static mkFormR(payload: Object): string
    post(config: ClientRequestConfig): Promise<any>
    get(urlOrConfig: string | ClientRequestConfig): Promise<any>
}

export function shortenUrl(urlOrUrls: string | Array<string>): string | Array<string>;
