'use strict';

const fs = require('fs');
const http = require('http');
const { QQ } = require('.');

const qq = new QQ({ cookiePath: '/tmp/qq-bot/cookie.txt' });

const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/code') {
        fs.createReadStream(qq.options.qrcodePath).pipe(res);
    }
})

qq.on('msg', (msg) => {
    console.log(JSON.stringify(msg));
})

qq.on('buddy', (msg) => {
    qq.sendBuddyMsg(msg.id, `Hello, ${msg.name}`);
});

qq.run();
