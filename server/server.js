// ====================================================
// [수정됨] 최상단에 dotenv 설정 추가
// ====================================================
require('dotenv').config();

const express = require('express');
const cors = require('cors'); 
const mysql = require('mysql2');
const mongoose = require('mongoose'); 
const axios = require('axios');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// ====================================================
// 1. 미들웨어 설정
// ====================================================
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173'], 
    credentials: true, 
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname))); 

// ====================================================
// 2-1. MySQL (TiDB) 데이터베이스 연결 설정
// ====================================================
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 4000, 
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: { rejectUnauthorized: true, minVersion: 'TLSv1.2' }
});

db.getConnection((err, connection) => {
    if (err) {
        console.error('🚨 MySQL 연결 실패:', err.message);
    } else {
        console.log('✅ MySQL 연결 성공!');
        
        // 필수 테이블 생성 (User, Book, Cart)
        const createTablesSQL = [ 
            `CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL
            )`,
            `CREATE TABLE IF NOT EXISTS book (
                isbn VARCHAR(50) PRIMARY KEY,     
                title VARCHAR(255) NOT NULL,
                author VARCHAR(255),
                publisher VARCHAR(100),
                pub_date VARCHAR(20),
                description TEXT,
                image_url VARCHAR(512),
                added_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS cart (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                book_isbn VARCHAR(50) NOT NULL,
                quantity INT DEFAULT 1,
                UNIQUE KEY unique_cart_item (user_id, book_isbn), 
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (book_isbn) REFERENCES book(isbn)
            )`
        ];
        
        createTablesSQL.forEach((sql) => {
            connection.query(sql, (tableErr) => {
                if (tableErr) console.error('⚠️ 테이블 생성 오류:', tableErr.message);
            });
        });
        
        console.log('✅ 필수 테이블 체크 완료');
        connection.release(); 
    }
});

// ====================================================
// 2-2. [MongoDB] 연결 설정 (댓글용)
// ====================================================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB 연결 성공! (댓글 시스템)'))
  .catch(err => console.error('🚨 MongoDB 연결 실패:', err));

// 댓글 스키마 정의
const reviewSchema = new mongoose.Schema({
    userId: { type: Number, required: true },   // MySQL User ID
    userName: { type: String, required: true }, // 작성자 이름
    bookIsbn: { type: String, required: true }, // 책 ISBN
    content: { type: String, required: true },  // 댓글 내용
    createdAt: { type: Date, default: Date.now } // 작성일
});

const Review = mongoose.model('Review', reviewSchema);


// ====================================================
// 3. 네이버 API 키 설정
// ====================================================
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID?.trim();
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET?.trim();

// ====================================================
// 4. API 라우트 정의
// ====================================================

// [API 1] 네이버 책 검색
app.get('/api/search/naver-books', async (req, res) => {
    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
        return res.status(500).json({ error: '서버 API 설정 오류' });
    }
    const query = req.query.query || 'IT';
    const start = req.query.start || 1;
    const display = req.query.display || 12;

    try {
        const response = await axios.get('https://openapi.naver.com/v1/search/book.json', {
            params: { query, display, start, sort: 'sim' },
            headers: {
                'X-Naver-Client-Id': NAVER_CLIENT_ID,
                'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
            }
        });

        const books = response.data.items;
        if (books && books.length > 0) {
            const values = books.map((book) => {
                let realIsbn = book.isbn.includes(' ') ? book.isbn.split(' ')[1] : book.isbn;
                if (!realIsbn) realIsbn = 'NO_ISBN_' + Date.now();

                return [
                    realIsbn, 
                    book.title.replace(/<[^>]*>/g, ""), 
                    book.author.replace(/<[^>]*>/g, ""), 
                    book.publisher, 
                    book.pubdate || "", 
                    book.description ? book.description.replace(/<[^>]*>/g, "") : "", 
                    book.image
                ];
            });

            const sql = `INSERT IGNORE INTO book (isbn, title, author, publisher, pub_date, description, image_url) VALUES ?`;
            await db.promise().query(sql, [values]);
        }
        
        res.json(response.data);
    } catch (error) {
        console.error('API Error:', error.message);
        res.status(500).json({ error: 'API 호출 실패' });
    }
});

// [API 2] 회원가입
app.post('/api/signup', (req, res) => {
    const { username, password, name } = req.body;
    if (!username || !password || !name) return res.json({ success: false, message: '정보 입력 필요' });
    
    db.query('INSERT INTO users (username, password, name) VALUES (?, ?, ?)', [username, password, name], (err) => {
        if (err) {
            const message = err.code === 'ER_DUP_ENTRY' ? '이미 존재하는 아이디입니다.' : '가입 실패';
            res.json({ success: false, message });
        } else {
            res.json({ success: true, message: '가입 성공!' });
        }
    });
});

