import React from 'react';
import { useHistory } from 'react-router-dom';
import './LoginPopup.css'; // Ensure your CSS includes the styles you provided

const LoginPopup = ({ onClose }) => {
  const history = useHistory();

  const handleLoginClick = () => {
    onClose();
    history.push('/login');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Notification</h2>
        <p>Please login to continue</p>

        <div>
          <button className="login-button" onClick={handleLoginClick}>
            Login
          </button>
          <button className="close-button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPopup;
