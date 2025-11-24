/* controllers/bookController.js */
const axios = require('axios');

// 키 설정 (server.js에 있던거 가져오기)
const NAVER_CLIENT_ID = 'ffOx7xvBPA013F3NCtRS'; 
const NAVER_CLIENT_SECRET = 'MugbssSlw5';

// 책 검색 함수 (로직 분리)
exports.searchBooks = async (req, res) => {
  const query = req.query.query || 'IT';
  
  try {
    const response = await axios.get('https://openapi.naver.com/v1/search/book.json', {
      params: { query: query, display: 12, sort: 'sim' },
      headers: {
        'X-Naver-Client-Id': NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('에러:', error.message);
    res.status(500).json({ error: 'API 요청 실패' });
  }
};