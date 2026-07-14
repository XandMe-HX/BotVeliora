const { generateSubMenu } = require('../../utils/formatter');

module.exports = {
    name: 'server',
    category: 'member',
    cooldown: 10,
    async execute(sock, msg, { from }) {
        const text = generateSubMenu('server');
        await sock.sendMessage(from, { text }, { quoted: msg });
    }
};
