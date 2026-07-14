const themeConfig = require('../../../config/theme.json');
const db = require('../../../database/db');

module.exports = {
    name: 'antitoxic',
    category: 'admin',
    cooldown: 3,
    async execute(sock, msg, { from, args, isGroup }) {
        if (!isGroup) return sock.sendMessage(from, { text: `${themeConfig.errorEmoji} Hanya untuk grup.` }, { quoted: msg });

        const state = args[0]?.toLowerCase();
        if (state !== 'on' && state !== 'off') {
            return sock.sendMessage(from, { text: `${themeConfig.infoEmoji} Format: .antitoxic on / .antitoxic off` }, { quoted: msg });
        }

        const value = state === 'on' ? 1 : 0;
        await db.updateGroup(from, { antitoxic: value });
        await sock.sendMessage(from, { text: `${themeConfig.successEmoji} Anti-Toxic berhasil diubah menjadi *${state.toUpperCase()}*.` }, { quoted: msg });
    }
};
