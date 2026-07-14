const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const pino = require('pino');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const db = require('./database/db');
const messageHandler = require('./src/handlers/messageHandler');
const { loadCommands } = require('./src/handlers/commandLoader');
const { startAutoBackup } = require('./src/services/backup');

const botConfig = require('./config/bot.json');

const sessionDir = path.resolve(__dirname, 'session');

const question = (text) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise(resolve => rl.question(text, (answer) => {
        rl.close();
        resolve(answer);
    }));
};

async function startBot() {
    // Start Services
    startAutoBackup();
    
    // Init DB
    await db.init();
    
    // Load Commands
    await loadCommands();

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    
    console.log(chalk.blue(`[System] using WA v${version.join('.')}, isLatest: ${isLatest}`));

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        generateHighQualityLinkPreview: true,
    });

    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            let number = botConfig.botNumber;
            
            while (!number || number === "628xxx" || number.trim() === "") {
                console.log(chalk.yellow('\n[System] Nomor WhatsApp belum dikonfigurasi di config/bot.json.'));
                const input = await question(chalk.green('Masukkan nomor WhatsApp bot (Contoh awalan negara, misal: 62812345678): '));
                
                const cleaned = input.replace(/[^0-9]/g, '');
                if (cleaned.length < 10) {
                    console.log(chalk.red('[Error] Nomor tidak valid! Pastikan hanya berisi angka dan menyertakan kode negara (misal 62).\n'));
                } else {
                    number = cleaned;
                    botConfig.botNumber = number;
                    fs.writeFileSync(path.resolve(__dirname, 'config/bot.json'), JSON.stringify(botConfig, null, 2));
                    console.log(chalk.blue('[System] Nomor berhasil disimpan ke config/bot.json!\n'));
                }
            }

            try {
                const code = await sock.requestPairingCode(number);
                console.log(chalk.bgGreen.black(` Pairing Code: ${code} `));
            } catch (err) {
                console.error(chalk.red('[Pairing] Error requesting code:'), err);
            }
        }, 3000);
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(chalk.red('[Connection] Closed. Reconnecting:', shouldReconnect));
            if (shouldReconnect) {
                startBot();
            } else {
                console.log(chalk.red('[Connection] Logged out. Please delete session folder and restart.'));
            }
        } else if (connection === 'open') {
            console.log(chalk.green('[Connection] Opened. Bot is online!'));
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        if (m.type !== 'notify') return;
        const msg = m.messages[0];
        if (!msg.message) return;
        if (msg.key && msg.key.fromMe) return;

        try {
            await messageHandler(sock, msg);
        } catch (err) {
            console.error(chalk.red('[Error] Handle Message:'), err);
        }
    });
}

startBot();
