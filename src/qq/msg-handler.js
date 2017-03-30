class MsgHandler {
    constructor(handler, ...acceptType) {
        this.handler = handler;
        this.acceptType = acceptType;
    }

    tryHandle(msg, QQ) {
        if (~this.acceptType.indexOf(msg.type)) {
            this.handler(msg, QQ);
        }
    }
}

module.exports = MsgHandler;
