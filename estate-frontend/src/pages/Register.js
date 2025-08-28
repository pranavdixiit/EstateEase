import React, { useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { name, email, password, confirmPassword } = formData;

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      setSuccess('');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setSuccess('');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Registration failed');
        setSuccess('');
      } else {
        setSuccess('Registration successful! You can now log in.');
        setError('');
        setFormData({ name: '', email: '', password: '', confirmPassword: '' });
      }
    } catch (e) {
      setError('Network or server error');
      setSuccess('');
    }

    setLoading(false);
  };

  return (
    <div className='page'>
    <div className="box">
      <div className="square" style={{ '--i': '0' }}></div>
      <div className="square" style={{ '--i': '1' }}></div>
      <div className="square" style={{ '--i': '2' }}></div>
      <div className="square" style={{ '--i': '3' }}></div>
      <div className="square" style={{ '--i': '4' }}></div>

      <div className="login-container">
        <h2>Register</h2>
        {error && <p className="login-error">{error}</p>}
        {success && <p style={{ color: 'limegreen', marginBottom: '1rem' }}>{success}</p>}

        <form className="login-form" onSubmit={onSubmit}>
          <input
            name="name"
            type="text"
            placeholder="Name"
            value={name}
            onChange={onChange}
            disabled={loading}
            required
          />

          <input
            name="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={onChange}
            disabled={loading}
            required
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={onChange}
            disabled={loading}
            required
          />

          <input
            name="confirmPassword"
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={onChange}
            disabled={loading}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
      </div>
    </div>
    </div>
  );
};

export default Register;
