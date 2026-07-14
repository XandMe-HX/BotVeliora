const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { Sticker, createSticker, StickerTypes } = require('wa-sticker-formatter');
const themeConfig = require('../../../config/theme.json');

module.exports = {
    name: 'sticker',
    aliases: ['s'],
    category: 'maker',
    cooldown: 5,
    async execute(sock, msg, { from, isGroup }) {
        const isImage = msg.message?.imageMessage;
        const isQuotedImage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;

        if (!isImage && !isQuotedImage) {
            return sock.sendMessage(from, { text: `${themeConfig.errorEmoji} Kirim atau balas gambar dengan caption .sticker` }, { quoted: msg });
        }

        await sock.sendMessage(from, { text: `${themeConfig.infoEmoji} Sedang membuat sticker...` }, { quoted: msg });

        try {
            const messageToDownload = isQuotedImage 
                ? { message: msg.message.extendedTextMessage.contextInfo.quotedMessage } 
                : msg;
            
            const buffer = await downloadMediaMessage(
                messageToDownload,
                'buffer',
                {},
                { 
                    logger: console,
                    reuploadRequest: sock.updateMediaMessage
                }
            );

            const sticker = new Sticker(buffer, {
                pack: 'XandMe Studio',
                author: '+62 856-0491-3634\n+62 857-3972-3400',
                type: StickerTypes.FULL,
                quality: 70
            });

            const stickerBuffer = await sticker.toBuffer();

            await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: msg });

            if (isGroup) {
                try {
                    await sock.sendMessage(from, { delete: msg.key });
                } catch(e) {}
            }

        } catch (err) {
            console.error('[Error sticker]', err);
            await sock.sendMessage(from, { text: `${themeConfig.errorEmoji} Gagal membuat sticker.` }, { quoted: msg });
        }
    }
};
