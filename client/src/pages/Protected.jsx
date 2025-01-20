import React, { useState } from 'react';

const Protected = () => {
  const [isAdmin, setIsAdmin] = useState(true);  // Set based on user role (for demo purposes)

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
