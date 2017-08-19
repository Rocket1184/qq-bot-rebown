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
    run(): Promise<void>
    login(): Promise<void>
    getSelfInfo(): Promise<void>
    getBuddy(): Promise<void>
    getOnlineBuddies(): Promise<void>
    getGroup(): Promise<void>
    getDiscu(): Promise<void>
    initInfo(): Promise<void>
    getBuddyName(uin: number): string
    getDiscuName(did: number): string
    getDiscuInfo(uin: number): Promise<DiscuDetailInfo>
    getNameInDiscu(uin: number, did: number): string
    getGroupName(groupCode: number): string
    getGroupInfo(code: number): Promise<GroupDetailInfo>
    getNameInGroup(uin: number, groupCode: number): string
    logMessage(msg: Object): void
    handelMsgRecv(msg: Object): void
    loopPoll(): Promise<void>
    innerSendMsg(url: string, key: number, id: number, content: string): Promise<void>
    sendBuddyMsg(uin: number | string, content: string): Promise<void>
    sendDiscuMsg(did: number | string, content: string): Promise<void>
    sendGroupMsg(gid: number | string, content: string): Promise<void>
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
