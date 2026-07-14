const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const chalk = require('chalk');

const dbPath = path.resolve(__dirname, 'veliora.db');

class Database {
    constructor() {
        this.db = null;
    }

    async init() {
        try {
            const dbDir = path.dirname(dbPath);
            if (!require('fs').existsSync(dbDir)) {
                require('fs').mkdirSync(dbDir, { recursive: true });
            }

            this.db = await open({
                filename: dbPath,
                driver: sqlite3.Database
            });

            // Enable WAL mode for better concurrency and performance
            await this.db.exec('PRAGMA journal_mode = WAL;');
            await this.db.exec('PRAGMA synchronous = NORMAL;');

            await this.createTables();
            console.log(chalk.green('[DB] Database initialized successfully.'));
        } catch (error) {
            console.error(chalk.red('[DB] Failed to initialize database:'), error);
            process.exit(1);
        }
    }

    async createTables() {
        const query = `
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT,
                exp INTEGER DEFAULT 0,
                level INTEGER DEFAULT 1,
                limit_count INTEGER DEFAULT 10,
                premium_until INTEGER DEFAULT 0,
                warn INTEGER DEFAULT 0,
                created_at INTEGER DEFAULT (strftime('%s', 'now'))
            );

            CREATE TABLE IF NOT EXISTS groups (
                id TEXT PRIMARY KEY,
                name TEXT,
                welcome INTEGER DEFAULT 1,
                intro INTEGER DEFAULT 1,
                antilink INTEGER DEFAULT 1,
                antitoxic INTEGER DEFAULT 1,
                antispam INTEGER DEFAULT 0,
                antisw INTEGER DEFAULT 0,
                boss_reminder INTEGER DEFAULT 1,
                ai_mode INTEGER DEFAULT 0,
                event_mode INTEGER DEFAULT 1,
                created_at INTEGER DEFAULT (strftime('%s', 'now'))
            );

            CREATE TABLE IF NOT EXISTS reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                category TEXT,
                content TEXT,
                status TEXT DEFAULT 'pending',
                created_at INTEGER DEFAULT (strftime('%s', 'now'))
            );

            CREATE TABLE IF NOT EXISTS suggestions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                content TEXT,
                status TEXT DEFAULT 'pending',
                created_at INTEGER DEFAULT (strftime('%s', 'now'))
            );

            CREATE TABLE IF NOT EXISTS logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT,
                details TEXT,
                created_at INTEGER DEFAULT (strftime('%s', 'now'))
            );
        `;
        
        await this.db.exec(query);
    }
    
    async getUser(id) {
        let user = await this.db.get('SELECT * FROM users WHERE id = ?', [id]);
        if (!user) {
            await this.db.run('INSERT INTO users (id) VALUES (?)', [id]);
            user = await this.db.get('SELECT * FROM users WHERE id = ?', [id]);
        }
        return user;
    }

    async updateUser(id, data) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const setString = keys.map(k => `${k} = ?`).join(', ');
        
        await this.db.run(`UPDATE users SET ${setString} WHERE id = ?`, [...values, id]);
    }

    async getGroup(id) {
        return await this.db.get('SELECT * FROM groups WHERE id = ?', [id]);
    }

    async setGroup(id, name) {
        const existing = await this.getGroup(id);
        if (!existing) {
            await this.db.run('INSERT INTO groups (id, name) VALUES (?, ?)', [id, name]);
            return true;
        }
        return false;
    }

    async updateGroup(id, data) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const setString = keys.map(k => `${k} = ?`).join(', ');
        
        await this.db.run(`UPDATE groups SET ${setString} WHERE id = ?`, [...values, id]);
    }

    async close() {
        if (this.db) {
            try {
                await this.db.close();
                console.log(require('chalk').green('[DB] Database connection closed.'));
            } catch (err) {
                console.error(require('chalk').red('[DB] Error closing database:'), err);
            }
        }
    }
}

const db = new Database();
module.exports = db;
