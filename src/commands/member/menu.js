const themeConfig = require('../../../config/theme.json');
const menuConfig = require('../../../config/menu.json');
const db = require('../../../database/db');

module.exports = {
    name: 'menu',
    aliases: ['m'],
    category: 'member',
    cooldown: 5,
    async execute(sock, msg, { from, sender }) {
        const user = await db.getUser(sender);
        
        const date = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        let text = `${menuConfig.greeting.replace('%name%', user.name || 'Kak')}\n`;
        text += `Tanggal: ${date}\n\n`;
        
        text += `${themeConfig.headerPrefix}*[ ᴍᴇɴᴜ ]*\n`;
        
        for (const key in menuConfig.commands) {
            text += `${themeConfig.menuDivider}${menuConfig.commands[key]}\n`;
        }
        
        text += `${themeConfig.menuEnd}\n\n`;
        text += `${menuConfig.usage}\n\n`;
        text += themeConfig.footer;
        
        await sock.sendMessage(from, { text }, { quoted: msg });
    }
}
