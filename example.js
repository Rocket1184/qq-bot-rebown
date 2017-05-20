'use strict';

const { QQ, MsgHandler } = require('.');
const childProcess = require('child_process');
const fs = require('fs');

function writeFileAsync(filePath, data, options) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, data, options, error => {
            if (error) reject(error);
            resolve();
        });
    });
}

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

const qrcodeHandler = new MsgHandler(
    (msg, qq) => {
      const qrcodePath = '/tmp/code.png';
      await writeFileAsync(qrcodePath, msg.image, 'binary');
      console.log(`二维码下载到 ${qrcodePath} ，等待扫描`);
      // open file, only for linux
      childProcess.exec(`xdg-open ${qrcodePath}`);
    },
    'qrcode'
);

new QQ(buddyHandler, groupHandler, qrcodeHandler).run();
