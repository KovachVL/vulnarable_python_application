const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');

function getConnection() {
    return new sqlite3.Database(dbPath);
}

function createTables() {
    const db = getConnection();
    
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            balance REAL DEFAULT 0.0
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY,
            user_id INTEGER,
            service TEXT NOT NULL,
            amount REAL NOT NULL,
            commission REAL NOT NULL,
            date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY,
            user_id INTEGER,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            attachment TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`, (err) => {
            if (err) {
                console.error('Error creating posts table:', err);
            }
        });

        const initialUsers = [
            [1, 'admin', 'admin123', 'admin', 0.0],
            [2, 'user1', 'password123', 'user', 0.0],
            [3, 'user2', 'password123', 'user', 0.0],
            [4, 'user3', 'password123', 'user', 0.0],
            [5, 'user4', 'password123', 'user', 0.0]
        ];

        const stmt = db.prepare(`INSERT OR IGNORE INTO users 
            (id, username, password, role, balance) VALUES (?, ?, ?, ?, ?)`);
            
        initialUsers.forEach(user => stmt.run(user));
        stmt.finalize();
    });

    db.close();
}

function addUser(username, password) {
    return new Promise((resolve, reject) => {
        const db = getConnection();
        
        db.get(`SELECT MAX(id) as maxId FROM users`, [], (err, row) => {
            if (err) {
                db.close();
                return reject(err);
            }

            const nextId = (row.maxId || 0) + 1;
            
            const query = `INSERT INTO users (id, username, password, role, balance) 
                         VALUES (${nextId}, '${username}', '${password}', 'user', 0.0)`;
            
            db.run(query, function(err) {
                db.close();
                if (err) {
                    reject(err);
                } else {
                    resolve(true);
                }
            });
        });
    });
}

function verifyUser(username, password) {
    return new Promise((resolve, reject) => {
        const db = getConnection();
        const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
        db.get(query, (err, row) => {
            db.close();
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

function getUserBalance(userId) {
    return new Promise((resolve, reject) => {
        const db = getConnection();
        const query = `SELECT balance FROM users WHERE id = ${userId}`;
        db.get(query, (err, row) => {
            db.close();
            if (err) {
                reject(err);
            } else {
                resolve(row ? row.balance : 0.0);
            }
        });
    });
}

function updateBalance(userId, newBalance) {
    return new Promise((resolve, reject) => {
        const db = getConnection();
        const query = `UPDATE users SET balance = ${newBalance} WHERE id = ${userId}`;
        db.run(query, function(err) {
            db.close();
            if (err) {
                reject(err);
            } else {
                resolve(true);
            }
        });
    });
}

function addTransaction(userId, service, amount, commission) {
    return new Promise((resolve, reject) => {
        const db = getConnection();
        const query = `INSERT INTO transactions (user_id, service, amount, commission, date) 
                      VALUES (${userId}, '${service}', ${amount}, ${commission}, datetime('now'))`;
        db.run(query, function(err) {
            db.close();
            if (err) {
                reject(err);
            } else {
                resolve(true);
            }
        });
    });
}

function getAdminStats() {
    return new Promise((resolve, reject) => {addUser
        const db = getConnection();
        db.serialize(() => {
            let stats = {};
            
            db.get("SELECT COUNT(*) as count FROM users WHERE role = 'user'", [], (err, row) => {
                if (err) reject(err);
                stats.total_users = row.count;
            });
            
            db.get("SELECT COUNT(*) as count FROM transactions", [], (err, row) => {
                if (err) reject(err);
                stats.total_orders = row.count;
            });
            
            db.get("SELECT SUM(amount) as sum FROM transactions", [], (err, row) => {
                if (err) reject(err);
                stats.total_revenue = row.sum || 0;
                resolve(stats);
            });
        });
        db.close();
    });
}

function getRecentTransactions() {
    return new Promise((resolve, reject) => {
        const db = getConnection();
        const query = `SELECT t.*, u.username 
                      FROM transactions t 
                      JOIN users u ON t.user_id = u.id 
                      ORDER BY t.date DESC`;
        db.all(query, [], (err, rows) => {
            db.close();
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

function getUserProfile(userId) {
    return new Promise((resolve, reject) => {
        const db = getConnection();
        const query = `SELECT id, username, role, balance FROM users WHERE id = ${userId}`;
        db.get(query, (err, row) => {
            db.close();
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

function updatePassword(userId, newPassword) {
    return new Promise((resolve, reject) => {
        const db = getConnection();
        const query = `UPDATE users SET password = '${newPassword}' WHERE id = ${userId}`;
        db.run(query, function(err) {
            db.close();
            if (err) {
                reject(err);
            } else {
                resolve(true);
            }
        });
    });
}

function createPost(userId, title, content, attachment) {
    return new Promise((resolve, reject) => {
        const db = getConnection();
        
        const safeTitle = title.replace(/'/g, "''");
        const safeContent = content.replace(/'/g, "''");
        const safeAttachment = attachment ? attachment.replace(/'/g, "''") : null;

        const query = `INSERT INTO posts (user_id, title, content, attachment) 
                      VALUES (${userId}, '${safeTitle}', '${safeContent}', '${safeAttachment}')`;
        
        console.log('SQL Query:', query);
        
        db.run(query, function(err) {
            db.close();
            if (err) {
                console.error('DB Error:', err);
                reject(err);
            } else {
                resolve(true);
            }
        });
    });
}

function getAllPosts() {
    return new Promise((resolve, reject) => {
        const db = getConnection();
        const query = `
            SELECT p.*, u.username 
            FROM posts p 
            JOIN users u ON p.user_id = u.id 
            ORDER BY p.created_at DESC
        `;
        
        db.all(query, [], (err, rows) => {
            db.close();
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

module.exports = {
    createTables,
    addUser,
    verifyUser,
    getUserBalance,
    updateBalance,
    addTransaction,
    getAdminStats,
    getRecentTransactions,
    getUserProfile,
    updatePassword,
    createPost,
    getAllPosts
}; 