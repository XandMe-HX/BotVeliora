const apiManager = require('../../api/apiManager');
const apiConfig = require('../../../config/api.json');
const themeConfig = require('../../../config/theme.json');

module.exports = {
    name: 'aio',
    category: 'download',
    cooldown: 10,
    async execute(sock, msg, { from, text }) {
        if (!text) return sock.sendMessage(from, { text: `${themeConfig.errorEmoji} Masukkan link.\nContoh: .aio https://tiktok.com/...` }, { quoted: msg });

        await sock.sendMessage(from, { text: `${themeConfig.infoEmoji} Sedang mengunduh...` }, { quoted: msg });

        try {
            const res = await apiManager.fetchWithFallback(apiConfig.aio, { url: text });
            
            if (!res || !res.status || !res.result) {
                return sock.sendMessage(from, { text: `${themeConfig.errorEmoji} Gagal mengunduh media dari link tersebut.` }, { quoted: msg });
            }

            const data = Array.isArray(res.result) ? res.result[0] : res.result;
            
            if (data.type === 'video' || text.includes('tiktok') || text.includes('instagram')) {
                 await sock.sendMessage(from, { video: { url: data.url }, caption: `${themeConfig.successEmoji} Berhasil diunduh!\n\n${themeConfig.footer}` }, { quoted: msg });
            } else if (data.type === 'image') {
                 await sock.sendMessage(from, { image: { url: data.url }, caption: `${themeConfig.successEmoji} Berhasil diunduh!\n\n${themeConfig.footer}` }, { quoted: msg });
            } else {
                 await sock.sendMessage(from, { document: { url: data.url }, mimetype: 'application/octet-stream', fileName: data.title || 'download', caption: `${themeConfig.successEmoji} Berhasil diunduh!\n\n${themeConfig.footer}` }, { quoted: msg });
            }
        } catch (err) {
            console.error('[Error aio]', err);
            await sock.sendMessage(from, { text: `${themeConfig.errorEmoji} Layanan sedang mengalami gangguan. Silakan coba lagi beberapa saat.\n\n${themeConfig.footer}` }, { quoted: msg });
        }
    }
};
