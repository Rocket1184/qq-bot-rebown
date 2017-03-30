class MessageAgent {
    constructor(options) {
        const { clientid, psessionid, font } = options;
        this.msg_id = Date.now() % 10 ** 8;
        this.clientid = clientid || 53999199;
        this.psessionid = psessionid;
        this.font = font || {
            name: '宋体',
            size: 10,
            style: [0, 0, 0],
            color: '000000'
        };
    }

    get defaultMsg() {
        return {
            face: 537,
            clientid: this.clientid,
            msg_id: ++this.msg_id,
            psessionid: this.psessionid
        };
    }

    build(typeOrKeyType, id, content) {
        let msg = {};
        switch (typeOrKeyType) {
            case 'buddy':
            case 'to':
                msg.to = id;
                break;
            case 'group':
            case 'group_uin':
                msg.group_uin = id;
                break;
            case 'discu':
            case 'did':
                msg.did = id;
                break;
        }
        msg.content = JSON.stringify([
            content, ['font', this.font]
        ]);
        msg = Object.assign(msg, this.defaultMsg);
        return msg;
    }
}

module.exports = MessageAgent;
