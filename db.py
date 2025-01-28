import sqlite3
from sqlite3 import Error
from datetime import datetime

def create_connection():
    try:
        conn = sqlite3.connect('database.db')
        return conn
    except Error as e:
        print(e)
        return None

def create_tables():
    conn = create_connection()
    if conn is not None:
        try:
            cursor = conn.cursor()
            
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                username TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                role TEXT NOT NULL,
                balance REAL DEFAULT 0.0
            );
            """)
            
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY,
                user_id INTEGER,
                service TEXT NOT NULL,
                amount REAL NOT NULL,
                commission REAL NOT NULL,
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            );
            """)
            
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS posts (
                id INTEGER PRIMARY KEY,
                user_id INTEGER,
                username TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                likes INTEGER DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users (id)
            );
            """)
            
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS comments (
                id INTEGER PRIMARY KEY,
                post_id INTEGER,
                user_id INTEGER,
                username TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (post_id) REFERENCES posts (id),
                FOREIGN KEY (user_id) REFERENCES users (id)
            );
            """)
            
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS post_likes (
                id INTEGER PRIMARY KEY,
                post_id INTEGER,
                user_id INTEGER,
                FOREIGN KEY (post_id) REFERENCES posts (id),
                FOREIGN KEY (user_id) REFERENCES users (id)
            );
            """)
            
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS bonus_claims (
                id INTEGER PRIMARY KEY,
                user_id INTEGER,
                claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            );
            """)
            
            initial_users = [
                (1, 'admin', 'admin123', 'admin', 0.0), 
                (2, 'user1', 'password123', 'user', 0.0),
                (3, 'user2', 'password123', 'user', 0.0),
                (4, 'user3', 'password123', 'user', 0.0),
                (5, 'user4', 'password123', 'user', 0.0)
            ]
            
            for user in initial_users:
                cursor.execute("""
                INSERT OR IGNORE INTO users (id, username, password, role, balance)
                VALUES (?, ?, ?, ?, ?)
                """, user)
            
            conn.commit()
        except Error as e:
            print(e)
        finally:
            conn.close()

def add_user(username, password):
    conn = create_connection()
    if conn is not None:
        try:
            cursor = conn.cursor()
            cursor.execute(f"SELECT MAX(id) FROM users")
            max_id = cursor.fetchone()[0] or 0
            next_id = max_id + 1
            
            query = f"INSERT INTO users (id, username, password, role, balance) VALUES ({next_id}, '{username}', '{password}', 'user', 0.0)"
            cursor.execute(query)
            conn.commit()
            return True
        finally:
            conn.close()
    return False

def verify_user(username, password):
    conn = create_connection()
    if conn is not None:
        try:
            cursor = conn.cursor()
            query = f"SELECT * FROM users WHERE username = '{username}' AND password = '{password}'"
            cursor.execute(query)
            return cursor.fetchone()
        finally:
            conn.close()
    return None

def get_user_balance(user_id):
    conn = create_connection()
    if conn is not None:
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT balance FROM users WHERE id = ?", (user_id,))
            result = cursor.fetchone()
            return result[0] if result else 0.0
        finally:
            conn.close()
    return 0.0

def update_balance(user_id, new_balance):
    conn = create_connection()
    if conn is not None:
        try:
            cursor = conn.cursor()
            cursor.execute(f"UPDATE users SET balance = {new_balance} WHERE id = {user_id}")
            conn.commit()
            return True
        finally:
            conn.close()
    return False

def add_transaction(user_id, service, amount, commission):
    conn = create_connection()
    if conn is not None:
        try:
            cursor = conn.cursor()
            query = f"INSERT INTO transactions (user_id, service, amount, commission, date) VALUES ({user_id}, '{service}', {amount}, {commission}, '{datetime.now()}')"
            cursor.execute(query)
            conn.commit()
            return True
        finally:
            conn.close()
    return False

