# qq-bot-rebown

[![npm version](https://img.shields.io/npm/v/qq-bot-rebown.svg)](https://badge.fury.io/js/qq-bot-rebown)
[![dependencies status](https://david-dm.org/rocket1184/qq-bot-rebown/status.svg)](https://david-dm.org/rocket1184/qq-bot-rebown)

使用  ES7 `async/await` 语法编写的 Web QQ 机器人。

## Features

- 扫码登录
- 密码登录 （powered by [`puppeteer`](https://github.com/GoogleChrome/puppeteer)）
- 使用最近一次登录过的 Cookie 自动登录
- 记录每条收到的消息以及发送者
- 使用 `EventEmitter` 管理事件（登录、消息、断线等）
- 缩短 URL （使用 [t.cn](http://open.weibo.com/wiki/2/short_url/shorten) 短链接服务）
- **对所有数据提供 .d.ts 类型定义**

## RouteMap

- [ ] 发送图片或文件 (WIP)
- [ ] 在群中 @ 群成员 (WIP)

## Usage

### Example

```js
const { QQ } = require('qq-bot-rebown');

// 构造函数可以添加参数
// 详情参阅 [tsd 类型定义文件](./index.d.ts) 中 QQOptions 部分
const qq = new QQ();

// 设置 “收到消息” 事件监听
qq.on('msg', (msg) => {
    console.log(JSON.stringify(msg));
});

// 设置 “收到好友消息” 事件监听
qq.on('buddy', (msg) => {
    qq.sendBuddyMsg(msg.id, `Hello, ${msg.name}`);
});

// 不要忘记启动 :)
qq.run();
```

若系统支持，程序将自动打开二维码，请扫码并允许登录。

### Output

<details>
<summary>v2.0.0+，密码登录</summary>

```
[Sat Jan 20 2018 16:17:38 GMT+0800 (CST)] INFO (-/5) 帐号密码登录
[Sat Jan 20 2018 16:17:50 GMT+0800 (CST)] INFO (-/5) 帐号密码验证成功
[Sat Jan 20 2018 16:17:50 GMT+0800 (CST)] INFO (4/5) 获取 vfwebqq 成功
[Sat Jan 20 2018 16:17:50 GMT+0800 (CST)] INFO (5/5) 获取 psessionid 和 uin 成功
[Sat Jan 20 2018 16:17:50 GMT+0800 (CST)] INFO 开始获取帐号信息及联系人列表
[Sat Jan 20 2018 16:17:50 GMT+0800 (CST)] INFO 保存 Cookie 到 /tmp/no.cookie
[Sat Jan 20 2018 16:17:54 GMT+0800 (CST)] INFO 开始接收消息...
[Sat Jan 20 2018 16:24:38 GMT+0800 (CST)] INFO [Bot601测试群.BetaChat] hello, world
{"content":"hello, world","type":"group","id":3751278540,"name":"BetaChat","groupId":2657590898,"groupName":"Bot601测试群"}
[Sat Jan 20 2018 16:24:49 GMT+0800 (CST)] INFO [BetaChat] 测试一下
{"content":"测试一下","type":"buddy","id":3751278540,"name":"BetaChat"}
[Sat Jan 20 2018 16:24:49 GMT+0800 (CST)] INFO => [BetaChat] Hello, BetaChat
```

</details>

<details>
<summary>v1.0.0+，二维码登录</summary>

```
[Tue Sep 26 2017 19:55:17 GMT+0800 (CST)] INFO (0/5) 开始登录，准备下载二维码
[Tue Sep 26 2017 19:55:18 GMT+0800 (CST)] INFO (1/5) 二维码下载到 /tmp/qq-bot-code.png ，等待扫描
[Tue Sep 26 2017 19:55:37 GMT+0800 (CST)] INFO (2/5) 二维码扫描完成
[Tue Sep 26 2017 19:55:37 GMT+0800 (CST)] INFO (3/5) 获取 ptwebqq 成功
[Tue Sep 26 2017 19:55:37 GMT+0800 (CST)] INFO (4/5) 获取 vfwebqq 成功
[Tue Sep 26 2017 19:55:37 GMT+0800 (CST)] INFO (5/5) 获取 psessionid 和 uin 成功
[Tue Sep 26 2017 19:55:37 GMT+0800 (CST)] INFO 开始获取用户信息
[Tue Sep 26 2017 19:55:37 GMT+0800 (CST)] INFO 保存 Cookie 到 /tmp/my-qq-bot.cookie
[Tue Sep 26 2017 19:55:38 GMT+0800 (CST)] INFO 开始获取好友列表
[Tue Sep 26 2017 19:55:38 GMT+0800 (CST)] INFO 开始获取好友在线状态
[Tue Sep 26 2017 19:55:38 GMT+0800 (CST)] INFO 开始获取讨论组列表
[Tue Sep 26 2017 19:55:38 GMT+0800 (CST)] INFO 开始获取群列表
[Tue Sep 26 2017 19:55:47 GMT+0800 (CST)] INFO 信息初始化完成
[Tue Sep 26 2017 19:55:47 GMT+0800 (CST)] INFO 开始接收消息...
[Tue Sep 26 2017 19:55:56 GMT+0800 (CST)] INFO [群消息] Bot测试群 : Rocka | 测试
{"content":"测试","type":"group","id":4044871627,"name":"Rocka","groupId":2164848864,"groupName":"Bot测试群"}
[Tue Sep 26 2017 19:58:47 GMT+0800 (CST)] INFO [新消息] Pugna | Hello
{"content":"Hello","type":"buddy","id":3249866953,"name":"Pugna"}
[Tue Sep 26 2017 19:58:47 GMT+0800 (CST)] INFO 发消息给好友 Pugna : Hello, Pugna
```

</details>

## Docs

### 事件（Events）列表

Under construction

可先参考 [tsd 类型定义文件](./index.d.ts)

### 短链接 API

```js
const { shortenUrl } = require('qq-bot-rebown');

shortenUrl('https://github.com').then(console.log);
// http://t.cn/RxnlTYR

shortenUrl(['https://gitlab.com', 'https://gist.github.com']).then(console.log);
// [ 'http://t.cn/RhJnX41', 'http://t.cn/amvA44' ]
```
