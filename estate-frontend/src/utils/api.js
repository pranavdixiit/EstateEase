// src/utils/api.js
const API_URL = process.env.REACT_APP_API_URL;

const api = async (endpoint, options = {}) => {
  const response = await fetch(`${API_URL}${endpoint}`, options);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'API request failed');
  }
  return response.json();
};

export default api;
