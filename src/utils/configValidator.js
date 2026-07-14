const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const configDir = path.resolve(__dirname, '../../config');

/**
 * Schema definition for all config files.
 * Each entry: { file, fields: [{ key, type }] }
 * type: 'string' | 'object' | 'array'
 */
const configSchemas = [
    {
        file: 'bot.json',
        fields: [
            { key: 'botName', type: 'string' },
            { key: 'prefix', type: 'string' },
            { key: 'ownerNumber', type: 'string' }
        ]
    },
    {
        file: 'theme.json',
        fields: [
            { key: 'footer', type: 'string' },
            { key: 'headerPrefix', type: 'string' },
            { key: 'menuDivider', type: 'string' },
            { key: 'menuEnd', type: 'string' },
            { key: 'successEmoji', type: 'string' },
            { key: 'errorEmoji', type: 'string' },
            { key: 'warnEmoji', type: 'string' },
            { key: 'infoEmoji', type: 'string' }
        ]
    },
    {
        file: 'menu.json',
        fields: [
            { key: 'greeting', type: 'string' },
            { key: 'commands', type: 'object' },
            { key: 'usage', type: 'string' }
        ]
    },
    {
        file: 'help.json',
        fields: [
            { key: 'content', type: 'string' }
        ]
    },
    {
        file: 'api.json',
        fields: [
            { key: 'aio', type: 'array' },
            { key: 'play', type: 'array' }
        ]
    }
];

/**
 * Validates all config JSON files at startup.
 * If any required field is missing or has wrong type, prints a clear error and halts.
 */
function validateConfigs() {
    const errors = [];

    for (const schema of configSchemas) {
        const filePath = path.join(configDir, schema.file);

        if (!fs.existsSync(filePath)) {
            errors.push(`[ConfigValidator] File not found: config/${schema.file}`);
            continue;
        }

        let config;
        try {
            const raw = fs.readFileSync(filePath, 'utf-8');
            config = JSON.parse(raw);
        } catch (err) {
            errors.push(`[ConfigValidator] Invalid JSON in config/${schema.file}: ${err.message}`);
            continue;
        }

        for (const field of schema.fields) {
            const value = config[field.key];

            if (value === undefined || value === null) {
                errors.push(`[ConfigValidator] Missing required field "${field.key}" in config/${schema.file}`);
                continue;
            }

            if (field.type === 'string' && typeof value !== 'string') {
                errors.push(`[ConfigValidator] Field "${field.key}" in config/${schema.file} must be a string, got ${typeof value}`);
            } else if (field.type === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
                errors.push(`[ConfigValidator] Field "${field.key}" in config/${schema.file} must be an object, got ${Array.isArray(value) ? 'array' : typeof value}`);
            } else if (field.type === 'array' && !Array.isArray(value)) {
                errors.push(`[ConfigValidator] Field "${field.key}" in config/${schema.file} must be an array, got ${typeof value}`);
            }
        }
    }

    if (errors.length > 0) {
        console.error(chalk.red('\n═══════════════════════════════════════════'));
        console.error(chalk.red('  CONFIG VALIDATION FAILED - Bot cannot start'));
        console.error(chalk.red('═══════════════════════════════════════════\n'));
        errors.forEach(err => console.error(chalk.red(`  ✗ ${err}`)));
        console.error(chalk.red('\nFix the issues above and restart the bot.\n'));
        process.exit(1);
    }

    console.log(chalk.green('[ConfigValidator] All configs validated.'));
}

module.exports = { validateConfigs };
