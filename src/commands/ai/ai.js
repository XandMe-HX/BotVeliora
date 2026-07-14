const apiManager = require('../../api/apiManager');
const db = require('../../../database/db');
const themeConfig = require('../../../config/theme.json');
const { isOwner, isAdmin } = require('../../middlewares/roleCheck');

module.exports = {
    name: 'ai',
    category: 'ai',
    cooldown: 5,
    async execute(sock, msg, { from, sender, text, isGroup }) {
        if (!text) return sock.sendMessage(from, { text: `${themeConfig.errorEmoji} Masukkan pertanyaan.\nContoh: .ai Siapa presiden Indonesia?` }, { quoted: msg });

        let canUseAI = isOwner(sender);
        
        if (!canUseAI && isGroup) {
            canUseAI = await isAdmin(sock, from, sender);
        }

        if (!canUseAI) {
            const user = await db.getUser(sender);
            const now = Math.floor(Date.now() / 1000);
            if (user.premium_until > now) {
                canUseAI = true;
            }
        }

        if (!canUseAI) {
            return sock.sendMessage(from, { text: `${themeConfig.errorEmoji} Fitur AI hanya untuk Owner, Admin Grup, dan member Premium.` }, { quoted: msg });
        }

        await sock.sendMessage(from, { text: `${themeConfig.infoEmoji} Sedang berpikir...` }, { quoted: msg });

        try {
            const apiConfig = require('../../../config/api.json');
            const aiUrls = apiConfig.ai || ['https://anabot.my.id/api/ai/gpt4'];
            
            let replyText = '';
            try {
                const res = await apiManager.fetchWithFallback(aiUrls, { prompt: text });
                replyText = res.result || res.answer || res.message || res.data || "Tidak dapat memproses permintaan.";
            } catch (apiErr) {
                replyText = "Maaf, AI sedang offline atau mengalami gangguan.";
            }

            await sock.sendMessage(from, { text: `${themeConfig.headerPrefix}*[ ᴀɪ ]*\n\n${replyText}\n\n${themeConfig.footer}` }, { quoted: msg });
        } catch (err) {
            console.error('[Error ai]', err);
            await sock.sendMessage(from, { text: `${themeConfig.errorEmoji} Terjadi kesalahan internal AI.` }, { quoted: msg });
        }
    }
};
