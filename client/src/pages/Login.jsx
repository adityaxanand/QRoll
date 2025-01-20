import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const history = useHistory();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting login...');
  
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
  
      const data = await response.json();
      console.log('Response:', data);
  
      if (response.ok) {
        localStorage.setItem('token', data.token);
        console.log('Login successful! Redirecting...');
        history.push('/protected');
      } else {
        console.error('Error:', data.message);
        alert(data.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      alert('An error occurred. Please try again.');
    }
  };
  

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
