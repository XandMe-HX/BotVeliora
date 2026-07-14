const apiManager = require('../../api/apiManager');
const apiConfig = require('../../../config/api.json');
const themeConfig = require('../../../config/theme.json');

module.exports = {
    name: 'play',
    category: 'search',
    cooldown: 10,
    async execute(sock, msg, { from, text }) {
        if (!text) return sock.sendMessage(from, { text: `${themeConfig.errorEmoji} Masukkan judul lagu.\nContoh: .play Alan Walker Faded` }, { quoted: msg });

        await sock.sendMessage(from, { text: `${themeConfig.infoEmoji} Sedang mencari...` }, { quoted: msg });

        try {
            const res = await apiManager.fetchWithFallback(apiConfig.play, { q: text });
            
            if (!res || !res.status || !res.result) {
                return sock.sendMessage(from, { text: `${themeConfig.errorEmoji} Lagu tidak ditemukan.` }, { quoted: msg });
            }

            const data = Array.isArray(res.result) ? res.result[0] : res.result;

            let reply = `${themeConfig.headerPrefix}*[ ʏᴏᴜᴛᴜʙᴇ ᴘʟᴀʏ ]*\n`;
            reply += `${themeConfig.menuDivider}Judul: ${data.title}\n`;
            reply += `${themeConfig.menuDivider}Channel: ${data.channel || data.author}\n`;
            reply += `${themeConfig.menuDivider}Durasi: ${data.duration}\n`;
            reply += `${themeConfig.menuDivider}Link: ${data.url}\n\n`;
            reply += `Silakan pilih format untuk mendownload:\n`;
            reply += `🎵 Ketik: .ytmp3 ${data.url}\n`;
            reply += `🎥 Ketik: .ytmp4 ${data.url}\n\n`;
            reply += themeConfig.footer;

            if (data.thumbnail || data.image) {
                await sock.sendMessage(from, { image: { url: data.thumbnail || data.image }, caption: reply }, { quoted: msg });
            } else {
                await sock.sendMessage(from, { text: reply }, { quoted: msg });
            }
        } catch (err) {
            console.error('[Error play]', err);
            await sock.sendMessage(from, { text: `${themeConfig.errorEmoji} Layanan sedang mengalami gangguan. Silakan coba lagi beberapa saat.\n\n${themeConfig.footer}` }, { quoted: msg });
        }
    }
};
