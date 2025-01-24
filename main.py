from flask import Flask, render_template, request, redirect, url_for, session, jsonify
import db

app = Flask(__name__)
app.secret_key = "123"

@app.route('/')
def main():
    return render_template('index.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/registration', methods=['GET', 'POST'])
def registration():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        if db.add_user(username, password):
            return redirect(url_for('login'))
        else:
            return "Registration failed. Username might already exist."
            
    return render_template('registration.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        user = db.verify_user(username, password)
        
        if user:
            session['logged_in'] = True
            session['username'] = username
            session['user_id'] = user[0]
            session['role'] = user[3]
            
            if user[3] == 'admin':
                return redirect(url_for('admin_panel'))
            else:
                return redirect(url_for('user_panel'))
                
        return "Invalid credentials"
        
    return render_template('login.html')

@app.route('/admin_panel')
def admin_panel():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    stats = db.get_admin_stats()
    transactions = db.get_recent_transactions()
    
    return render_template('admin_panel.html',
                         total_users=stats['total_users'],
                         total_orders=stats['total_orders'],
                         total_revenue=stats['total_revenue'],
                         transactions=transactions)

@app.route('/user_panel')
def user_panel():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    
    balance = db.get_user_balance(session['user_id'])
    return render_template('user_panel.html', balance=balance)

@app.route('/api/claim_bonus', methods=['POST'])
def claim_bonus():
    if not session.get('logged_in'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = session['user_id']
    new_balance = db.add_bonus_claim(user_id)
    
    if new_balance is False:
        return jsonify({'error': 'Bonus already claimed'}), 400
    elif new_balance is None:
        return jsonify({'error': 'Failed to claim bonus'}), 500
        
    return jsonify({'balance': new_balance})

@app.route('/api/purchase_service', methods=['POST'])
def purchase_service():
    if not session.get('logged_in'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    service_name = data.get('service')
    price = data.get('price')
    
    user_id = session['user_id']
    current_balance = db.get_user_balance(user_id)
    
    if current_balance >= price:
        new_balance = current_balance - price
        commission = price * 0.1
        
        db.update_balance(user_id, new_balance)
        db.add_transaction(user_id, service_name, price, commission)
        return jsonify({'balance': new_balance})
            
    return jsonify({'error': 'Insufficient funds'}), 400

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('main'))

@app.route('/profile')
def profile():
    user_id = request.args.get('id')
    
    conn = db.create_connection()
    cursor = conn.cursor()
    
    query = f"SELECT * FROM users WHERE id = {user_id}"
    cursor.execute(query)
    user = cursor.fetchone()
    
    if user:
        user_data = {
            'id': user[0],
            'username': user[1],
            'role': user[3],
            'balance': user[4]
        }
        return render_template('profile.html', user_data=user_data)
    
    return "User not found", 404

@app.route('/change_password', methods=['POST'])
def change_password():
    user_id = request.form.get('user_id')
    new_password = request.form.get('new_password')
    
    conn = db.create_connection()
    cursor = conn.cursor()
    query = f"UPDATE users SET password = '{new_password}' WHERE id = {user_id}"
    cursor.execute(query)
    conn.commit()
    
    return redirect(f'/profile?id={user_id}')

@app.route('/posts')
def posts():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    posts = db.get_all_posts()
    posts_with_comments = []
    for post in posts:
        comments = db.get_comments(post[0])
        posts_with_comments.append((post, comments))
    return render_template('posts.html', posts=posts_with_comments)

@app.route('/api/add_post', methods=['POST'])
def add_post():
    if not session.get('logged_in'):
        return jsonify({'error': 'Unauthorized'}), 401
    data = request.get_json()
    content = data.get('content')
    if not content:
        return jsonify({'error': 'Content is required'}), 400
        
    if db.add_post(session['user_id'], session['username'], content):
        return jsonify({'success': True})
    
    return jsonify({'error': 'Failed to add post'}), 500

@app.route('/api/add_comment', methods=['POST'])
def add_comment():
    if not session.get('logged_in'):
        return jsonify({'error': 'Unauthorized'}), 401
        
    data = request.get_json()
    post_id = data.get('post_id')
    content = data.get('content')
    
    if not content or not post_id:
        return jsonify({'error': 'Missing required fields'}), 400
        
    if db.add_comment(post_id, session['user_id'], session['username'], content):
        return jsonify({'success': True})
    
    return jsonify({'error': 'Failed to add comment'}), 500

@app.route('/api/like_post', methods=['POST'])
def like_post():
    if not session.get('logged_in'):
        return jsonify({'error': 'Unauthorized'}), 401
        
    data = request.get_json()
    post_id = data.get('post_id')
    
    if not post_id:
        return jsonify({'error': 'Missing post_id'}), 400
        
    new_likes = db.toggle_like(post_id, session['user_id'])
    if new_likes is False:
        return jsonify({'error': 'Already liked'}), 400
        
    return jsonify({'likes': new_likes})

if __name__ == '__main__':
    db.create_tables()
    db.add_balance_column()
    app.run(host='0.0.0.0', port=5000, debug=True)