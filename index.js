'use strict';

const Log = require('log');

global.log = new Log(process.env.LOG_LEVEL || 'info');

const QQ = require('./src/qq');
const MsgHandler = require('./src/qq/msg-handler');

const myHandler = new MsgHandler(
    msg => {
        console.log(`HandlerTest: ${JSON.stringify(msg, null, 4)}`);
    },
    'buddy', 'discu', 'group'
);

new QQ(myHandler).run();
