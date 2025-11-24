/* routes/bookRoutes.js */
const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController'); // 위에서 만든 컨트롤러 불러오기

// /naver-books 주소로 요청이 오면 searchBooks 함수 실행해라!
router.get('/naver-books', bookController.searchBooks);

module.exports = router;