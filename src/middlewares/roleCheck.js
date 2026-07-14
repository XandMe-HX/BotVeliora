const botConfig = require('../../config/bot.json');

function isOwner(sender) {
    if (!sender) return false;
    return sender.includes(botConfig.ownerNumber);
}

async function isAdmin(sock, jid, sender) {
    if (isOwner(sender)) return true;
    try {
        const groupMetadata = await sock.groupMetadata(jid);
        const participant = groupMetadata.participants.find(p => p.id === sender);
        return participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
    } catch (e) {
        return false;
    }
}

module.exports = { isOwner, isAdmin };
