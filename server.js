  // ====================================================
  // [수정됨] 최상단에 dotenv 설정 추가
  // ====================================================
  require('dotenv').config();

  const express = require('express');
  const mysql = require('mysql2');
  const axios = require('axios');
  const path = require('path');
  const app = express();

  const PORT = process.env.PORT || 3000;

  // ====================================================
  // 1. 미들웨어 설정
  // ====================================================
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname))); 

  // ====================================================
  // 2. MySQL 데이터베이스 연결 설정
  // ====================================================
  const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    // [수정 1] TiDB는 4000번 포트를 씁니다. (.env를 못 읽어도 4000으로 시도)
    port: process.env.DB_PORT || 4000, 
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
    rejectUnauthorized: true,
    minVersion: 'TLSv1.2'
  }
  });

  db.getConnection((err, connection) => {
    if (err) {
      console.error('🚨 MySQL 연결 실패. .env 파일과 DB 정보를 확인해주세요.');
      console.error('상세 에러:', err.message); // 연결 에러 상세 출력
    } else {
      console.log('✅ MySQL 연결 성공!');
      
      // [수정 2] 테이블이 없으면 자동으로 생성해주는 코드 추가 (에러 방지용)
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL
        )
      `;
      
      connection.query(createTableSQL, (tableErr) => {
        if (tableErr) {
          console.error('⚠️ 테이블 생성 실패:', tableErr.message);
        } else {
          console.log('✅ users 테이블 체크 완료 (없으면 자동 생성됨)');
        }
        connection.release(); 
      });
    }
  });

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
      console.error('🚨 API 키가 설정되지 않았습니다.');
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
      console.log(`✅ 네이버 검색 성공: "${query}"`);
      res.json(response.data);
    } catch (error) {
      console.error('[네이버 API 호출 에러]', error.message);
      res.status(500).json({ error: '네이버 API 호출 실패' });
    }
  });

  // [API 2] 회원가입
  app.post('/api/signup', (req, res) => {
    const { username, password, name } = req.body;
    if (!username || !password || !name) {
      return res.json({ success: false, message: '모든 정보를 입력해주세요.' });
    }
    const sql = 'INSERT INTO users (username, password, name) VALUES (?, ?, ?)';
    db.query(sql, [username, password, name], (err, result) => {
      if (err) {
        console.error('[회원가입 DB 에러 상세]', err); // 에러 상세 출력
        const message = err.code === 'ER_DUP_ENTRY' ? '이미 존재하는 아이디입니다.' : '회원가입 실패';
        res.json({ success: false, message: message });
      } else {
        res.json({ success: true, message: '회원가입 성공!' });
      }
    });
  });

  // [API 3] 로그인 (여기가 문제였던 부분)
  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.json({ success: false, message: '아이디와 비밀번호를 입력해주세요.' });
    }
    const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
    db.query(sql, [username, password], (err, results) => {
      if (err) {
        // [수정 3] 에러의 정체를 터미널에 확실하게 보여줍니다.
        console.error('🚨 [로그인 DB 에러 상세]', err); 
        res.status(500).json({ success: false, message: '서버 오류' });
      } else {
        if (results.length > 0) {
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

  // ====================================================
  // 5. 서버 시작
  // ====================================================
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'main.html'));
  });

  app.listen(PORT, () => {
    console.log(`🚀 서버 실행 중 (http://localhost:${PORT})`);
  });