def get_admin_stats():
    conn = create_connection()
    if conn is not None:
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'user'")
            total_users = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM transactions")
            total_orders = cursor.fetchone()[0]
            cursor.execute("SELECT SUM(amount) FROM transactions")
            total_revenue = cursor.fetchone()[0] or 0.0
            return {
                'total_users': total_users,
                'total_orders': total_orders,
                'total_revenue': total_revenue
            }
        finally:
            conn.close()
    return {'total_users': 0, 'total_orders': 0, 'total_revenue': 0.0}

def get_recent_transactions():
    conn = create_connection()
    if conn is not None:
        try:
            cursor = conn.cursor()
            query = "SELECT t.*, u.username FROM transactions t JOIN users u ON t.user_id = u.id ORDER BY t.date DESC LIMIT 10"
            cursor.execute(query)
            return cursor.fetchall()
        finally:
            conn.close()
    return []

def add_balance_column():
    conn = create_connection()
    if conn is not None:
        try:
            cursor = conn.cursor()
            cursor.execute("ALTER TABLE users ADD COLUMN balance REAL DEFAULT 0.0")
            conn.commit()
            return True
        except Error as e:
            print(e)
            return False
        finally:
            conn.close()
    return False

def add_post(user_id, username, content):
    conn = create_connection()
    if conn is not None:
        try:
            cursor = conn.cursor()
            query = """
            INSERT INTO posts (user_id, username, content)
            VALUES (?, ?, ?)
            """
            cursor.execute(query, (user_id, username, content))
            conn.commit()
            return True
        finally:
            conn.close()
    return False

def get_all_posts():
    conn = create_connection()
    if conn is not None:
        try:
            cursor = conn.cursor()
            query = "SELECT * FROM posts ORDER BY created_at DESC"
            cursor.execute(query)
            return cursor.fetchall()
        finally:
            conn.close()
    return []

def add_comment(post_id, user_id, username, content):
    conn = create_connection()
    if conn is not None:
        try:
            cursor = conn.cursor()
            query = """
            INSERT INTO comments (post_id, user_id, username, content)
            VALUES (?, ?, ?, ?)
            """
            cursor.execute(query, (post_id, user_id, username, content))
            conn.commit()
            return True
        finally:
            conn.close()
    return False

def get_comments(post_id):
    conn = create_connection()
    if conn is not None:
        try:
            cursor = conn.cursor()
            query = "SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC"
            cursor.execute(query, (post_id,))
            return cursor.fetchall()
        finally:
            conn.close()
    return []

def toggle_like(post_id, user_id):
    conn = create_connection()
    if conn is not None:
        try:
            cursor = conn.cursor()
            cursor.execute("""
            SELECT id FROM post_likes 
            WHERE post_id = ? AND user_id = ?
            """, (post_id, user_id))
            
            existing_like = cursor.fetchone()
            
            if existing_like:
                return False 
            
            cursor.execute("""
            INSERT INTO post_likes (post_id, user_id)
            VALUES (?, ?)
            """, (post_id, user_id))
            
            cursor.execute("""
            UPDATE posts 
            SET likes = (SELECT COUNT(*) FROM post_likes WHERE post_id = ?)
            WHERE id = ?
            """, (post_id, post_id))
            
            conn.commit()
            
            cursor.execute("SELECT likes FROM posts WHERE id = ?", (post_id,))
            return cursor.fetchone()[0]
        finally:
            conn.close()
    return 0

def add_bonus_claim(user_id):
    conn = create_connection()
    if conn is not None:
        try:
            cursor = conn.cursor()
            
            cursor.execute("""
            SELECT id FROM bonus_claims 
            WHERE user_id = ?
            """, (user_id,))
            
            if cursor.fetchone():
                return False
            
            cursor.execute("""
            INSERT INTO bonus_claims (user_id, claimed_at)
            VALUES (?, CURRENT_TIMESTAMP)
            """, (user_id,))
            
            cursor.execute("""
            UPDATE users 
            SET balance = balance + 100 
            WHERE id = ?
            """, (user_id,))
            
            conn.commit()
            
            cursor.execute("SELECT balance FROM users WHERE id = ?", (user_id,))
            return cursor.fetchone()[0]
        finally:
            conn.close()
    return None
