'use strict';

const { QQ, MsgHandler } = require('.');

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
