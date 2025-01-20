const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./db');
const fs = require('fs');
const multer = require('multer');
const { exec } = require('child_process');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('static'));
app.use(session({
    secret: '123',
    resave: false,
    saveUninitialized: true
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/uploads', express.static('uploads'));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = './uploads/';
        if (!fs.existsSync(uploadDir)){
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

app.get('/', (req, res) => {
    res.render('index', { session: req.session });
});

app.get('/about', (req, res) => {
    res.render('about', { session: req.session });
});

app.get('/registration', (req, res) => {
    res.render('registration', { session: req.session });
});

app.post('/registration', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const success = await db.addUser(username, password);
        if (success) {
            res.redirect('/login');
        } else {
            res.status(400).send("Registration failed. Username might already exist.");
        }
    } catch (err) {
        res.status(500).send("Error during registration");
    }
});

app.get('/login', (req, res) => {
    res.render('login', { session: req.session });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const user = await db.verifyUser(username, password);
        if (user) {
            req.session.logged_in = true;
            req.session.username = username;
            req.session.user_id = user.id;
            req.session.role = user.role;
            
            if (user.role === 'admin') {
                res.redirect('/admin_panel');
            } else {
                res.redirect('/user_panel');
            }
        } else {
            res.status(401).send("Invalid credentials");
        }
    } catch (err) {
        res.status(500).send("Error during login");
    }
});

app.get('/admin_panel', async (req, res) => {
    if (!req.session.logged_in || req.session.role !== 'admin') {
        return res.redirect('/login');
    }
    
    try {
        const stats = await db.getAdminStats();
        const transactions = await db.getRecentTransactions();
        res.render('admin_panel', {
            total_users: stats.total_users,
            total_orders: stats.total_orders,
            total_revenue: stats.total_revenue,
            transactions: transactions,
            session: req.session
        });
    } catch (err) {
        res.status(500).send("Error loading admin panel");
    }
});

app.get('/user_panel', async (req, res) => {
    if (!req.session.logged_in) {
        return res.redirect('/login');
    }
    
    try {
        const balance = await db.getUserBalance(req.session.user_id);
        res.render('user_panel', { 
            balance: balance,
            session: req.session
        });
    } catch (err) {
        res.status(500).send("Error loading user panel");
    }
});

app.get('/profile', async (req, res) => {
    if (!req.session.logged_in) {
        return res.redirect('/login');
    }

    const userId = req.query.id;
    try {
        const userData = await db.getUserProfile(userId);
        if (userData) {
            res.render('profile', { 
                user_data: userData,
                session: req.session 
            });
        } else {
            res.status(404).send("User not found");
        }
    } catch (err) {
        res.status(500).send("Error loading profile");
    }
});

// API Routes
app.post('/api/claim_bonus', async (req, res) => {
    if (!req.session.logged_in) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        const currentBalance = await db.getUserBalance(req.session.user_id);
        const newBalance = currentBalance + 100;
        await db.updateBalance(req.session.user_id, newBalance);
        res.json({ balance: newBalance });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/purchase_service', async (req, res) => {
    if (!req.session.logged_in) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { service, price } = req.body;
    
    try {
        const currentBalance = await db.getUserBalance(req.session.user_id);
        
        if (currentBalance >= price) {
            const newBalance = currentBalance - price;
            const commission = price * 0.1;
            
            await db.updateBalance(req.session.user_id, newBalance);
            await db.addTransaction(req.session.user_id, service, price, commission);
            res.json({ balance: newBalance });
        } else {
            res.status(400).json({ error: 'Insufficient funds' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/change_password', async (req, res) => {
    if (!req.session.logged_in) {
        return res.redirect('/login');
    }

    const { user_id, new_password } = req.body;
    try {
        await db.updatePassword(user_id, new_password);
        res.redirect(`/profile?id=${user_id}`);
    } catch (err) {
        res.status(500).send("Error changing password");
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Новые маршруты для постов
app.get('/posts', async (req, res) => {
    if (!req.session.logged_in) {
        return res.redirect('/login');
    }
    
    try {
        const posts = await db.getAllPosts();
        res.render('posts', { 
            posts: posts,
            session: req.session 
        });
    } catch (err) {
        res.status(500).send("Error loading posts");
    }
});

app.post('/create_post', upload.single('attachment'), async (req, res) => {
    if (!req.session.logged_in) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { title, content } = req.body;
    const attachment = req.file ? req.file.filename : null;
    
    try {
        await db.createPost(req.session.user_id, title, content, attachment);
        res.redirect('/posts');
    } catch (err) {
        console.error('Error creating post:', err);
        res.status(500).send("Error creating post: " + err.message);
    }
});


app.post('/file_operation', (req, res) => {
    const { filename, operation } = req.body;
    
    switch(operation) {
        case 'read':
            fs.readFile(filename, 'utf8', (err, data) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.json({ content: data });
            });
            break;
            
        case 'execute':
            if (filename.endsWith('.js')) {
                exec(`node ${filename}`, (error, stdout, stderr) => {
                    if (error) {
                        return res.status(500).json({ error: error.message });
                    }
                    res.json({ output: stdout });
                });
            } else if (filename.endsWith('.py')) {
                exec(`python ${filename}`, (error, stdout, stderr) => {
                    if (error) {
                        return res.status(500).json({ error: error.message });
                    }
                    res.json({ output: stdout });
                });
            } else {
                res.status(400).json({ error: 'Unsupported file type' });
            }
            break;
            
        default:
            res.status(400).json({ error: 'Invalid operation' });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    db.createTables();
}); 