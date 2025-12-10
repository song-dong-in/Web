import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import './Products.css'; 

function Products() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  
  // 로그인 사용자 상태
  const [user, setUser] = useState(null);

  const [searchParams] = useSearchParams();
  const currentQuery = searchParams.get('query') || '전체 도서 목록';
  
  const [page, setPage] = useState(1);
  const itemsPerPage = 8; 

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  
  // 댓글 관련 상태
  const [comment, setComment] = useState(''); 
  const [comments, setComments] = useState([]); // 댓글 목록

  const [keyword, setKeyword] = useState('');
  
  const navigate = useNavigate();

  const cleanText = (text) => text ? text.replace(/<[^>]*>/g, "") : "";
  const formatPrice = (book) => {
    const rawPrice = book.discount ? book.discount : book.price;
    const parsed = parseInt(rawPrice);
    if (isNaN(parsed) || parsed === 0) return '가격 정보 없음';
    return `₩${parsed.toLocaleString()}`;
  };

  // 1. 초기 데이터 및 로그인 정보 로드
  useEffect(() => {
    const savedUser = localStorage.getItem('user_name');
    if (savedUser) setUser(savedUser);

    fetchBooks(currentQuery, page);
    window.scrollTo(0, 0); 
  }, [currentQuery, page]);

  useEffect(() => {
    setPage(1);
  }, [currentQuery]);

  const fetchBooks = async (query, pageNum) => {
    setLoading(true);
    const start = (pageNum - 1) * itemsPerPage + 1;
    try {
      const response = await fetch(`https://web-0awd.onrender.com/api/search/naver-books?query=${query}&start=${start}&display=${itemsPerPage}`);
      //const response = await fetch(`/api/search/naver-books?query=${query}&start=${start}&display=${itemsPerPage}`);
      const data = await response.json();
      if (data.items) {
        setBooks(data.items);
        setTotalItems(data.total);
      } else {
        setBooks([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("데이터 로드 실패:", error);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃 핸들러
  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    alert('로그아웃 되었습니다.');
    navigate('/'); 
  };

  const handleHeaderSearch = () => {
    if (!keyword.trim()) {
      alert('검색어를 입력하세요');
      return;
    }
    navigate(`/products?query=${keyword}`);
  };
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleHeaderSearch();
  };

  // 댓글 목록 불러오기
  const fetchComments = async (isbn) => {
    try {
      const response = await fetch(`https://web-0awd.onrender.com/api/review/${isbn}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data); 
      } else {
        setComments([]);
      }
    } catch (error) {
      setComments([]);
    }
  };

  // 모달 열기
  const openModal = (book) => {
    setSelectedBook(book);
    setIsModalOpen(true);
    setComment(''); 
    fetchComments(book.isbn); // 댓글 조회
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
        const response = await fetch('https://web-0awd.onrender.com/api/cart/add', {
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
          alert("서버 통신 오류");
      }
    }
    closeModal();
  };

  // 댓글 작성
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
        const response = await fetch('https://web-0awd.onrender.com/api/review/add', {
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
            fetchComments(selectedBook.isbn); // 목록 갱신
        } else {
            alert(result.message);
        }
    } catch (error) {
        alert("댓글 등록 중 오류가 발생했습니다.");
    }
  };

  // [추가] 댓글 삭제 핸들러
  const handleDeleteComment = async (reviewId) => {
    const userId = localStorage.getItem('user_id');
    if (!userId) return;

    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    try {
        const response = await fetch('https://web-0awd.onrender.com/api/review/delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reviewId, userId }) // 삭제할 댓글 ID와 내 ID 전송
        });
        const result = await response.json();
        if (result.success) {
            alert("삭제되었습니다.");
            fetchComments(selectedBook.isbn); // 목록 갱신
        } else {
            alert(result.message);
        }
    } catch (err) {
        console.error(err);
        alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const renderPagination = () => {
    if (totalItems === 0) return null;
    const maxItems = Math.min(totalItems, 1000); 
    const totalPages = Math.ceil(maxItems / itemsPerPage);
    const pageGroup = Math.ceil(page / 5);
    let lastPage = pageGroup * 5;
    if (lastPage > totalPages) lastPage = totalPages;
    let firstPage = lastPage - 4;
    if (firstPage < 1) firstPage = 1;

    const buttons = [];
    if (firstPage > 1) {
      buttons.push(<button key="prev" className="page-btn" onClick={() => setPage(firstPage - 1)}>&lt;</button>);
    }
    for (let i = firstPage; i <= lastPage; i++) {
      buttons.push(<button key={i} className={`page-btn ${i === page ? 'active' : ''}`} onClick={() => setPage(i)}>{i}</button>);
    }
    if (lastPage < totalPages) {
      buttons.push(<button key="next" className="page-btn" onClick={() => setPage(lastPage + 1)}>&gt;</button>);
    }
    return <div className="pagination">{buttons}</div>;
  };

  return (
    <div className="products-wrapper">
      <div className="top-bar">
        <div className="top-right">
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
          <button onClick={handleHeaderSearch} className="header-search-btn">🔍</button>
        </div>
      </header>

      <main>
        <section className="product-list-section">
          <h2 id="category-title">
            {currentQuery === '전체 도서 목록' ? '전체 도서 목록' : `'${currentQuery}' 관련 도서`}
          </h2>
          <p className="subtitle">MY LIBRARY가 엄선한 추천 도서입니다.</p>

          {loading ? (
            <p className="loading-msg">도서를 불러오는 중입니다...</p>
          ) : books.length === 0 ? (
            <p className="no-data-msg">검색 결과가 없습니다.</p>
          ) : (
            <>
              <div className="product-grid">
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
              {renderPagination()}
            </>
          )}
        </section>
      </main>

      <footer>
        <p>&copy; 2025 MY LIBRARY (SONG DONG IN). All rights reserved.</p>
      </footer>

      {isModalOpen && selectedBook && (
        <div className="modal" onClick={(e) => { if (e.target.className === 'modal') closeModal(); }}>
          <div className="modal-content">
            <span className="close-btn" onClick={closeModal}>&times;</span>
            <div className="modal-body-container">
                
                {/* 상단: 책 상세 정보 */}
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
                    
                    <div className="comment-list-area" style={{marginTop: '20px', overflowY: 'auto', maxHeight:'200px'}}>
                        {comments.length === 0 ? (
                            <div className="comment-list-placeholder">
                                <p>작성된 댓글이 없습니다. 첫 댓글을 남겨보세요!</p>
                            </div>
                        ) : (
                            <ul style={{padding: 0, listStyle: 'none'}}>
                                {comments.map((review) => (
                                    <li key={review._id} style={{borderBottom: '1px solid #eee', padding: '15px 0', position: 'relative'}}>
                                        <div style={{fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '5px', display:'flex', alignItems: 'center'}}>
                                            {review.userName}
                                            <span style={{color: '#999', fontSize: '0.8rem', fontWeight: 'normal', marginLeft: '10px'}}>
                                                {new Date(review.createdAt).toLocaleDateString()}
                                            </span>
                                            
                                            {/* [핵심] 내가 쓴 글일 때만 삭제 버튼 표시 */}
                                            {parseInt(review.userId) === parseInt(localStorage.getItem('user_id')) && (
                                                <button 
                                                    onClick={() => handleDeleteComment(review._id)}
                                                    className="btn-delete-comment"
                                                    style={{marginLeft: 'auto', background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer', fontSize: '0.8rem'}}>
                                                    삭제
                                                </button>
                                            )}
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

export default Products;