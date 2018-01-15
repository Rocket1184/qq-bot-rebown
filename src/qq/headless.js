'use strict';

const Log = require('log');
const log = global.log || new Log(process.env.LOG_LEVEL || 'info');

const Utils = require('../utils');
const Puppeteer = require('puppeteer');

async function click(frame, selector) {
    const elm = await frame.$(selector);
    elm.click();
}

async function getTokens(u, p) {
    log.debug('Launching browser...');
    const browser = await Puppeteer.launch({
        args: ['--no-sandbox'],
        headless: process.env.HEADLESS_DEBUG !== 'true'
    });
    const page = await browser.newPage();
    log.debug('Going to QZone login page...');
    await page.goto('https://m.qzone.com/', { waitUntil: 'domcontentloaded' });
    log.debug('Typing username and password...');
    await page.type('#u', `${u}`, { delay: 120 });
    await page.type('#p', `${p}`, { delay: 120 });
    log.debug('Clicking Login...');
    await page.click('#go');
    log.debug('Waiting for redirection...');
    await page.waitFor('#container');
    log.debug('Going to WebQQ login page...');
    await page.goto('https://w.qq.com/');
    log.debug('Waiting for redirection...');
    await page.waitFor('#main_container');
    log.debug('Waiting for contacts to be loaded...');
    await page.waitFor('li.list_item');
    log.debug('Getting tokens...');
    const vfwebqq = await page.evaluate('mq.vfwebqq');
    const ptwebqq = await page.evaluate('mq.ptwebqq');
    const psessionid = await page.evaluate('mq.psessionid');
    const cookies = await page.cookies('https://w.qq.com', 'https://web2.qq.com');
    const cookieStr = cookies.reduce((str, ck) => `${str}${ck.name}=${ck.value}; `, '');
    await browser.close();
    const tokens = {
        vfwebqq,
        ptwebqq,
        psessionid,
        cookieStr
    };
    log.debug(tokens);
    return tokens;
}

module.exports = {
    getTokens
};
