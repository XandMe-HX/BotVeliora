const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const commands = new Map();

async function loadCommands() {
    commands.clear();
    const commandsDir = path.resolve(__dirname, '../commands');
    
    if (!fs.existsSync(commandsDir)) {
        console.log(chalk.yellow('[CommandLoader] Commands directory not found. Creating it...'));
        fs.mkdirSync(commandsDir, { recursive: true });
    }
    
    // Read recursively
    const readDir = (dir) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                readDir(fullPath);
            } else if (file.endsWith('.js')) {
                try {
                    delete require.cache[require.resolve(fullPath)]; // For hot reload
                    const cmd = require(fullPath);
                    if (cmd.name) {
                        commands.set(cmd.name, cmd);
                        if (cmd.aliases && Array.isArray(cmd.aliases)) {
                            cmd.aliases.forEach(alias => commands.set(alias, cmd));
                        }
                    }
                } catch (err) {
                    console.error(chalk.red(`[CommandLoader] Failed to load ${file}:`), err);
                }
            }
        }
    };

    readDir(commandsDir);
    console.log(chalk.green(`[CommandLoader] Loaded ${new Set(Array.from(commands.values())).size} commands.`));
}

module.exports = {
    commands,
    loadCommands
};
