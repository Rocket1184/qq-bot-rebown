# qq-bot-rebown

使用  ES7 `async/await` 语法编写的 Web QQ 机器人。

## Features

 - 扫码登录 ~~目前唯一可用的登录方法~~
 - 记录每条收到的消息以及发送者
 - 可自定义的 `MsgHandler`

## Usage

 1. 下载源码包或克隆 git 仓库
 2. （可选）编辑 `index.js` 文件，加入自定义的 `MsgHandler`。
 3. 运行程序，扫码登录即可

## 自定义 MsgHandler

示列： 编辑 `index.js`

```js
// 引入 MsgHandler 类
const MsgHandler = require('./src/qq/msg-handler');

// 实例化 MsgHandler
const fooHandler = new MsgHandler(
    // 收到消息后的处理函数，可用 async function
    (msg, QQ) => {
        QQ.sendBuddyMsg(msg.id, `Hello ${msg.name}`);
    },
    // 该 handler 可处理的消息类型
    'buddy', 'discu'
);

// 使用自定义 handler 实例化 QQ 并运行
new QQ(fooHandler).run();
```

详细示例请参考 [index.js](./index.js)

## API Reference

```js
class MsgHandler{
    constructor(
        /*
         * 第一个参数 msg 为收到的消息对象。根据发送者的不同，分为三种：
         * 好友消息（buddy）: 
         * {
         *     type: 'buddy'
         *     id: 用户 uin ，发送私聊消息使用，不是 QQ 号
         *     name: 昵称或备注名
         *     content: 消息内容
         * }
         * 讨论组消息（discu）: 
         * {
         *     type: 'discu'
         *     id: 用户 uin ，发送私聊消息使用，不是 QQ 号
         *     name: 昵称
         *     discuId: 讨论组 did
         *     discuName: 讨论组名字
         *     content: 消息内容
         * }
         * 群消息（group）: 
         * {
         *     type: 'group'
         *     id: 用户 uin ，发送私聊消息使用，不是 QQ 号
         *     name: 昵称或群名片
         *     groupId: QQ群 gid ，不是群号
         *     groupName: 群名字
         *     content: 消息内容
         * }
         *
         * 第二个参数 QQ 为当前运行的 QQ 实列，可以使用其中所有方法
         */
        handler: function(msg, QQ),
        /*
         * 此 handler 处理的消息类型，按顺序填写即可
         * 可选 'buddy', 'discu', 'group'
         * 不写的话不会处理任何消息
         */
        ...acceptTypes
    );
}

```

