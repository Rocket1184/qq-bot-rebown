# qq-bot-rebown

[![npm version](https://img.shields.io/npm/v/qq-bot-rebown.svg)](https://badge.fury.io/js/qq-bot-rebown)
[![dependencies status](https://david-dm.org/rocket1184/qq-bot-rebown/status.svg)](https://david-dm.org/rocket1184/qq-bot-rebown)

使用  ES7 `async/await` 语法编写的 Web QQ 机器人。

## Features

 - 扫码登录 ~~目前唯一可用的登录方法~~
 - 使用最近一次登录过的 Cookie 自动登录
 - 记录每条收到的消息以及发送者
 - 可自定义的 `MsgHandler`
 - 缩短 URL (使用 [t.cn](http://open.weibo.com/wiki/2/short_url/shorten) 短链接服务)
 - **对所有数据提供 .d.ts 类型定义**
### RouteMap
 - 获取人物信息的qq号码
 - 可以发送图片
 - 在群中可以@人发言

## Usage

1. 安装为依赖

```bash
$ npm install qq-bot-rebown -S
```

2. 在脚本中引用

```js
const { QQ } = require('qq-bot-rebown');

// do what you want then...
```

## Docs

### 使用 MsgHandler

```js
// 导入模块
const { QQ, MsgHandler } = require('qq-bot-rebown');

// 实例化 MsgHandler
const fooHandler = new MsgHandler(
    // 收到消息后的处理函数，可用 async function
    (msg, qq) => {
        qq.sendBuddyMsg(msg.id, `Hello ${msg.name}`);
    },
    // 该 handler 可处理的消息类型
    'buddy', 'discu'
);

// 使用自定义 handler 实例化 QQ 并运行
new QQ(fooHandler).run();
```

详细示例请参考 [example.js](./example.js)

### MsgHandler API Reference

```ts
interface ReceivedMsgType {
    id: Number
    name: String
    type: 'buddy' | 'discu' | 'group'
    content: String
    groupId?: String
    groupName?: String
    disucId?: String
    discuName?: String
}

class MsgHandler {
    constructor(
        handler: (msg: ReceivedMsgType, qq: QQ) => void,
        ...acceptTypes: Array<'buddy' | 'discu' | 'group'>
    );
}
```

### 短链接 API

```js
const { ShortenUrl } = require('qq-bot-rebown');

ShortenUrl('https://github.com').then(console.log);
//http://t.cn/RxnlTYR

ShortenUrl(['https://gitlab.com', 'https://gist.github.com']).then(console.log);
// [ 'http://t.cn/RhJnX41', 'http://t.cn/amvA44' ]
```
