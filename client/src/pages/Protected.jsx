import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Protected = ({ token }) => {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }

    const fetchUserData = async () => {
      try {
        const response = await axios.get('https://qroll.onrender.com/api/auth/protected', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserData(response.data.user);
      } catch (error) {
        console.error('Error fetching protected data', error);
      }
    };

    fetchUserData();
  }, [token, navigate]);

  return (
    <div>
      <h2>Protected Route</h2>
      {userData ? (
        <div>
          <h3>Welcome, {userData.name}!</h3>
          <button>Scan QR Code</button>
          <button>Create Event</button>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default Protected;
