import * as Axios from 'axios';

interface BaseResponse {
    retcode: Number
    result: any
}

interface UserDetailInfo {
    face: Number,
    birthday: {
        month: Number,
        year: Number,
        day: Number
    },
    occupation: string,
    phone: string,
    allow: Number,
    college: string,
    uin: Number,
    constel: Number,
    blood: Number,
    homepage: string,
    stat: Number,
    vip_info: Number,
    country: string,
    city: string,
    personal: string,
    nick: string,
    shengxiao: Number,
    email: string,
    province: string,
    gender: string,
    mobile: string
}

interface GroupDetailInfo {
    stats: Array<{
        client_type: Number,
        uin: Number,
        stat: Number
    }>,
    minfo: Array<{
        nick: string,
        province: string,
        gender: string,
        uin: Number,
        country: string,
        city: string
    }>,
    ginfo: {
        face: Number,
        memo: string,
        class: Number,
        fingermemo: string,
        code: Number,
        createtime: Number,
        flag: Number,
        level: Number,
        name: string,
        gid: Number,
        owner: Number,
        members: Array<{
            muin: Number,
            mflag: Number
        }>,
        option: Number
    },
    cards: Array<{
        muin: Number,
        card: string
    }>,
    vipinfo: Array<{
        vip_level: Number,
        u: Number,
        is_vip: Number
    }>
}

interface DiscuDetailInfo {
    info: {
        did: Number,
        discu_name: string,
        mem_list: Array<{
            mem_uin: Number,
            ruin: Number
        }>
    },
    mem_info: Array<{
        nick: string,
        uin: Number
    }>,
    mem_status: Array<{
        client_type: Number,
        status: string,
        uin: Number
    }>
}

export class QQ {
    constructor(...handlers: Array<MsgHandler>)
    tokens: {
        uin: string
        ptwebqq: string
        vfwebqq: string
        psessionid: string
    }
    selfInfo: UserDetailInfo
    buddy: {
        friends: Array<{
            flag: Number,
            uin: Number,
            categories: Number
        }>,
        marknames: Array<{
            uin: Number,
            markname: string,
            type: Number
        }>,
        categories: Array<{
            index: Number,
            sort: Number,
            name: string
        }>,
        vipinfo: Array<{
            vip_level: Number,
            u: Number,
            is_vip: Number
        }>,
        info: Array<{
            face: Number,
            flag: Number,
            nick: string,
            uin: Number
        }>
    };
    discu: Array<{
        did: Number
        name: string
    }>
    group: Array<{
        flag: Number
        name: string
        /**
         * use this for send group msg
         */
        gid: Number
        /**
         * use this for get group info
         */
        code: Number
    }>
    run(): Promise<void>
    login(): Promise<void>
    getSelfInfo(): Promise<void>
    getBuddy(): Promise<void>
    getOnlineBuddies(): Promise<void>
    getGroup(): Promise<void>
    getDiscu(): Promise<void>
    initInfo(): Promise<void>
    getBuddyName(uin: Number): string
    getDiscuName(did: Number): string
    getDiscuInfo(uin: Number): Promise<DiscuDetailInfo>
    getNameInDiscu(uin: Number, did: Number): string
    getGroupName(groupCode: Number): string
    getGroupInfo(code: Number): Promise<GroupDetailInfo>
    getNameInGroup(uin: Number, groupCode: Number): string
    logMessage(msg: Object): void
    handelMsgRecv(msg: Object): void
    loopPoll(): Promise<void>
    innerSendMsg(url: string, key: Number, id: Number, content: string): Promise<void>
    sendBuddyMsg(uin: Number | string, content: string): Promise<void>
    sendDiscuMsg(did: Number | string, content: string): Promise<void>
    sendGroupMsg(gid: Number | string, content: string): Promise<void>
}

interface ReceivedMsgType {
    id: Number
    name: string
    type: 'buddy' | 'discu' | 'group'
    content: string
    groupId?: string
    groupName?: string
    disucId?: string
    discuName?: string
}

export class MsgHandler {
    constructor(
        handler: (msg: ReceivedMsgType, qq: QQ) => void,
        ...acceptTypes: Array<'buddy' | 'discu' | 'group'>
    );
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

export function ShortenUrl(urlOrUrls: string | Array<string>): string | Array<string>;
