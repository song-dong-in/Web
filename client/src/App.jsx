// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Bookstore from './pages/Bookstore';
import Products from './pages/Products';
import Cart from './pages/Cart';
import Login from './pages/Login';   // 👈 추가
import Signup from './pages/Signup'; // 👈 추가

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Bookstore />} />
        <Route path="/products" element={<Products />} />
        <Route path="/cart" element={<Cart />} />
        
        {/* 👇 로그인/회원가입 경로 추가 */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;