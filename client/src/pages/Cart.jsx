import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Cart.css';

function Cart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [userId, setUserId] = useState(null);
  
  // [추가] 로그인 사용자 이름
  const [userName, setUserName] = useState(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('user_id');
    const storedUserName = localStorage.getItem('user_name'); // 이름 가져오기

    if (storedUserId) {
      setUserId(storedUserId);
      setUserName(storedUserName);
      fetchCartItems(storedUserId);
    } else {
      setCartItems([]);
    }
  }, []);

  const fetchCartItems = async (uid) => {
    try {
      const response = await fetch(`/api/cart/${uid}`);
      const data = await response.json();
      setCartItems(data);
    } catch (error) {
      console.error("장바구니 불러오기 실패:", error);
    }
  };

  const totalPrice = cartItems.reduce((acc, item) => {
    const price = parseInt(item.price) || 0; 
    return acc + (price * item.quantity);
  }, 0);
  
  const shippingFee = totalPrice >= 50000 || totalPrice === 0 ? 0 : 3000;

  const handleQuantityChange = async (bookIsbn, currentQuantity, delta) => {
    const newQuantity = currentQuantity + delta;
    if (newQuantity < 1) return;
    try {
        const response = await fetch('/api/cart/update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, bookIsbn, quantity: newQuantity })
        });
        const result = await response.json();
        if (result.success) {
            setCartItems(items => 
                items.map(item => item.isbn === bookIsbn ? { ...item, quantity: newQuantity } : item)
            );
        }
    } catch (error) {
        console.error("수량 변경 에러", error);
    }
  };

  const handleRemove = async (bookIsbn) => {
    if (!window.confirm('선택한 상품을 삭제하시겠습니까?')) return;
    try {
        const response = await fetch('/api/cart/remove', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, bookIsbn })
        });
        const result = await response.json();
        if (result.success) {
            setCartItems(items => items.filter(item => item.isbn !== bookIsbn));
        }
    } catch (error) {
        console.error("삭제 에러", error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href='/';
  };

  return (
    <div className="cart-wrapper">
      <div className="top-bar">
        <div className="top-right">
            {userId ? (
                <>
                    <span style={{ fontWeight: 'bold', marginRight: '10px' }}>{userName}님 환영합니다</span>
                    <span>|</span>
                    <button onClick={handleLogout} style={{background:'none', border:'none', color:'inherit', cursor:'pointer'}}>로그아웃</button>
                </>
            ) : (
                <Link to="/login">로그인</Link>
            )}
            <span>|</span>
            <Link to="/cart" style={{ fontWeight: 'bold', color: 'white' }}>장바구니</Link>
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
          <input type="text" placeholder="도서 검색..." disabled style={{ backgroundColor: 'transparent' }} />
          <button className="header-search-btn">🔍</button>
        </div>
      </header>

      <main className="cart-main">
        <h2 className="page-title">장바구니</h2>

        {!userId ? (
            <div className="empty-cart">
                <p>로그인이 필요한 서비스입니다.</p>
                <Link to="/login" className="btn-continue">로그인 하러 가기</Link>
            </div>
        ) : cartItems.length === 0 ? (
          <div className="empty-cart">
            <p>장바구니에 담긴 상품이 없습니다.</p>
            <Link to="/products" className="btn-continue">쇼핑하러 가기</Link>
          </div>
        ) : (
          <div className="cart-container">
            <div className="cart-list">
              <div className="cart-header">
                <span>상품 정보</span>
                <span>수량</span>
                <span>상품 금액</span>
                <span>관리</span>
              </div>
              {cartItems.map(item => (
                <div key={item.isbn} className="cart-item">
                  <div className="item-info">
                    <img src={item.image_url} alt={item.title} /> 
                    <div className="item-details">
                      <h4>{item.title}</h4>
                      <p>{item.author}</p>
                    </div>
                  </div>
                  <div className="item-quantity">
                    <button onClick={() => handleQuantityChange(item.isbn, item.quantity, -1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => handleQuantityChange(item.isbn, item.quantity, 1)}>+</button>
                  </div>
                  <div className="item-price">
                    {(parseInt(item.price) * item.quantity).toLocaleString()}원
                  </div>
                  <div className="item-remove">
                    <button onClick={() => handleRemove(item.isbn)} className="btn-remove">×</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="cart-summary">
              <h3>결제 금액</h3>
              <div className="summary-row"><span>총 상품 금액</span><span>{totalPrice.toLocaleString()}원</span></div>
              <div className="summary-row"><span>배송비</span><span>{shippingFee.toLocaleString()}원</span></div>
              <div className="divider"></div>
              <div className="summary-row total"><span>최종 결제 금액</span><span className="total-price">{(totalPrice + shippingFee).toLocaleString()}원</span></div>
              <button className="btn-checkout" onClick={() => alert('주문이 완료되었습니다!')}>주문하기</button>
            </div>
          </div>
        )}
      </main>
      <footer><p>&copy; 2025 MY LIBRARY. All rights reserved.</p></footer>
    </div>
  );
}
export default Cart;