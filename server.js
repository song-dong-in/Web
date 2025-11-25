const express = require('express');
const mysql = require('mysql2');
const axios = require('axios');
const path = require('path');
const app = express();
const PORT = 3000;

// 1. 미들웨어 설정 (데이터 파싱 및 정적 파일)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// 2. [핵심 수정] MySQL 연결 설정 (createPool 사용)
// createConnection 대신 createPool을 사용하면 연결이 끊겨도 자동으로 재연결합니다.
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1234', // 로컬 비밀번호 확인
  database: process.env.DB_NAME || 'mylibrary',
  port: process.env.DB_PORT || 3307,           // 로컬 포트 확인 (3306 or 3307)
  waitForConnections: true, // 연결이 꽉 차면 대기
  connectionLimit: 10,      // 최대 연결 개수
  queueLimit: 0             // 대기열 제한 없음
});

// 풀(Pool) 연결 확인 (로그용)
db.getConnection((err, connection) => {
  if (err) {
    console.error('MySQL 연결 실패 (Pool):', err);
  } else {
    console.log('MySQL 연결 성공! (Pool 방식)');
    connection.release(); // 확인 후 연결 반환
  }
});

// 3. 네이버 API 키 설정 (Render 환경변수 우선 사용)
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID || '여기에_로컬용_키_입력';
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET || '여기에_로컬용_시크릿_입력';

// ----------------------------------------------------
// [API 1] 네이버 책 검색 (페이징 지원)
// ----------------------------------------------------
app.get('/api/search/naver-books', async (req, res) => {
  const query = req.query.query || 'IT';
  const start = req.query.start || 1;
  const display = req.query.display || 12;

  try {
    const response = await axios.get('https://openapi.naver.com/v1/search/book.json', {
      params: {
        query: query,
        display: display,
        start: start,
        sort: 'sim'
      },
      headers: {
        'X-Naver-Client-Id': NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('[네이버 API 에러]', error.message);
    res.status(500).json({ error: '네이버 API 호출 실패' });
  }
});

// ----------------------------------------------------
// [API 2] 회원가입 (INSERT)
// ----------------------------------------------------
app.post('/api/signup', (req, res) => {
  const { username, password, name } = req.body;
  const sql = 'INSERT INTO users (username, password, name) VALUES (?, ?, ?)';
  
  db.query(sql, [username, password, name], (err, result) => {
    if (err) {
      console.error('[회원가입 에러]', err);
      res.json({ success: false, message: '회원가입 실패 (아이디 중복 등)' });
    } else {
      res.json({ success: true, message: '회원가입 성공!' });
    }
  });
});

// ----------------------------------------------------
// [API 3] 로그인 (SELECT)
// ----------------------------------------------------
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';

  db.query(sql, [username, password], (err, results) => {
    if (err) {
      console.error('[로그인 에러]', err);
      res.status(500).json({ success: false, message: '서버 오류' });
    } else {
      if (results.length > 0) {
        // 로그인 성공 시 이름(name)도 같이 보내줌
        res.json({ 
          success: true, 
          message: `${results[0].name}님 환영합니다!`,
          name: results[0].name 
        });
      } else {
        res.json({ success: false, message: '아이디 또는 비밀번호가 틀렸습니다.' });
      }
    }
  });
});

// ----------------------------------------------------
// [페이지] 메인 화면 연결
// ----------------------------------------------------
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'main.html'));
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});