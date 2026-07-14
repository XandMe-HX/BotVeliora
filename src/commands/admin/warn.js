const db = require('../../../database/db');
const themeConfig = require('../../../config/theme.json');

module.exports = {
    name: 'warn',
    category: 'admin',
    cooldown: 3,
    async execute(sock, msg, { from, sender, args, isGroup }) {
        if (!isGroup) {
            return sock.sendMessage(from, { text: `${themeConfig.errorEmoji} Command ini hanya untuk grup.` }, { quoted: msg });
        }

        // Get target (mention or reply)
        let target = null;
        if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
            target = msg.message.extendedTextMessage.contextInfo.participant;
        }

        if (!target) {
            return sock.sendMessage(from, { text: `${themeConfig.errorEmoji} Silakan tag atau reply pesan orang yang ingin di-warn.` }, { quoted: msg });
        }

        const reason = args.join(' ') || 'Melanggar aturan grup';

        // Check if target is admin
        const groupMetadata = await sock.groupMetadata(from);
        const participant = groupMetadata.participants.find(p => p.id === target);
        if (participant && (participant.admin === 'admin' || participant.admin === 'superadmin')) {
            return sock.sendMessage(from, { text: `${themeConfig.errorEmoji} Anda tidak dapat memberikan warn kepada Admin.` }, { quoted: msg });
        }

        // Get user data
        const user = await db.getUser(target);
        const newWarn = (user.warn || 0) + 1;

        // Update DB
        await db.updateUser(target, { warn: newWarn });

        // Insert to logs
        const logDetails = JSON.stringify({ user: target, admin: sender, reason });
        await db.db.run('INSERT INTO logs (type, details) VALUES (?, ?)', ['warn', logDetails]);

        if (newWarn >= 3) {
            await sock.sendMessage(from, { text: `${themeConfig.warnEmoji} @${target.split('@')[0]} telah mencapai 3 Warn. Melakukan Auto-Kick...`, mentions: [target] });
            
            try {
                await sock.groupParticipantsUpdate(from, [target], "remove");
                await db.updateUser(target, { warn: 0 });
                await sock.sendMessage(from, { text: `${themeConfig.successEmoji} @${target.split('@')[0]} berhasil dikeluarkan dari grup karena akumulasi warn.`, mentions: [target] });
            } catch (err) {
                console.error('[Auto-Kick] Failed:', err);
                await sock.sendMessage(from, { text: `${themeConfig.errorEmoji} Gagal mengeluarkan member. Pastikan bot adalah Admin grup.` });
            }
        } else {
            await sock.sendMessage(from, { text: `${themeConfig.successEmoji} Warn berhasil ditambahkan ke @${target.split('@')[0]}.\nTotal Warn: ${newWarn}/3\nAlasan: ${reason}\n\n${themeConfig.footer}`, mentions: [target] });
        }
    }
};
