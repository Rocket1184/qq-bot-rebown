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
    occupation: String,
    phone: String,
    allow: Number,
    college: String,
    uin: Number,
    constel: Number,
    blood: Number,
    homepage: String,
    stat: Number,
    vip_info: Number,
    country: String,
    city: String,
    personal: String,
    nick: String,
    shengxiao: Number,
    email: String,
    province: String,
    gender: String,
    mobile: String
}

interface GroupDetailInfo {
    stats: Array<{
        client_type: Number,
        uin: Number,
        stat: Number
    }>,
    minfo: Array<{
        nick: String,
        province: String,
        gender: String,
        uin: Number,
        country: String,
        city: String
    }>,
    ginfo: {
        face: Number,
        memo: String,
        class: Number,
        fingermemo: String,
        code: Number,
        createtime: Number,
        flag: Number,
        level: Number,
        name: String,
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
        card: String
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
        discu_name: String,
        mem_list: Array<{
            mem_uin: Number,
            ruin: Number
        }>
    },
    mem_info: Array<{
        nick: String,
        uin: Number
    }>,
    mem_status: Array<{
        client_type: Number,
        status: String,
        uin: Number
    }>
}

export class QQ {
    constructor(...handlers: Array<MsgHandler>)
    tokens: {
        uin: String
        ptwebqq: String
        vfwebqq: String
        psessionid: String
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
            markname: String,
            type: Number
        }>,
        categories: Array<{
            index: Number,
            sort: Number,
            name: String
        }>,
        vipinfo: Array<{
            vip_level: Number,
            u: Number,
            is_vip: Number
        }>,
        info: Array<{
            face: Number,
            flag: Number,
            nick: String,
            uin: Number
        }>
    };
    discu: Array<{
        did: Number
        name: String
    }>
    group: Array<{
        flag: Number
        name: String
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
    getBuddyName(uin: Number): String
    getDiscuName(did: Number): String
    getDiscuInfo(uin: Number): Promise<DiscuDetailInfo>
    getNameInDiscu(uin: Number, did: Number): String
    getGroupName(groupCode: Number): String
    getGroupInfo(code: Number): Promise<GroupDetailInfo>
    getNameInGroup(uin: Number, groupCode: Number): String
    logMessage(msg: Object): void
    handelMsgRecv(msg: Object): void
    loopPoll(): Promise<void>
    innerSendMsg(url: String, key: Number, id: Number, content: String): Promise<void>
    sendBuddyMsg(uin: Number | String, content: String): Promise<void>
    sendDiscuMsg(did: Number | String, content: String): Promise<void>
    sendGroupMsg(gid: Number | String, content: String): Promise<void>
}

interface ReceivedMsgType {
    id: Number
    name: String
    type: 'buddy' | 'discu' | 'group'
    content: String
    groupId?: String
    groupName?: String
    disucId?: String
    discuName?: String
}

export class MsgHandler {
    constructor(
        handler: (msg: ReceivedMsgType, qq: QQ) => void,
        ...acceptTypes: Array<'buddy' | 'discu' | 'group'>
    );
}

interface ClientRequestConfig extends Axios.AxiosRequestConfig {
    headers?: {
        Origin?: String,
        Referer?: String
    }
}

export class HttpClient {
    clientHeaders: { Cookie: String, 'User-Agent': String }
    setCookie(arg: String | Object): void
    updateCookie(arg: String | Array<String>): void
    getCookie(key?: String): void
    getCookieString(): String
    static mkFormR(payload: Object): String
    post(config: ClientRequestConfig): Promise<any>
    get(urlOrConfig: String | ClientRequestConfig): Promise<any>
}

export function ShortenUrl(urlOrUrls: String | Array<String>): String | Array<String>;
