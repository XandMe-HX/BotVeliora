const db = require('../../database/db');
const toxicWords = require('../../config/toxicWords.json');
const themeConfig = require('../../config/theme.json');
const { isAdmin, isOwner } = require('./roleCheck');

async function processGroupModeration(sock, msg, groupData, text, sender, from) {
    if (!text || isOwner(sender)) return false; 
    
    const userIsAdmin = await isAdmin(sock, from, sender);
    if (userIsAdmin) return false;

    // Anti-Toxic
    if (groupData.antitoxic) {
        const isToxic = toxicWords.some(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'i');
            return regex.test(text);
        });

        if (isToxic) {
            await sock.sendMessage(from, { delete: msg.key });
            await sock.sendMessage(from, { text: `${themeConfig.warnEmoji} @${sender.split('@')[0]} Jangan menggunakan kata-kata kasar!`, mentions: [sender] });
            
            // Add Warn
            const user = await db.getUser(sender);
            const newWarn = (user.warn || 0) + 1;
            await db.updateUser(sender, { warn: newWarn });
            
            if (newWarn >= 3) {
                await sock.groupParticipantsUpdate(from, [sender], "remove");
                await db.updateUser(sender, { warn: 0 });
                await sock.sendMessage(from, { text: `${themeConfig.successEmoji} @${sender.split('@')[0]} berhasil dikeluarkan dari grup karena akumulasi warn.`, mentions: [sender] });
            }
            return true;
        }
    }

    // Anti-Link
    if (groupData.antilink) {
        const linkRegex = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi;
        
        if (linkRegex.test(text)) {
            await sock.sendMessage(from, { delete: msg.key });
            await sock.sendMessage(from, { text: `${themeConfig.warnEmoji} @${sender.split('@')[0]} Dilarang mengirim link!`, mentions: [sender] });
            return true;
        }
    }

    return false;
}

module.exports = { processGroupModeration };
