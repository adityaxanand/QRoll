import React from 'react';
import { Route, Redirect } from 'react-router-dom';

const ProtectedRoute = ({ component: Component, ...rest }) => {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');  // Get username from localStorage

  const currentTime = new Date().getHours();
  let greeting = '';
  
  if (currentTime < 12) {
    greeting = 'Good Morning';
  } else if (currentTime < 18) {
    greeting = 'Good Afternoon';
  } else {
    greeting = 'Good Evening';
  }

  return (
    <Route
      {...rest}
      render={(props) =>
        token ? (
          <div>
            <h1>{`${greeting}, ${username}!`}</h1>
            <Component {...props} />
          </div>
        ) : (
          <Redirect to="/login" />
        )
      }
    />
  );
};

export default ProtectedRoute;
