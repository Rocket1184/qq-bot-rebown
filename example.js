'use strict';

const { QQ } = require('.');

const qq = new QQ();

qq.on('msg', (msg) => {
    console.log(JSON.stringify(msg));
});

qq.on('buddy', (msg) => {
    qq.sendBuddyMsg(msg.id, `Hello, ${msg.name}`);
});

qq.run();
