import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Bookstore.css'; 

function Bookstore() {
  const [books, setBooks] = useState([]);
  const [user, setUser] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [slideIndex, setSlideIndex] = useState(0);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [keyword, setKeyword] = useState('');
  
  // [댓글 관련 상태]
  const [comment, setComment] = useState(''); 
  const [comments, setComments] = useState([]); // 댓글 목록 저장

  const navigate = useNavigate();
  const slideIntervalRef = useRef(null);

  const cleanText = (text) => text ? text.replace(/<[^>]*>/g, "") : "";
  const formatPrice = (book) => {
    const rawPrice = book.discount ? book.discount : book.price;
    const parsed = parseInt(rawPrice);
    if (isNaN(parsed) || parsed === 0) return '가격 정보 없음';
    return `₩${parsed.toLocaleString()}`;
  };

  // 1. 초기 데이터 로드 (로그인 체크 포함)
  useEffect(() => {
    const savedUser = localStorage.getItem('user_name');
    if (savedUser) setUser(savedUser);

    fetchBooks('신간 도서');
    return () => stopSlider(); 
  }, []);

  // 2. 책 데이터 Fetch (슬라이더용)
  const fetchBooks = async (query) => {
    setLoading(true);
    stopSlider();
    setSlideIndex(0);
    try {
      const response = await fetch(`/api/search/naver-books?query=${query}&display=12`);
      const data = await response.json();
      if (data.items) {
        setBooks(data.items);
        startSlider(data.items.length);
      } else {
        setBooks([]);
      }
    } catch (error) {
      console.error("책 불러오기 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const startSlider = (totalItems) => {
    stopSlider();
    const visibleItems = 4;
    if (totalItems <= visibleItems) return;
    slideIntervalRef.current = setInterval(() => {
      setSlideIndex((prev) => {
        const nextIndex = prev + 1;
        if (nextIndex > totalItems - visibleItems) return 0;
        return nextIndex;
      });
    }, 3000);
  };
  const stopSlider = () => {
    if (slideIntervalRef.current) clearInterval(slideIntervalRef.current);
  };

  // 4. 로그아웃 핸들러
  const handleLogout = () => {
    localStorage.clear(); 
    setUser(null);
    alert('로그아웃 되었습니다.');
    window.location.reload(); 
  };

  const handleSearch = () => {
    if (!keyword.trim()) {
      alert('검색어를 입력하세요');
      return;
    }
    navigate(`/products?query=${keyword}`);
  };
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  // [추가] 댓글 목록 불러오기 (MongoDB 조회)
  const fetchComments = async (isbn) => {
    try {
      const response = await fetch(`/api/review/${isbn}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data); 
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error("댓글 로드 실패:", error);
      setComments([]);
    }
  };

  // [수정] 모달 열기 (댓글도 같이 불러옴)
  const openModal = (book) => {
    setSelectedBook(book);
    setIsModalOpen(true);
    setComment(''); 
    fetchComments(book.isbn); // 👈 댓글 조회 실행
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBook(null);
  };

  // 장바구니 담기
  const handleAddToCart = async () => {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
        alert("로그인이 필요한 서비스입니다.");
        navigate('/login');
        return;
    }
    if (selectedBook) {
      try {
        const response = await fetch('/api/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                bookIsbn: selectedBook.isbn,
                quantity: 1
            })
        });
        const result = await response.json();
        if (result.success) {
            if (window.confirm(`[${cleanText(selectedBook.title)}]이(가) 장바구니에 담겼습니다.\n장바구니로 이동하시겠습니까?`)) {
                navigate('/cart');
            }
        } else {
            alert("장바구니 담기 실패: " + result.message);
        }
      } catch (err) {
          console.error(err);
          alert("서버 통신 오류");
      }
    }
    closeModal();
  };

  // [수정] 댓글 작성 핸들러 (MongoDB 전송)
  const handleAddComment = async () => {
    const userId = localStorage.getItem('user_id');
    const userName = localStorage.getItem('user_name');

    if (!userId) {
      alert('로그인이 필요합니다.');
      return;
    }
    if (comment.trim() === '') {
      alert('댓글 내용을 입력해주세요.');
      return;
    }
    
    try {
        const response = await fetch('/api/review/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                userName, 
                bookIsbn: selectedBook.isbn,
                content: comment
            })
        });
        const result = await response.json();

        if (result.success) {
            alert("댓글이 등록되었습니다.");
            setComment(''); 
            fetchComments(selectedBook.isbn); // 목록 새로고침
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error("댓글 등록 에러:", error);
        alert("댓글 등록 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="bookstore-wrapper"> 
      
      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-right" id="auth-section">
          {user ? (
            <>
              <span style={{ fontWeight: 'bold', marginRight: '10px' }}>{user}님 환영합니다</span>
              <span>|</span>
              <button onClick={handleLogout} className="top-btn">로그아웃</button>
              <span>|</span>
              <Link to="/cart">장바구니</Link>
            </>
          ) : (
            <>
              <Link to="/signup">회원가입</Link><span>|</span>
              <Link to="/login">로그인</Link><span>|</span>
              <Link to="/cart">장바구니</Link>
            </>
          )}
        </div>
      </div>

      {/* Header */}
      <header>
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="logo">MY LIBRARY</div>
        </Link>
        <nav>
          <ul>
            <li><Link to="/products?query=베스트셀러">베스트셀러</Link></li>
            <li><Link to="/products?query=소설">소설</Link></li>
            <li><Link to="/products?query=인문">인문/사회</Link></li>
            <li><Link to="/products?query=IT">IT/과학</Link></li>
            <li><Link to="/products?query=경제">경제/경영</Link></li>
            <li><Link to="/products?query=자기계발">자기계발</Link></li>
          </ul>
        </nav>
        <div className="header-search">
          <input 
            type="text" 
            placeholder="도서 검색..." 
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button onClick={handleSearch} className="header-search-btn">🔍</button>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <section className="banner" style={{ backgroundImage: "url('/main.jpg')" }}>
          <div className="banner-content">
            <h2>DAILY READING, DAILY GROWTH</h2>
            <p>오늘의 지혜를 찾으세요.<br/>다양한 분야의 신간 도서가 가득합니다!</p>
            <Link to="/products?query=IT" className="btn-banner">서재 둘러보기</Link>
          </div>
        </section>

        <section className="product-list">
          <h2>화제의 신간 도서</h2>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>
            지금 가장 주목받는 책들을 만나보세요.
          </p>
          {loading ? (
            <p className="loading-msg">도서 정보를 불러오고 있습니다...</p>
          ) : books.length === 0 ? (
            <p className="no-data-msg">도서 데이터가 없습니다.</p>
          ) : (
            <div className="slider-viewport" 
                 onMouseEnter={stopSlider} 
                 onMouseLeave={() => startSlider(books.length)}>
              <div 
                className="slider-track" 
                style={{ transform: `translateX(-${slideIndex * 300}px)` }}
              >
                {books.map((book, index) => (
                  <div key={index} className="product-card">
                    <div className="img-wrapper">
                      <img src={book.image} alt={book.title} className="product-image" />
                    </div>
                    <h3 className="product-title">{cleanText(book.title)}</h3>
                    <p className="product-price">{formatPrice(book)}</p>
                    <button className="btn-cart" onClick={() => openModal(book)}>상세보기</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      <footer>
        <p>&copy; 2025 MY LIBRARY (SONG DONG IN). All rights reserved.</p>
      </footer>

      {/* 모달 */}
      {isModalOpen && selectedBook && (
        <div className="modal" onClick={(e) => { if (e.target.className === 'modal') closeModal(); }}>
          <div className="modal-content">
            <span className="close-btn" onClick={closeModal}>&times;</span>
            <div className="modal-body-container">
                
                {/* 상단: 책 정보 */}
                <div className="modal-book-detail">
                  <div className="modal-image-wrapper">
                    <img id="modal-image" src={selectedBook.image} alt="책 표지" />
                  </div>
                  <div className="modal-text">
                    <h3 id="modal-title">{cleanText(selectedBook.title)}</h3>
                    <p id="modal-author" className="meta">{cleanText(selectedBook.author)} | {cleanText(selectedBook.publisher)}</p>
                    <p id="modal-price" className="price">{formatPrice(selectedBook)}</p>
                    <div className="divider"></div>
                    <p id="modal-description">
                      {cleanText(selectedBook.description) || "내용 없음"}
                    </p>
                    <button onClick={handleAddToCart} className="btn-add-cart">
                      장바구니 담기
                    </button>
                  </div>
                </div>

                {/* 하단: 댓글 섹션 */}
                <div className="modal-comment-section">
                    <h4>한줄평 ({comments.length})</h4>
                    <textarea
                        placeholder="이 책에 대한 의견을 남겨주세요."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    ></textarea>
                    <button onClick={handleAddComment} className="btn-comment-submit">
                        등록
                    </button>
                    
                    {/* 댓글 리스트 렌더링 */}
                    <div className="comment-list-area" style={{marginTop: '20px', overflowY: 'auto', maxHeight:'200px'}}>
                        {comments.length === 0 ? (
                            <div className="comment-list-placeholder">
                                <p>작성된 댓글이 없습니다. 첫 댓글을 남겨보세요!</p>
                            </div>
                        ) : (
                            <ul style={{padding: 0, listStyle: 'none'}}>
                                {comments.map((review) => (
                                    <li key={review._id} style={{borderBottom: '1px solid #eee', padding: '15px 0'}}>
                                        <div style={{fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '5px', display:'flex', justifyContent:'space-between'}}>
                                            <span>{review.userName}</span>
                                            <span style={{color: '#999', fontSize: '0.8rem', fontWeight: 'normal'}}>
                                                {new Date(review.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div style={{fontSize: '0.95rem', color: '#555', lineHeight:'1.4'}}>{review.content}</div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Bookstore;