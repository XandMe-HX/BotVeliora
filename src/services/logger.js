const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const moment = require('moment-timezone');

const logDir = path.resolve(__dirname, '../../logs');

if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

function writeLog(file, data) {
    const time = moment().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss');
    const logData = `[${time}] ${data}\n`;
    fs.appendFileSync(path.join(logDir, file), logData);
}

module.exports = {
    info(msg) {
        console.log(chalk.blue('[INFO]'), msg);
        writeLog('info.log', msg);
    },
    error(msg, err) {
        console.error(chalk.red('[ERROR]'), msg, err || '');
        writeLog('error.log', `${msg} ${err ? err.stack || err : ''}`);
    },
    command(user, cmd, args) {
        console.log(chalk.green('[COMMAND]'), `${user} used ${cmd} ${args}`);
        writeLog('command.log', `${user} -> ${cmd} ${args}`);
    }
};
