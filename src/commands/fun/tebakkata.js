const apiManager = require('../../api/apiManager');
const apiConfig = require('../../../config/api.json');
const themeConfig = require('../../../config/theme.json');
const { tebakKataSessions } = require('../../utils/gameSessions');

module.exports = {
    name: 'tebakkata',
    category: 'fun',
    cooldown: 5,
    async execute(sock, msg, { from, sender }) {
        if (tebakKataSessions.has(from)) {
            return sock.sendMessage(from, { text: `${themeConfig.warnEmoji} Masih ada permainan yang belum selesai di chat ini.` }, { quoted: msg });
        }

        try {
            const res = await apiManager.fetchWithFallback(apiConfig.tebakkata || ['https://anabot.my.id/api/games/fun/tebakkata']);
            if (!res) return sock.sendMessage(from, { text: `${themeConfig.errorEmoji} Gagal memuat game.` }, { quoted: msg });

            const soal = res.result?.soal || res.soal || 'M _ K A _';
            const jawaban = res.result?.jawaban || res.jawaban || 'MAKAN';
            const rewardExp = Math.floor(Math.random() * 50) + 10;
            
            let reply = `${themeConfig.headerPrefix}*[ ᴛᴇʙᴀᴋ ᴋᴀᴛᴀ ]*\n`;
            reply += `Soal: ${soal}\n`;
            reply += `Waktu: 60 Detik\n`;
            reply += `Hadiah: ${rewardExp} EXP\n\n`;
            reply += `Balas atau ketik langsung jawabanmu!\n`;
            reply += themeConfig.footer;

            const sentMsg = await sock.sendMessage(from, { text: reply }, { quoted: msg });

            tebakKataSessions.set(from, {
                jawaban: jawaban.toLowerCase(),
                reward: rewardExp,
                id: sentMsg.key.id,
                timer: setTimeout(async () => {
                    if (tebakKataSessions.has(from)) {
                        tebakKataSessions.delete(from);
                        await sock.sendMessage(from, { text: `${themeConfig.infoEmoji} Waktu habis!\nJawaban yang benar adalah: *${jawaban}*` });
                    }
                }, 60000)
            });
        } catch (err) {
            console.error('[Error tebakkata]', err);
            await sock.sendMessage(from, { text: `${themeConfig.errorEmoji} Gagal memuat game.` }, { quoted: msg });
        }
    }
};
