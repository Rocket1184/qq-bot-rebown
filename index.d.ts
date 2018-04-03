import * as Axios from 'axios';

interface BaseResponse<ResultType> {
    retcode: number,
    result: ResultType
}

interface VfwebqqResult {
    vfwebqq: string
}

interface Login2Result {
    cip: number,
    f: number,
    index: number,
    port: number,
    psessionid: string,
    status: string,
    uin: number,
    user_state: number,
    vfwebqq: string
}

interface UserFriendsResult {
    friends: Array<{
        flag: number,
        uin: number,
        categories: number
    }>,
    marknames: Array<{}>,
    categories: Array<{}>,
    vipinfo: Array<{
        u: number,
        is_vip: 1 | 0,
        vip_level: number
    }>,
    info: Array<{
        face: number,
        flag: number,
        nick: string,
        uin: string
    }>

}

interface GroupListResult {
    gmasklist: Array<any>,
    gnamelist: Array<{
        flag: number,
        name: string,
        gid: number,
        code: number
    }>,
    gmarklist: Array<any>
}

interface DiscuListResult {
    dnamelist: Array<{
        name: string,
        did: number
    }>
}

interface OnlineBuddyResult {
    [index: number]: {
        client_type: number,
        status: string,
        uin: number
    }
}

interface RecentListResult {
    [index: number]: {
        type: 0 | 1 | 2,
        uin: number
    }
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
    gname: string,
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
        appid?: number,
        /** 
         * Login method. Can be `{ QQ.LOGIN.QR | QQ.LOGIN.PWD }` .
         * Using QR Code login at default.
         */
        login?: 0 | 1;
        /**
         * max retry count when sending message.
         * when `retcode !== 0`, should retry. Depends on WebQQ.
         */
        maxSendRetry: 2 | number,
        /**
         * max allow count that "short poll" happens continuously.
         * "short poll" means a poll less than 3000ms and does not contain msg.
         */
        maxShortAllow: 3 | number
    },
    font?: {
        name?: string,
        size?: number,
        style?: Array<number> | [0, 0, 0],
        color?: string | '000000'
    },
    auth?: {
        /** QQ id to use in id/pwd login */
        u: string,
        /** QQ pwd to use in id/pwd login. should NOT encrypt */
        p: string
    },
    cookiePath?: string | '/tmp/qq-bot.cookie',
    qrcodePath?: string | '/tmp/code.png'
}

export class QQ {
    /** login method constants */
    static LOGIN: {
        /** scan QR Code */
        QR: 0,
        /** use id/pwd. specify in constructor. */
        PWD: 1
    }
    constructor(options: QQOptions)
    options: QQOptions
    tokens: {
        uin: string,
        ptwebqq: string,
        vfwebqq: string,
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
        did: number,
        name: string,
        info?: DiscuDetailInfo
    }>
    group: Array<{
        flag: number,
        name: string,
        /**
         * use this for send group msg
         */
        gid: number,
        /**
         * use this for get group info
         */
        code: number,
        info?: GroupDetailInfo
    }>
    client: HttpClient
    messageAgent: MessageAgent
    /**
     * true if QQBot still online/trying to online
     */
    _alive: boolean
    run(): Promise<void>
    login(): Promise<void>
    getSelfInfo(): Promise<UserDetailInfo>
    getBuddy(): Promise<UserFriendsResult>
    getOnlineBuddies(): Promise<OnlineBuddyResult>
    getGroup(): Promise<GroupListResult>
    getDiscu(): Promise<DiscuListResult>
    getBuddyName(uin: number): Promise<string>
    getDiscuName(did: number): Promise<string>
    getDiscuInfo(uin: number): Promise<DiscuDetailInfo>
    getNameInDiscu(uin: number, did: number): Promise<string>
    getGroupName(gIdOrCode: number): Promise<string>
    getGroupInfo(code: number): Promise<GroupDetailInfo>
    getNameInGroup(uin: number, gIdOrCode: number): Promise<string>
    logMessage(msg: Object): void
    handelMsgRecv(msg: Object): Promise<void>
    loopPoll(): Promise<void>
    innerSendMsg(url: string, key: number, id: number, content: string): Promise<boolean>
    sendBuddyMsg(uin: number | string, content: string): Promise<boolean>
    sendDiscuMsg(did: number | string, content: string): Promise<boolean>
    sendGroupMsg(gid: number | string, content: string): Promise<boolean>

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
    id: number,
    name: string,
    type: 'buddy' | 'discu' | 'group',
    content: string,
    groupId?: number,
    groupName?: string,
    discuId?: number,
    discuName?: string
}

interface SentMsgType {
    id: number,
    type: 'buddy' | 'discu' | 'group',
    content: string
}

interface ClientRequestConfig extends Axios.AxiosRequestConfig {
    headers?: {
        Origin?: string,
        Referer?: string
    }
}

interface MessageFont {
    name: string | '宋体',
    size: number | 10,
    style: [number, number, number] | [0, 0, 0],
    color: string | '000000'
}

declare class MessageAgent {
    msg_id: number
    clientid: number | 53999199
    psessionid: string
    font: MessageFont
    readonly defaultMsg: {
        face: 537,
        clientid: number | 53999199,
        msg_id: number,
        psessionid: string
    }
    build(typeOrKeyType, id, content): {
        face: 537,
        clientid: number | 53999199,
        msg_id: number,
        psessionid: string,
        to?: number,
        group_uin?: number,
        did?: number,
        content: string,
        font: MessageFont
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
