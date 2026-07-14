const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const moment = require('moment-timezone');
const logger = require('./logger');

const dbPath = path.resolve(__dirname, '../../database/veliora.db');
const backupDir = path.resolve(__dirname, '../../database/backup');

if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

function backupDatabase() {
    if (!fs.existsSync(dbPath)) return;

    const time = moment().tz('Asia/Jakarta').format('YYYY-MM-DD');
    const backupPath = path.join(backupDir, `veliora-${time}.db`);
    
    try {
        fs.copyFileSync(dbPath, backupPath);
        logger.info(`[Backup] Database backup created: ${backupPath}`);
        
        const files = fs.readdirSync(backupDir);
        files.forEach(file => {
            const filePath = path.join(backupDir, file);
            const stat = fs.statSync(filePath);
            const daysOld = (Date.now() - stat.mtime.getTime()) / (1000 * 60 * 60 * 24);
            if (daysOld > 7) {
                fs.unlinkSync(filePath);
                logger.info(`[Backup] Deleted old backup: ${file}`);
            }
        });
    } catch (err) {
        logger.error('[Backup] Failed to backup database', err);
    }
}

let cronTask = null;

function startAutoBackup() {
    cronTask = cron.schedule('0 3 * * *', () => {
        backupDatabase();
    }, {
        scheduled: true,
        timezone: "Asia/Jakarta"
    });
    logger.info('[Backup] Auto-backup scheduled at 03:00 AM everyday.');
}

function stopBackup() {
    if (cronTask) {
        cronTask.stop();
        cronTask = null;
        logger.info('[Backup] Auto-backup stopped.');
    }
}

module.exports = { startAutoBackup, stopBackup, backupDatabase };
