const { generateSubMenu } = require('../../utils/formatter');

module.exports = {
    name: 'produk',
    category: 'member',
    cooldown: 10,
    async execute(sock, msg, { from }) {
        const text = generateSubMenu('produk');
        await sock.sendMessage(from, { text }, { quoted: msg });
    }
};
