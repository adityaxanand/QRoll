import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Protected from './pages/Protected';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  return (
    <Router>
      <nav>
        <Link to="/login">Login</Link>
        <Link to="/signup">Signup</Link>
        {token && <Link to="/protected">Protected</Link>}
      </nav>
      <Routes>
        <Route path="/login" element={<Login setToken={setToken} />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/protected" element={<Protected token={token} />} />
      </Routes>
    </Router>
  );
}

export default App;
