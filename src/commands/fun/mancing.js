const themeConfig = require('../../../config/theme.json');
const db = require('../../../database/db');

const fishes = [
    { name: 'Ikan Mas', rarity: 'Common', exp: 15, emoji: '🐟' },
    { name: 'Ikan Lele', rarity: 'Common', exp: 10, emoji: '🐡' },
    { name: 'Ikan Nila', rarity: 'Uncommon', exp: 25, emoji: '🐠' },
    { name: 'Gurita', rarity: 'Rare', exp: 50, emoji: '🐙' },
    { name: 'Hiu Kecil', rarity: 'Epic', exp: 100, emoji: '🦈' },
    { name: 'Paus Biru', rarity: 'Legendary', exp: 300, emoji: '🐋' },
    { name: 'Sampah', rarity: 'Junk', exp: 0, emoji: '🗑️' }
];

function getRandomFish() {
    const rand = Math.random() * 100;
    if (rand < 5) return fishes[5];
    if (rand < 15) return fishes[4];
    if (rand < 35) return fishes[3];
    if (rand < 60) return fishes[2];
    if (rand < 80) return fishes[0];
    if (rand < 95) return fishes[1];
    return fishes[6];
}

module.exports = {
    name: 'mancing',
    category: 'fun',
    cooldown: 5,
    async execute(sock, msg, { from, sender }) {
        const msgRef = await sock.sendMessage(from, { text: `🎣 Sedang mencari spot...` }, { quoted: msg });

        setTimeout(async () => {
            await sock.sendMessage(from, { text: `🎣 Melempar kail...`, edit: msgRef.key });
            
            setTimeout(async () => {
                await sock.sendMessage(from, { text: `🎣 Menunggu...`, edit: msgRef.key });
                
                setTimeout(async () => {
                    const catchResult = getRandomFish();
                    
                    let reply = `${themeConfig.headerPrefix}*[ ᴍᴀɴᴄɪɴɢ ]*\n\n`;
                    reply += `Selamat! Kamu mendapatkan:\n`;
                    reply += `${catchResult.emoji} ${catchResult.name}\n`;
                    reply += `Kelangkaan: ${catchResult.rarity}\n`;
                    reply += `EXP Didapat: ${catchResult.exp}\n\n`;
                    reply += themeConfig.footer;

                    if (catchResult.exp > 0) {
                        const user = await db.getUser(sender);
                        await db.updateUser(sender, { exp: user.exp + catchResult.exp });
                    }

                    await sock.sendMessage(from, { text: reply, edit: msgRef.key });
                }, 2000);
            }, 2000);
        }, 2000);
    }
};
