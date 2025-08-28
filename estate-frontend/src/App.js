import React, { useEffect } from 'react';
import { HashRouter as Router, Route, Switch, Redirect } from 'react-router-dom';

import { useSelector, useDispatch } from 'react-redux';

import Home from './pages/Home';
import Listings from './pages/Listings';
import Login from './pages/Login';
import Register from './pages/Register';
import Clients from './pages/Clients';
import Appointments from './pages/Appointments';
import PropertyDetail from './pages/PropertyDetail';
import SearchResults from './pages/SearchResults';


import { fetchUser } from './features/auth/authSlice';

const PrivateRoute = ({ component: Component, roles, ...rest }) => {
  const { user } = useSelector(state => state.auth);

  return (
    <Route
      {...rest}
      render={props =>
        !user ? (
          <Redirect to="/login" />
        ) : roles && !roles.includes(user.role) ? (
          <Redirect to="/" />
        ) : (
          <Component {...props} />
        )
      }
    />
  );
};

const AuthLoader = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(fetchUser());
    }
  }, [dispatch]);

  return children;
};

const App = () => (
  <AuthLoader>
    <Router>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />

       
<Route path="/search-results" component={SearchResults} />

        <Route path="/listings" component={Listings} />
        <Route path="/clients" component={Clients} />
        <Route path="/appointments" component={Appointments} />

        <Route path="/property/:id" component={PropertyDetail} />
      </Switch>
    </Router>
  </AuthLoader>
);

export default App;
