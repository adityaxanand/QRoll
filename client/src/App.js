import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Protected from './pages/Protected';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  return (
    <Router>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        
        {/* Protected Route */}
        <ProtectedRoute path="/protected" component={Protected} />
      </Switch>
    </Router>
  );
};

export default App;
