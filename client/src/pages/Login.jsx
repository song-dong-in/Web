import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

function Login() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleLogin = async () => {
    const { username, password } = formData;
    if (!username || !password) {
      alert("아이디와 비밀번호를 입력해주세요.");
      return;
    }

    try {
      const response = await fetch('https://web-0awd.onrender.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();

      if (data.success) {
        // [핵심] 로그인 성공 시 사용자 이름과 ID를 모두 저장!
        localStorage.setItem('user_name', data.name);
        localStorage.setItem('user_id', data.userId); 
        
        alert(`${data.name}님 환영합니다!`);
        navigate('/'); 
      } else {
        alert(data.message || "로그인 실패");
      }
    } catch (err) {
      console.error(err);
      alert("서버 오류가 발생했습니다.");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <h2>로그인</h2>
        <input type="text" name="username" className="auth-input" placeholder="아이디" value={formData.username} onChange={handleChange} />
        <input type="password" name="password" className="auth-input" placeholder="비밀번호" value={formData.password} onChange={handleChange} onKeyPress={handleKeyPress} />
        <button onClick={handleLogin} className="auth-btn">로그인</button>
        <div className="auth-link">
          계정이 없으신가요? <Link to="/signup">회원가입 하러가기</Link>
        </div>
        <div className="auth-link">
            <Link to="/">메인으로 돌아가기</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;