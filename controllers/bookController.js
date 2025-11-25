/* controllers/bookController.js */
const axios = require('axios');

// [수정] 직접 적지 말고 process.env에서 가져오라고 시킵니다.
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID; 
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

// 책 검색 함수
exports.searchBooks = async (req, res) => {
  // 1. 클라이언트(브라우저)가 보낸 검색어, 시작 위치, 개수 정보를 받습니다.
  const query = req.query.query || 'IT';
  const start = req.query.start || 1;      // [추가] 페이지네이션 핵심!
  const display = req.query.display || 8; // [수정] 기본값 12개로 변경 및 동적 처리

  console.log(`[Controller 로그] 검색: ${query}, 시작: ${start}, 개수: ${display}`);

  try {
    const response = await axios.get('https://openapi.naver.com/v1/search/book.json', {
      params: { 
        query: query, 
        display: display, // [수정] 변수 사용
        start: start,     // [추가] 변수 사용
        sort: 'sim' 
      },
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