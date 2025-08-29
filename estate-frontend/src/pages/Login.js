import React, { useState } from 'react';
import { useHistory } from 'react-router-dom'; // v5 useHistory
import { useDispatch } from 'react-redux';
import { fetchUser } from '../features/auth/authSlice';

import { Link } from 'react-router-dom';


import './Login.css';

// Correct environment variable usage without escapes
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Login = () => {
  const history = useHistory();
  const dispatch = useDispatch();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.msg || 'Login failed');
      } else {
        localStorage.setItem('token', data.token);
        dispatch(fetchUser());
        history.push('/'); // v5 navigation
      }
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <div className="page">
      <div className="box">
        <div className="square" style={{ '--i': '0' }}></div>
        <div className="square" style={{ '--i': '1' }}></div>
        <div className="square" style={{ '--i': '2' }}></div>
        <div className="square" style={{ '--i': '3' }}></div>
        <div className="square" style={{ '--i': '4' }}></div>

        <div className="login-container">
          <h2>Login</h2>
          {error && <p className="login-error">{error}</p>}
          <form className="login-form" onSubmit={onSubmit}>
            <input
              id="email"
              type="email"
              value={email}
              placeholder="Email"
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              id="password"
              type="password"
              value={password}
              placeholder="Password"
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button type="submit">Log In</button>
          </form>
          <p className="signup-label">
  Don't have an account?{' '}
  <Link to="/register" className="signup-link">
    Sign up
  </Link>
</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