// [API 3] 로그인
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.json({ success: false, message: '정보 입력 필요' });

    db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: '서버 오류' });
        
        if (results.length > 0) {
            res.json({ 
                success: true, 
                message: `${results[0].name}님 환영합니다!`,
                name: results[0].name,
                userId: results[0].id 
            });
        } else {
            res.json({ success: false, message: '아이디/비번 불일치' });
        }
    });
});


// ====================================================
// [MySQL] 장바구니 API
// ====================================================

// [API 5] 장바구니 담기
app.post('/api/cart/add', async (req, res) => {
    const { userId, bookIsbn, quantity = 1 } = req.body;
    try {
        const [cartItem] = await db.promise().query(
            'SELECT quantity FROM cart WHERE user_id = ? AND book_isbn = ?', [userId, bookIsbn]
        );

        if (cartItem.length > 0) {
            await db.promise().query(
                'UPDATE cart SET quantity = ? WHERE user_id = ? AND book_isbn = ?',
                [cartItem[0].quantity + quantity, userId, bookIsbn]
            );
            res.json({ success: true, message: '수량 증가' });
        } else {
            await db.promise().query(
                'INSERT INTO cart (user_id, book_isbn, quantity) VALUES (?, ?, ?)',
                [userId, bookIsbn, quantity]
            );
            res.json({ success: true, message: '담기 성공' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: '장바구니 오류' });
    }
});

// [API 6] 장바구니 조회
app.get('/api/cart/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const sql = `
            SELECT c.quantity, b.title, b.author, b.image_url, b.isbn, '15000' as price 
            FROM cart c JOIN book b ON c.book_isbn = b.isbn 
            WHERE c.user_id = ?
        `;
        const [rows] = await db.promise().query(sql, [userId]);
        const cartItems = rows.map(item => ({ ...item, price: 15000 })); 
        res.json(cartItems);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '조회 실패' });
    }
});

// [API 7] 수량 수정
app.put('/api/cart/update', async (req, res) => {
    const { userId, bookIsbn, quantity } = req.body;
    try {
        await db.promise().query(
            'UPDATE cart SET quantity = ? WHERE user_id = ? AND book_isbn = ?', [quantity, userId, bookIsbn]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: '수정 실패' }); }
});

// [API 8] 삭제
app.delete('/api/cart/remove', async (req, res) => {
    const { userId, bookIsbn } = req.body;
    try {
        await db.promise().query(
            'DELETE FROM cart WHERE user_id = ? AND book_isbn = ?', [userId, bookIsbn]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: '삭제 실패' }); }
});


// ====================================================
// [MongoDB] 댓글 API
// ====================================================

// [API 9] 댓글 등록
app.post('/api/review/add', async (req, res) => {
    const { userId, userName, bookIsbn, content } = req.body;
    
    if (!content || !content.trim()) {
        return res.status(400).json({ success: false, message: '내용 입력 필요' });
    }

    try {
        const newReview = new Review({ userId, userName, bookIsbn, content });
        await newReview.save();
        res.json({ success: true, message: '댓글 등록 완료' });
    } catch (err) {
        console.error('MongoDB Error:', err);
        res.status(500).json({ success: false, message: '댓글 등록 실패' });
    }
});

// [API 10] 댓글 조회
app.get('/api/review/:isbn', async (req, res) => {
    const { isbn } = req.params;
    try {
        const reviews = await Review.find({ bookIsbn: isbn }).sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        console.error('MongoDB Error:', err);
        res.status(500).json({ error: '댓글 로드 실패' });
    }
});

// [API 11] 댓글 삭제 (본인 확인) -- [NEW] 추가됨!
app.delete('/api/review/delete', async (req, res) => {
    const { reviewId, userId } = req.body;

    try {
        // 1. 댓글이 존재하는지 찾기
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: '댓글을 찾을 수 없습니다.' });
        }

        // 2. 작성자 본인인지 확인 (타입 변환해서 비교)
        if (Number(review.userId) !== Number(userId)) {
            return res.status(403).json({ success: false, message: '본인의 댓글만 삭제할 수 있습니다.' });
        }

        // 3. 삭제
        await Review.findByIdAndDelete(reviewId);
        res.json({ success: true, message: '삭제되었습니다.' });

    } catch (err) {
        console.error('댓글 삭제 오류:', err);
        res.status(500).json({ success: false, message: '삭제 중 오류 발생' });
    }
});


// ====================================================
// 5. 서버 시작
// ====================================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 서버 실행 중 (http://localhost:${PORT})`);
});