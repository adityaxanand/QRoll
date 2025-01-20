import React, { useState } from 'react';
import { useEffect } from 'react';
import axios from 'axios';

const Protected = () => {
  const [isAdmin, setIsAdmin] = useState(true);  // Set based on user role (for demo purposes)
  
  // const [userEmail, setUserEmail] = useState('user@example.com');  // Replace with actual user email
  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const response = await axios.get('/api/user/email'); // Replace with your actual API endpoint
        const email = response.data.email;
        console.log('User Email:', email);
        setUserEmail(email);  // Uncomment if you need to use the email in the component
      } catch (error) {
        console.error('Error fetching user email:', error);
      }
    };

    fetchUserEmail();
  }, []);

  const [userEmail, setUserEmail] = useState('');
  <div>
    <p>User Email: {userEmail}</p>
  </div>
  // Fetch user email from an API or authentication context in a real application

  return (
    <div>
      <h1>Welcome to the Dashboard</h1>
      <button onClick={() => alert('Scanning QR Code...')}>Scan QR Code</button>
      
      {isAdmin && (
        <button onClick={() => alert('Creating Event...')}>Create Event</button>
      )}
    </div>
  );
};

export default Protected;
