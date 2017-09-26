'use strict';

const { QQ } = require('.');
const qq = new QQ({ cookiePath: '/tmp/my-qq-bot.cookie' });

qq.on('msg', (msg) => {
    console.log(JSON.stringify(msg));
});

qq.on('buddy', (msg) => {
    qq.sendBuddyMsg(msg.id, `Hello, ${msg.name}`);
});

qq.run();
