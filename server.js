/* server.js (최종 수정) */
const express = require('express');
const app = express();
const path = require('path');
const bookRoutes = require('./routes/bookRoutes'); // 라우터 불러오기

const PORT = 3000;

app.use(express.static(__dirname));

// [디자인 패턴 적용] 라우터 등록
// '/api/search' 로 시작하는 주소는 bookRoutes 파일이 처리한다.
app.use('/api/search', bookRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'main.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 MVC 패턴이 적용된 서버 실행 중: http://localhost:${PORT}`);
});