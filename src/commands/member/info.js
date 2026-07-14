const { generateSubMenu } = require('../../utils/formatter');

module.exports = {
    name: 'info',
    category: 'member',
    cooldown: 10,
    async execute(sock, msg, { from }) {
        const text = generateSubMenu('info');
        await sock.sendMessage(from, { text }, { quoted: msg });
    }
};
