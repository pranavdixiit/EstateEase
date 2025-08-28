import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
import { Provider, useDispatch } from 'react-redux';
import store from './store';
import { fetchUser } from './features/auth/authSlice';
import App from './App';

const AuthLoader = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (localStorage.getItem('token')) {
      dispatch(fetchUser());
    }
  }, [dispatch]);

  return children;
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <Provider store={store}>
    <AuthLoader>
      <App />
    </AuthLoader>
  </Provider>,
);
