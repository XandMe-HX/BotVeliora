const helpConfig = require('../../../config/help.json');
const themeConfig = require('../../../config/theme.json');

module.exports = {
    name: 'help',
    category: 'member',
    cooldown: 10,
    async execute(sock, msg, { from }) {
        const text = `${helpConfig.content}\n\n${themeConfig.footer}`;
        await sock.sendMessage(from, { text }, { quoted: msg });
    }
};
