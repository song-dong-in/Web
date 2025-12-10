import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css'; // 공통 스타일 연결

function Signup() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: ''
  });

  const navigate = useNavigate();

  // 입력값 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // 회원가입 요청 핸들러
  const handleSignup = async () => {
    const { username, password, name } = formData;

    if (!username || !password || !name) {
      alert("모든 정보를 입력해주세요.");
      return;
    }

    try {
      const response = await fetch('https://web-0awd.onrender.com/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, name })
      });
      const data = await response.json();

      if (data.success) {
        alert("회원가입 성공! 로그인 페이지로 이동합니다.");
        navigate('/login'); // 회원가입 성공 시 로그인 페이지로 이동
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert("서버 오류가 발생했습니다.");
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <h2>회원가입</h2>
        <input 
          type="text" 
          name="username"
          className="auth-input"
          placeholder="아이디" 
          value={formData.username}
          onChange={handleChange}
        />
        <input 
          type="password" 
          name="password"
          className="auth-input"
          placeholder="비밀번호" 
          value={formData.password}
          onChange={handleChange}
        />
        <input 
          type="text" 
          name="name"
          className="auth-input"
          placeholder="이름" 
          value={formData.name}
          onChange={handleChange}
        />
        <button onClick={handleSignup} className="auth-btn">가입하기</button>
        
        <div className="auth-link">
          이미 계정이 있으신가요? <Link to="/login">로그인 하러가기</Link>
        </div>
      </div>
    </div>
  );
}

export default Signup;