# qq-bot-rebown

[![npm version](https://img.shields.io/npm/v/qq-bot-rebown.svg)](https://badge.fury.io/js/qq-bot-rebown)
[![dependencies status](https://david-dm.org/rocket1184/qq-bot-rebown/status.svg)](https://david-dm.org/rocket1184/qq-bot-rebown)

使用  ES7 `async/await` 语法编写的 Web QQ 机器人。

## Features

- 扫码登录
- 使用最近一次登录过的 Cookie 自动登录
- 记录每条收到的消息以及发送者
- 使用 `EventEmitter` 管理事件（登录、消息、断线等）
- 缩短 URL （使用 [t.cn](http://open.weibo.com/wiki/2/short_url/shorten) 短链接服务）
- **对所有数据提供 .d.ts 类型定义**

## RouteMap

- [ ] 获取好友的 QQ 号码
- [ ] 发送图片或文件 (WIP)
- [ ] 在群中 @ 群成员 (WIP)

## Usage

```js
const { QQ } = require('qq-bot-rebown');

const qq = new QQ();

// 设置“收到好友消息”事件监听
qq.on('buddy', (msg) => {
    qq.sendBuddyMsg(msg.id, `Hello, ${msg.name}`);
});

// 不要忘记启动 :)
qq.run();
```

更多示例可以查看 [example.js](./example.js)

## Docs

### 事件（Events）列表

Under construction

可先参考 [tsd 类型定义文件](./index.d.ts)

### 短链接 API

```js
const { shortenUrl } = require('qq-bot-rebown');

ShortenUrl('https://github.com').then(console.log);
// http://t.cn/RxnlTYR

ShortenUrl(['https://gitlab.com', 'https://gist.github.com']).then(console.log);
// [ 'http://t.cn/RhJnX41', 'http://t.cn/amvA44' ]
```
