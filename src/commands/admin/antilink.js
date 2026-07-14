const themeConfig = require('../../../config/theme.json');
const db = require('../../../database/db');

module.exports = {
    name: 'antilink',
    category: 'admin',
    cooldown: 3,
    async execute(sock, msg, { from, args, isGroup }) {
        if (!isGroup) return sock.sendMessage(from, { text: `${themeConfig.errorEmoji} Hanya untuk grup.` }, { quoted: msg });

        const state = args[0]?.toLowerCase();
        if (state !== 'on' && state !== 'off') {
            return sock.sendMessage(from, { text: `${themeConfig.infoEmoji} Format: .antilink on / .antilink off` }, { quoted: msg });
        }

        const value = state === 'on' ? 1 : 0;
        await db.updateGroup(from, { antilink: value });
        await sock.sendMessage(from, { text: `${themeConfig.successEmoji} Anti-Link berhasil diubah menjadi *${state.toUpperCase()}*.` }, { quoted: msg });
    }
};
