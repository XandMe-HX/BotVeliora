const { commands } = require('./commandLoader');
const botConfig = require('../../config/bot.json');
const themeConfig = require('../../config/theme.json');
const { findSimilarCommand } = require('../utils/fuzzySearch');
const { isOwner, isAdmin } = require('../middlewares/roleCheck');
const { processGroupModeration } = require('../middlewares/groupMonitor');
const { tebakKataSessions } = require('../utils/gameSessions');
const db = require('../../database/db');
const logger = require('../services/logger');
const chalk = require('chalk');

// In-memory cooldowns to avoid DB IO for fast operations
const cooldowns = new Map();
const expCooldowns = new Map();

async function messageHandler(sock, msg) {
    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const sender = isGroup ? msg.key.participant : from;
    
    // Extract message text (handling different message types)
    const type = Object.keys(msg.message)[0];
    let body = '';
    if (type === 'conversation') {
        body = msg.message.conversation;
    } else if (type === 'extendedTextMessage') {
        body = msg.message.extendedTextMessage.text;
    } else if (type === 'imageMessage' && msg.message.imageMessage.caption) {
        body = msg.message.imageMessage.caption;
    } else if (type === 'videoMessage' && msg.message.videoMessage.caption) {
        body = msg.message.videoMessage.caption;
    }
    
    // Check for prefix
    const prefix = botConfig.prefix;
    const isCmd = body.startsWith(prefix);
    const commandName = isCmd ? body.slice(prefix.length).trim().split(/ +/).shift().toLowerCase() : null;
    const args = body.trim().split(/ +/).slice(1);
    const text = args.join(' ');

    const isUserOwner = isOwner(sender);
    let isUserAdmin = false;

    // Background tasks: Update User EXP if not spamming
    if (sender && !isCmd) { // Only give exp for normal chat
        const user = await db.getUser(sender);
        
        const expKey = `exp_${sender}`;
        const lastExp = expCooldowns.get(expKey);
        const nowExp = Date.now();
        
        if (!lastExp || nowExp - lastExp > 60000) {
            expCooldowns.set(expKey, nowExp);
            
            const gain = Math.floor(Math.random() * 11) + 5;
            let newExp = user.exp + gain;
            let newLevel = user.level;
            let levelUp = false;
            
            let reqExp = newLevel * 100;
            while (newExp >= reqExp) {
                newLevel++;
                newExp -= reqExp;
                reqExp = newLevel * 100;
                levelUp = true;
            }
            
            let updates = { exp: newExp, level: newLevel };
            
            if (levelUp) {
                const nowUnix = Math.floor(Date.now() / 1000);
                const isPremium = user.premium_until > nowUnix;
                const maxLimit = isPremium ? 100 : 50;
                updates.limit_count = maxLimit;
            }
            
            await db.updateUser(sender, updates);
            
            if (levelUp && isGroup) {
                await sock.sendMessage(from, { text: `${themeConfig.successEmoji} 🎉 Selamat @${sender.split('@')[0]}! Kamu telah naik ke *Level ${newLevel}*.\n\nLimit kamu telah dipulihkan.`, mentions: [sender] });
            }
        }
    }

    if (isGroup) {
        await db.setGroup(from, 'Group'); // Default logic, usually would fetch group name
        isUserAdmin = await isAdmin(sock, from, sender);
        
        const groupData = await db.getGroup(from);
        if (groupData) {
            const wasModerated = await processGroupModeration(sock, msg, groupData, body, sender, from);
            if (wasModerated) return;
        }
    }

    // Check Tebak Kata Sessions
    if (tebakKataSessions.has(from) && !isCmd && body) {
        const game = tebakKataSessions.get(from);
        if (body.toLowerCase() === game.jawaban) {
            clearTimeout(game.timer);
            tebakKataSessions.delete(from);
            const user = await db.getUser(sender);
            await db.updateUser(sender, { exp: user.exp + game.reward });
            await sock.sendMessage(from, { text: `${themeConfig.successEmoji} Benar! @${sender.split('@')[0]} mendapatkan ${game.reward} EXP.`, mentions: [sender] }, { quoted: msg });
            return;
        }
    }

    if (!isCmd) return;

    let cmd = commands.get(commandName);

    // Fuzzy search if command not found
    if (!cmd) {
        const similarCmd = findSimilarCommand(commandName);
        if (similarCmd) {
            await sock.sendMessage(from, { text: `Mungkin maksudmu:\n${prefix}${similarCmd}` }, { quoted: msg });
        }
        return;
    }

    // Role check for command
    if (cmd.category === 'owner' && !isUserOwner) {
        return sock.sendMessage(from, { text: `${themeConfig.errorEmoji} Command ini khusus Owner.` }, { quoted: msg });
    }

    if (cmd.category === 'admin' && !isUserOwner && !isUserAdmin) {
        return sock.sendMessage(from, { text: `${themeConfig.errorEmoji} Command ini khusus Admin grup.` }, { quoted: msg });
    }

    // Cooldown check
    if (!isUserOwner) {
        const cdKey = `${sender}_${commandName}`;
        const userCd = cooldowns.get(cdKey);
        const now = Date.now();
        if (userCd && userCd > now) {
            const timeLeft = Math.ceil((userCd - now) / 1000);
            return sock.sendMessage(from, { text: `${themeConfig.warnEmoji} Tunggu ${timeLeft} detik sebelum menggunakan command ini lagi.` }, { quoted: msg });
        }
        // Set cooldown (default 10s if not specified in config)
        const cooldownTime = cmd.cooldown || 10;
        cooldowns.set(cdKey, now + (cooldownTime * 1000));
    }

    // Limit Check
    if (!isUserOwner && !isUserAdmin) {
        const user = await db.getUser(sender);
        if (user.limit_count <= 0) {
            return sock.sendMessage(from, { text: `${themeConfig.errorEmoji} Limit harian kamu sudah habis! \nTingkatkan levelmu atau beli premium untuk menambah limit.` }, { quoted: msg });
        }
        await db.updateUser(sender, { limit_count: user.limit_count - 1 });
    }

    // Execute Command
    try {
        logger.command(sender, commandName, text);
        await cmd.execute(sock, msg, { from, sender, args, text, isGroup, isUserAdmin, isUserOwner });
    } catch (err) {
        logger.error(`Executing ${commandName}:`, err);
        await sock.sendMessage(from, { text: `${themeConfig.errorEmoji} Terjadi kesalahan saat mengeksekusi command.\n\n${themeConfig.footer}` }, { quoted: msg });
    }
}

module.exports = messageHandler;
