const themeConfig = require('../../../config/theme.json');
const db = require('../../../database/db');

module.exports = {
    name: 'kick',
    category: 'admin',
    cooldown: 3,
    async execute(sock, msg, { from, sender, args, isGroup }) {
        if (!isGroup) {
            return sock.sendMessage(from, { text: `${themeConfig.errorEmoji} Command ini hanya untuk grup.` }, { quoted: msg });
        }

        let target = null;
        if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
            target = msg.message.extendedTextMessage.contextInfo.participant;
        }

        if (!target) {
            return sock.sendMessage(from, { text: `${themeConfig.errorEmoji} Silakan tag atau reply pesan orang yang ingin di-kick.` }, { quoted: msg });
        }

        const reason = args.join(' ') || 'Melanggar aturan grup';

        const groupMetadata = await sock.groupMetadata(from);
        const participant = groupMetadata.participants.find(p => p.id === target);
        if (participant && (participant.admin === 'admin' || participant.admin === 'superadmin')) {
            return sock.sendMessage(from, { text: `${themeConfig.errorEmoji} Anda tidak dapat me-remove Admin.` }, { quoted: msg });
        }

        try {
            await sock.groupParticipantsUpdate(from, [target], "remove");
            
            const logDetails = JSON.stringify({ user: target, admin: sender, reason });
            await db.db.run('INSERT INTO logs (type, details) VALUES (?, ?)', ['kick', logDetails]);

            await sock.sendMessage(from, { text: `${themeConfig.successEmoji} @${target.split('@')[0]} berhasil dikeluarkan dari grup.\nAlasan: ${reason}`, mentions: [target] });
        } catch (err) {
            console.error('[Kick] Failed:', err);
            await sock.sendMessage(from, { text: `${themeConfig.errorEmoji} Gagal mengeluarkan member. Pastikan bot adalah Admin grup.` });
        }
    }
};
