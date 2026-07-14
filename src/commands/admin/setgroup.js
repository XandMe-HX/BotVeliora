const db = require('../../../database/db');
const themeConfig = require('../../../config/theme.json');

module.exports = {
    name: 'setgroup',
    aliases: ['registergroup'],
    category: 'owner',
    cooldown: 5,
    async execute(sock, msg, { from, sender, isGroup }) {
        if (!isGroup) {
            return sock.sendMessage(from, { text: `${themeConfig.errorEmoji} Command ini hanya bisa digunakan di dalam grup.` }, { quoted: msg });
        }
        
        try {
            const groupMetadata = await sock.groupMetadata(from);
            const groupName = groupMetadata.subject;
            
            const isNew = await db.setGroup(from, groupName);
            if (isNew) {
                await sock.sendMessage(from, { text: `${themeConfig.successEmoji} Grup *${groupName}* berhasil didaftarkan!\n\nSetting Default:\n- Welcome: ON\n- Intro: ON\n- Anti Link: ON\n- Anti Toxic: ON\n- Event/Boss: ON\n\n${themeConfig.footer}` }, { quoted: msg });
            } else {
                await sock.sendMessage(from, { text: `${themeConfig.infoEmoji} Grup ini sudah terdaftar di database.\n\n${themeConfig.footer}` }, { quoted: msg });
            }
        } catch (err) {
            console.error('[Error setgroup]', err);
            await sock.sendMessage(from, { text: `${themeConfig.errorEmoji} Gagal mendaftarkan grup.` }, { quoted: msg });
        }
    }
}
