const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser'); // 데이터 받기용
const path = require('path');
const app = express();
const PORT = 3000;

// 1. 미들웨어 설정 (JSON 데이터 및 HTML 폼 데이터 받기)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// 2. MySQL 연결 설정 (환경 변수 사용)
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',     // 배포되면 DB_HOST, 없으면 localhost
  user: process.env.DB_USER || 'root',          // 배포되면 DB_USER, 없으면 root
  password: process.env.DB_PASSWORD || '1234',  // 배포되면 DB_PASSWORD, 없으면 1234
  database: process.env.DB_NAME || 'mylibrary', // 배포되면 DB_NAME, 없으면 mylibrary
  port: process.env.DB_PORT || 3307             // 포트 번호 (보통 3306)
});

db.connect((err) => {
  if (err) {
    console.error('MySQL 연결 실패:', err);
  } else {
    console.log('MySQL 연결 성공!');
  }
});

// ---------------------------------------
// [API] 회원가입 (Sign Up)
// ---------------------------------------
app.post('/api/signup', (req, res) => {
  const { username, password, name } = req.body;

  // 아이디 중복 체크 등은 생략하고 바로 저장 (INSERT)
  const sql = 'INSERT INTO users (username, password, name) VALUES (?, ?, ?)';
  
  db.query(sql, [username, password, name], (err, result) => {
    if (err) {
      console.error(err);
      res.json({ success: false, message: '회원가입 실패 (아이디 중복 등)' });
    } else {
      res.json({ success: true, message: '회원가입 성공!' });
    }
  });
});

// ---------------------------------------
// [API] 로그인 (Login)
// ---------------------------------------
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // 아이디와 비번이 일치하는지 확인 (SELECT)
  const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';

  db.query(sql, [username, password], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ success: false, message: '서버 오류' });
    } else {
      if (results.length > 0) {
        // 로그인 성공! (첫 번째 결과의 이름 환영)
        res.json({ 
        success: true, 
        message: `${results[0].name}님 환영합니다!`,
        name: results[0].name // <-- 이 부분 추가!
      });
      } else {
        // 로그인 실패
        res.json({ success: false, message: '아이디 또는 비밀번호가 틀렸습니다.' });
      }
    }
  });
});

// ... (기존 네이버 API 코드 및 서버 실행 코드 유지) ...

app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});