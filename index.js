'use strict';

const Log = require('log');

global.log = new Log(process.env.LOG_LEVEL || 'info');

const QQ = require('./src/qq');

new QQ().login();