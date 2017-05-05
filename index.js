'use strict';

const QQ = require('./src/qq');
const MsgHandler = require('./src/qq/msg-handler');

const buddyHandler = new MsgHandler(
    (msg, qq) => {
        qq.sendBuddyMsg(msg.id, `Hello ${msg.name}`);
    },
    'buddy'
);

const groupHandler = new MsgHandler(
    msg => {
        console.log(`HandlerTest: ${JSON.stringify(msg, null, 4)}`);
    }, 'buddy', 'discu', 'group'
);

new QQ(buddyHandler, groupHandler).run();
